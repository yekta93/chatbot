from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from io import BytesIO
from typing import Annotated, Callable, List, Literal
import uuid

import chromadb
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    UploadFile,
    status,
)
from beanie import PydanticObjectId
from langchain.schema import Document as LangchainDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from llama_parse import LlamaParse

from ..conf import chroma_conn_info
from ..minio_utils import get_object, insert_object_new
from ..models import __beanie_models__
from ..models.upload import UploadResponse, DocumentIDResponse
from ..models.document import Document, FileProcessingStatus
from ..models.user import User
from ..routes.auth import get_current_user

from ..cached_embeddings import OpenAIEmbeddingsWithCache

upload_document_router = APIRouter()
embeddings_with_cache = OpenAIEmbeddingsWithCache()


def generate_abstract(text: str, name: str) -> str:
    # POINT: variable name is not auxiliary, it is used in initialization.
    prompt_template = f"""
  Please analyze the following text and generate brief general summary that captures the main idea of the document that includes. use Persian.
    Text:
    {text}
    """
    llm = ChatOpenAI(
        model="gpt-4o-mini", temperature=0
    )  # TODO: add Logging if possible

    prompt = ChatPromptTemplate.from_messages(messages=("human", prompt_template))

    chain = prompt | llm | StrOutputParser()

    print(">>>>>>>>>>>>>>>>generating abstract")

    abstract = chain.invoke({"text": text})
    return abstract


async def llama_parser_func(document: Document) -> str:
    document.status.append(FileProcessingStatus(name="parsing file"))
    await document.save()

    parser = LlamaParse(result_type="markdown")
    file: bytes = get_object(document.minio_object_name)

    # parsing file should be async function
    docs_pages = await parser.aload_data(
        file_path=file, extra_info={"file_name": document.name}
    )
    doc_contents = [doc.text for doc in docs_pages]
    all_content = "\n".join(doc_contents)
    print(">>>>>>>>>>>>>>>>generating md file")

    return all_content


@upload_document_router.post("/", response_model=DocumentIDResponse)
async def upload_file(
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile,
    background_tasks: BackgroundTasks,
):

    if file.content_type != "application/pdf":
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="you can just upload pdf file",
        )

    try:
        minio_object_name = str(uuid.uuid4())
        file_content: BytesIO = file.file

        # 1 insert object_minio
        insert_object_new(
            file=file_content,
            object_name=minio_object_name,
            bucket_name="danayar-documents",
        )

        # 2 insert mongodb
        document = Document(
            name=f"{file.filename}",
            minio_object_name=minio_object_name,
            tags=[],
            is_content_available=True,
            owner=current_user.phone_num,
        )
        await document.insert()

        # 3 create background_tasks for rest of processing
        # background_tasks can run coroutine function
        background_tasks.add_task(
            process_file,
            document.id,
            llama_parser_func,
            generate_abstract,
            embeddings_with_cache,
        )

        return DocumentIDResponse(doc_id=document.id)

    except Exception as e:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=status_code, detail=str(e))


async def process_file(
    doc_id: PydanticObjectId,
    llama_parser_func: 0,
    generate_abstract: Callable,
    embeddings_with_cache: callable,
):
    print(">here is processing file")
    document = await Document.get(document_id=doc_id, with_children=True)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found with {doc_id}",
        )
    try:
        all_content = await llama_parser_func(document)

        # 2. Generating Abstract
        document.status.append(FileProcessingStatus(name="generating abstract"))
        await document.save()

        # generate abstract
        top_5_pages = all_content[:1000]
        # top_5_pages = [doc.text for doc in docs_pages[:1000]]
        top_5_pages_str = "\n".join(top_5_pages)
        abstract = generate_abstract(top_5_pages_str, document.name)

        # 3. inserting markdown file in minIO
        document.status.append(FileProcessingStatus(name="insert .md file in minIO"))
        await document.save()

        all_content_bytes = all_content.encode("utf-8")
        file_content_md: BytesIO = BytesIO(all_content_bytes)

        insert_object_new(
            file=file_content_md,
            object_name=document.minio_object_name,
            bucket_name="danayar-processed",
        )

        # 4. chunking content for chromadb
        document.status.append(FileProcessingStatus(name="chunking content"))
        await document.save()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2500,  # TODO: Tuning chunck_size
            chunk_overlap=500,
        )
        split_chunks = text_splitter.split_text(all_content)

        # 5. indexing data for chromadb
        document.status.append(
            FileProcessingStatus(name="indexing data to vector database")
        )
        await document.save()

        docs_for_chroma = [
            LangchainDocument(
                page_content=chunk, metadata={"org_doc_id": str(document.id)}
            )
            for chunk in split_chunks
        ]

        # connect to http chroma
        vector_store = Chroma(
            collection_name="document-chunks",
            embedding_function=embeddings_with_cache,
            client=chromadb.HttpClient(**chroma_conn_info),
        )

        vector_store.add_documents(
            documents=docs_for_chroma,
            ids=[f"{document.id}_{i}" for i in range(len(docs_for_chroma))],
        )

        # 6. inserting abstract in chromadb
        document.status.append(
            FileProcessingStatus(name="inserting abstract in chromadb")
        )
        await document.save()

        abstract_for_chroma = [
            LangchainDocument(
                page_content=abstract, metadata={"org_doc_id": str(document.id)}
            )
        ]

        vector_store = Chroma(
            collection_name="document-abstract",
            embedding_function=embeddings_with_cache,
            client=chromadb.HttpClient(**chroma_conn_info),
        )

        vector_store.add_documents(
            documents=abstract_for_chroma,
            ids=[f"{document.id}"],
        )

        print(">>>>>>>>>>>>>>>>>type(abstract):", type(abstract))
        abstract_bytes = abstract.encode("utf-8")
        abstract_bytes_IO: BytesIO = BytesIO(abstract_bytes)

        insert_object_new(
            file=abstract_bytes_IO,
            object_name=document.minio_object_name,
            bucket_name="danayar-abstract",
        )

        # 8. file upload successfully
        document.status.append(FileProcessingStatus(name="file upload successfully"))
        await document.save()

        # 9. Done
        document.status.append(FileProcessingStatus(name="done"))
        await document.save()

    except Exception as e:
        document.status.append(FileProcessingStatus(name="failed", error=str(e)))
        await document.save()


def status_to_state(
    status: List[FileProcessingStatus],
) -> Literal["done", "failed", "processing"]:
    match (status[-1].name):
        case "done":
            return "done"
        case "failed":
            return "failed"
        case _:
            return "processing"


@upload_document_router.get("/history", response_model=List[UploadResponse])
async def get_history_of_uploaded_files(
    current_user: Annotated[User, Depends(get_current_user)], limit: int = 20
) -> List[UploadResponse]:

    owner = current_user.phone_num
    docs = (
        Document.find(
            Document.owner == owner,
            with_children=True,
        )
        .sort(-Document.creation_ts)
        .limit(limit)
    )
    upload_responses = []
    async for document in docs:
        upload_responses.append(
            UploadResponse(
                doc_id=document.id,
                name=document.name,
                creation_ts=document.creation_ts,
                status=document.status,
                number_total_steps=8,
                state=status_to_state(document.status),
            )
        )
    return upload_responses


@upload_document_router.get("/{doc_id}", response_model=UploadResponse)
async def get_file_status(
    current_user: Annotated[User, Depends(get_current_user)], doc_id: PydanticObjectId
) -> UploadResponse:

    document = await Document.get(document_id=doc_id, with_children=True)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    upload_res = UploadResponse(
        doc_id=doc_id,
        name=document.name,
        creation_ts=document.creation_ts,
        status=document.status,
        number_total_steps=8,
        state=status_to_state(document.status),
    )
    return upload_res

from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Annotated, Any, AsyncIterator, Dict, List, Optional

import chromadb
from beanie import PydanticObjectId
from beanie.odm.queries.find import FindMany
from fastapi import APIRouter, Depends, HTTPException, Query, status
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

from ..models.document import (
    Document,
    DocumentResponse,
    ContractDocument,
    ItemDisplay,
    display_info,
    display_info_all_docs,
)
from ..models.group import DocumentGroup, Group
from ..minio_utils import get_link_of_object, get_object
from ..utils import gen_details_for_exception
from ..models.user import User
from .auth import get_current_user
from .group import resolve_to
from ..conf import chroma_conn_info


document_router = APIRouter()


async def get_docs_from_doc_ids(
    doc_ids: List[PydanticObjectId],
    limit: int = 100,
) -> AsyncIterator[Document]:
    for id in doc_ids[:limit]:
        doc = await Document.get(id, with_children=True)
        yield doc


async def get_docs_from_filter(
    group_id: Optional[PydanticObjectId],
    tags: Optional[List[str]],
    limit: int = 100,
) -> FindMany[Document]:
    if group_id is not None:
        group = await Group.get(document_id=group_id, with_children=True)
        if group is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=gen_details_for_exception("Group not found."),
            )
        if resolve_to(group=group) != "documents":
            raise HTTPException(
                status_code=status.HTTP_418_IM_A_TEAPOT,
                detail=gen_details_for_exception(
                    "I can not handel groups which `group.resolve_to` is not `documents`"
                ),
            )
        tags = group.filter_tags
        assert tags is not None, "it must be some logical error in the coded"

    if tags and len(tags) > 0:
        docs = Document.find(
            {"tags": {"$all": tags}},
            limit=limit,
            with_children=True,
        )
    else:
        docs = Document.find_all(limit=limit, with_children=True)

    return docs


# TODO: solve this problem: extract metadata(now metadata filters by serializable type)
async def extract_metadata(doc: Document) -> Dict[str, Any]:
    doc_dict = doc.model_dump()
    # all_fields = set(doc.model_fields.keys())
    # standard_fields = set(Document.model_fields.keys())
    # metadata_fields = all_fields - standard_fields
    # return {field: doc_dict[field] for field in metadata_fields}

    return {k: v for k, v in doc_dict.items() if type(v) in (str, datetime, int)}


async def convert_doc_to_response(doc: Document) -> DocumentResponse:
    metadata = await extract_metadata(doc)
    return DocumentResponse(
        doc_id=doc.id,
        name=doc.name,
        creation_ts=doc.creation_ts,
        src=get_link_of_object(doc.minio_object_name),
        tags=doc.tags,
        metadata=metadata,
    )


@document_router.get("/", response_model=List[DocumentResponse])
async def get_docs(
    current_user: Annotated[User, Depends(get_current_user)],
    group_id: Optional[PydanticObjectId] = None,
    doc_ids: Optional[List[PydanticObjectId]] = Query(None),
    tags: Optional[List[str]] = Query(None),
    limit: int = 100,
) -> List[DocumentResponse]:

    if doc_ids is not None:
        if (group_id is not None) or (tags is not None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=gen_details_for_exception(
                    "Provide only one of 'group_id', 'doc_ids', 'tags', but not both."
                ),
            )
        docs = get_docs_from_doc_ids(
            doc_ids=doc_ids,
            limit=limit,
        )
    else:
        if (group_id is not None) and (tags is not None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=gen_details_for_exception(
                    "Provide either 'group_id' or 'tags', but not both."
                ),
            )
        docs = await get_docs_from_filter(
            group_id=group_id,
            tags=tags,
            limit=limit,
        )

    res: List[DocumentResponse] = [
        await convert_doc_to_response(doc=doc) async for doc in docs
    ]

    return res


@document_router.get("/display/", response_model=Dict[str, ItemDisplay])
async def fields_to_display(
    current_user: Annotated[User, Depends(get_current_user)],
    group_id: Optional[PydanticObjectId] = None,
    doc_id: Optional[PydanticObjectId] = None,
    doc_ids: Optional[List[PydanticObjectId]] = Query(None),
    tags: Optional[List[str]] = Query(None),
    partial: bool = True,
) -> Dict[str, ItemDisplay]:

    if sum(bool(param) for param in [group_id, doc_id, tags]) > 1:
        raise ValueError(
            "Parameters 'group_id', 'doc_id', and 'tags' are mutually exclusive."
        )
    document = (
        None
        if doc_id is None
        else await Document.get(document_id=doc_id, with_children=True)
    )

    documents = (
        [document]
        if group_id is None
        else await (await get_docs_from_filter(group_id=group_id, tags=None)).to_list()
    )

    is_contract = all(isinstance(doc, ContractDocument) for doc in documents)

    match (is_contract, partial):
        case (True, True):
            metadata_keys = ["subject", "year", "employer", "total_amount"]
            display_info_selected = display_info

        case (False, True) | (False, False):
            metadata_keys = ["name", "creation_ts"]
            display_info_selected = display_info_all_docs

        case (True, False):
            metadata_keys = [
                "year",
                "start_date",
                "duration_in_month",
                "subject",
                "related_product_or_service",
                "employer",
                "contractor",
                "total_amount",
                "guarantee_amount",
            ]
            display_info_selected = display_info

    result = {key: display_info_selected[key] for key in metadata_keys}

    return result


@document_router.get("/{doc_id}", response_model=DocumentResponse)
async def get_doc(
    current_user: Annotated[User, Depends(get_current_user)], doc_id: PydanticObjectId
) -> DocumentResponse:
    doc = await Document.get(document_id=doc_id, with_children=True)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=gen_details_for_exception("Document not found."),
        )
    doc_response = await convert_doc_to_response(doc)
    return doc_response


@document_router.get("/similars/{doc_id}", response_model=List[DocumentResponse])
async def docs_similars(
    doc_id: PydanticObjectId, limit: int = 3
) -> List[DocumentResponse]:

    doc = await Document.get(document_id=doc_id, with_children=True)
    object_name = doc.minio_object_name
    print(">>>>>>>>>>>>>object_name= ", object_name)

    document_data_bytes = get_object(
        object_name=object_name, bucket_name="danayar-abstract"
    )

    abstract = document_data_bytes.decode("utf-8")
    print(">>>>>>>>>>>>>abstract= ", abstract[:50])

    chroma_client = chromadb.HttpClient(**chroma_conn_info)
    vector_store = Chroma(
        collection_name="document-abstract",
        embedding_function=OpenAIEmbeddings(),
        client=chroma_client,
    )

    doc_ids = [
        abstract.metadata["org_doc_id"]
        for abstract in vector_store.similarity_search(query=abstract, k=limit)
    ]
    print(">>>>>>>>>>>>> doc_ids:", doc_ids)
    docs = get_docs_from_doc_ids(
        doc_ids=doc_ids,
        limit=limit,
    )

    documents: List[DocumentResponse] = [
        await convert_doc_to_response(doc=doc) async for doc in docs
    ]

    return documents


@document_router.get("/summary/{doc_id}")
async def summary(doc_id: PydanticObjectId) -> JSONResponse:

    doc = await Document.get(document_id=doc_id, with_children=True)
    object_name = doc.minio_object_name
    print(">>>>>>>>>>>>>object_name = ", object_name)

    # abstract
    document_data_bytes = get_object(
        object_name=object_name, bucket_name="danayar-abstract"
    )

    abstract = document_data_bytes.decode("utf-8")

    return JSONResponse(content={"data": abstract})


@document_router.get("/content/{doc_id}")
async def page_content(doc_id: PydanticObjectId) -> JSONResponse:

    doc = await Document.get(document_id=doc_id, with_children=True)
    object_name = doc.minio_object_name

    # document
    document_data_bytes = get_object(
        object_name=object_name, bucket_name="danayar-processed"
    )

    document = document_data_bytes.decode("utf-8")

    print(">>>>>>>>>>>>>document = ", document[:50])

    return JSONResponse(content={"data": document})

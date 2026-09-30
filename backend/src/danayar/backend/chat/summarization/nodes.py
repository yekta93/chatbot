import asyncio
from typing import List
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from langchain.text_splitter import CharacterTextSplitter
from langchain.chains.combine_documents import acollapse_docs, split_list_of_docs
from langchain.schema import Document
from langgraph.constants import Send

from .state import SummaryState
from backend.chat.utils import TokenUsageLogger

from backend.minio_utils import get_object
from backend.models.document import Document as DanayarDocument

llm_ = ChatOpenAI(model="gpt-4o-mini")


async def get_doc_with_ids(state: SummaryState) -> List[Document]:
    doc_id = state["doc_id"]
    token_max = 32_000

    doc = await DanayarDocument.get(document_id=doc_id, with_children=True)

    object_name = doc.minio_object_name
    print(">>>>>>>>>>>>>object_name = ", object_name)

    document_data = get_object(object_name=object_name, bucket_name="danayar-processed")

    document_text = document_data.decode("utf-8")

    # Extract 'ids' from document metadata and assert they are sorted
    ids = getattr(doc, "ids", [])
    assert ids == sorted(ids), "Error: 'ids' are not sorted."

    docs = [Document(page_content=document_text)]

    text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=token_max, chunk_overlap=50
    )

    split_docs = text_splitter.split_documents(docs)

    return {"contents": split_docs}


def length_function(documents: List[Document]) -> int:
    """Get number of tokens for input contents."""
    return sum(llm_.get_num_tokens(doc.page_content) for doc in documents)


async def generate_summary(state: SummaryState):

    theme = state["theme"]
    theme_instruction = "use {theme} . " if theme else ""

    map_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """\
You are an expert summarization assistant, designed to extract key details from documents such as contracts, papers, statements, and other similar texts. Your task is to generate concise summaries that include the critical information such as Contract Number,Date of Contract, signed,Subject,Employer and somethings user wants.
Make sure your summary highlights the most important elements and presents them clearly, while maintaining the accuracy of the information. {theme_instruction}language should be Persian with the following:\\n\\n{context}""",
            )
        ]
    )
    prompt = map_prompt.invoke(
        dict(context=state["content"], theme_instruction=theme_instruction)
    )

    # response = await llm.ainvoke(prompt)
    # return {"summaries": [response.content]}
    llm_with_callback = llm_.with_config(
        callbacks=[
            TokenUsageLogger(
                user_identifier=state["user_identifier"],
                exec_id=state["exec_id"],
                func_info=TokenUsageLogger.get_func_info(),
            )
        ]
    )
    responses = await asyncio.gather(llm_with_callback.ainvoke(prompt))
    return {"summaries": [response.content for response in responses]}


def map_summaries(state: SummaryState):
    return [
        Send(
            node="generate_summary",
            arg={
                "content": content,
                "user_identifier": state["user_identifier"],
                "exec_id": state["exec_id"],
                "theme": state["theme"],
            },
        )
        for content in state["contents"]
    ]


def collect_summaries(state: SummaryState):
    return {
        "collapsed_summaries": [Document(summary) for summary in state["summaries"]]
    }


def get_reduce(user_identifier: str, exec_id: str):
    async def _reduce(input: dict) -> str:
        reduce_template = """
The following is a set of summaries:
{docs}
Take these and distill it into a final, consolidated summary
of the main themes.
Final summary should be Persian.
        """
        reduce_prompt = ChatPromptTemplate([("human", reduce_template)])
        # prompt = reduce_prompt.invoke(input)
        prompt = reduce_prompt.invoke(
            {"docs": "\n".join(str(input))}
        )  # Avoid unnecessary dict
        llm_with_callback = llm_.with_config(
            callbacks=[
                TokenUsageLogger(
                    user_identifier=user_identifier,
                    exec_id=exec_id,
                    func_info=TokenUsageLogger.get_func_info(),
                )
            ]
        )
        response = await llm_with_callback.ainvoke(prompt)
        return response.content

    return _reduce


async def collapse_summaries(state: SummaryState):
    doc_lists = split_list_of_docs(
        state["collapsed_summaries"], length_function, token_max
    )
    # results = []
    # for doc_list in doc_lists:
    # collapsed_content = await acollapse_docs(doc_list, _reduce)
    # results.append(collapsed_content)
    _reduce = get_reduce(state["user_identifier"], state["exec_id"])
    results = await asyncio.gather(
        *(acollapse_docs(doc_list, _reduce) for doc_list in doc_lists)
    )

    return {"collapsed_summaries": results}


async def generate_final_summary(state: SummaryState):
    _reduce = get_reduce(state["user_identifier"], state["exec_id"])
    response = await _reduce(state["collapsed_summaries"])
    return {"final_summary": response}

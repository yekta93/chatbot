import asyncio
from typing import List
import inspect
import logging
import os

import chromadb
from langchain_chroma.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.runnables import RunnableLambda
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel, Field


from .state import State
from backend.chat.human_in_the_loop import AskHumanTool
from backend.chat.utils import TokenUsageLogger
from backend.conf import chroma_conn_info

chroma_client = chromadb.HttpClient(**chroma_conn_info)
chroma_client.heartbeat()

logger = logging.getLogger(__name__)

if log_level := os.getenv("LOG_LEVEL"):
    logger.setLevel(int(log_level))


# llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm_large_ = ChatOpenAI(model="gpt-4o", temperature=0)

# human_feedback = ToolNode(tools=[AskHumanTool()], handle_tool_errors=False)


def retrieve_docs(state: State) -> dict:
    question = state["question"]

    vector_store = Chroma(
        collection_name="document-chunks",
        embedding_function=OpenAIEmbeddings(),
        client=chroma_client,
    )
    docs = vector_store.similarity_search(query=question, k=5)
    return {"docs": docs}


async def augment_and_generate(state: State) -> dict:
    img = state.get("img")
    img_description = state.get("img_description")
    question = state["question"]

    system_prompt = """You are a highly intelligent and helpful AI assistant. According to the user's question and the provided documents:
Answer the user's question using information from the available documentation.
In your answer, ensure the following:
Reference the relevant sections of the documentation and citations from: {context}.
Format your response clearly with the following tools for better readability:
Use bullet points for lists or key takeaways if it is necessary.
Apply bold or italic for emphasis on important concepts.
Use appropriate headings and subheadings if needed.
Language: The answer should be in Persian.
{image_prompt}
"""
    # If user's question is ambiguous, ask for clarification using AskHumanTool.

    if img:
        image_prompt = f"An Image is retrieved and will be shown to user; mention the retrieved image in your answer properly. image description: {
            img_description}.Ensure the prompt contains a clear textual description of what should be visualized."
    else:
        image_prompt = ""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{input}"),
        ]
    )

    class CitedAnswer(BaseModel):
        """Answer the user question based only on the given sources, and cite the sources used."""

        answer: str = Field(
            ...,
            description="The answer to the user question, which is based only on the given sources.",
        )
        citations: List[int] = Field(
            ...,
            description="The specific index of the sources which justify the answer.",
        )

    structured_llm_with_callback = llm_large_.with_structured_output(
        CitedAnswer
    ).with_config(
        callbacks=[
            TokenUsageLogger(
                user_identifier=state["user_identifier"],
                exec_id=state["exec_id"],
                func_info=TokenUsageLogger.get_func_info(),
            )
        ]
    )
    retriever = RunnableLambda(lambda _: state["docs"])

    def format_docs_with_id(docs: List[Document]) -> str:

        formatted = [
            f"index of source: {i}  \nArticle Snippet: {doc.page_content}"
            for i, doc in enumerate(docs)
        ]
        # logger.debug(
        #     "%s >> formatted_doc_sample >> %s",
        #     __name__,
        #     formatted[0][:50],
        # )
        return "\n\n" + "\n\n".join(formatted)

    rag_chain_from_docs = (
        RunnablePassthrough.assign(
            context=(lambda x: format_docs_with_id(x["context"]))
        )
        | prompt
        | structured_llm_with_callback
    )

    retrieve_docs = (lambda x: x["input"]) | retriever
    chain = RunnablePassthrough.assign(context=retrieve_docs).assign(
        answer=rag_chain_from_docs
    )

    result = await chain.ainvoke({"input": question, "image_prompt": image_prompt})

    references = {
        state["docs"][ref_index].metadata["org_doc_id"]
        for ref_index in result["answer"].citations
    }

    return {
        "text": result["answer"].answer,
        "img": img,
        "plot": None,
        "references": list(references),
    }

import asyncio
import chromadb

from typing import List
from pydantic import BaseModel, Field

from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.documents import Document

from backend.chat.utils import TokenUsageLogger
from backend.conf import chroma_conn_info

from .state import GraphState


chroma_client = chromadb.HttpClient(**chroma_conn_info)
chroma_client.heartbeat()


llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm_large_ = ChatOpenAI(model="gpt-4o", temperature=0)


# Nodes
def retrieve(state: GraphState) -> dict:
    """
    Retrieve documents

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): New key added to state, documents, that contains retrieved documents
    """
    print("---RETRIEVE---")

    question = state["question"]

    vector_store = Chroma(
        collection_name="document-chunks",
        embedding_function=OpenAIEmbeddings(),
        client=chroma_client,
    )
    retriever = vector_store.as_retriever()

    documents = retriever.invoke(question)
    return {"documents": documents, "question": question}


def generate(state: GraphState) -> dict:
    question = state["question"]

    # Generate
    system_prompt = """You are a highly intelligent and helpful AI assistant. According to the user's question and the provided documents:
Answer the user's question using information from the available documentation.
In your answer, ensure the following:
Reference the relevant sections of the documentation and citations from: {context}.
Format your response clearly with the following tools for better readability:
Use bullet points for lists or key takeaways if it is necessary.
Apply bold or italic for emphasis on important concepts.
Use appropriate headings and subheadings if needed.
Language: The answer should be in Persian.
"""
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
    retriever = RunnableLambda(lambda _: state["documents"])

    def format_docs_with_id(docs: List[Document]) -> str:

        formatted = [
            f"index of source: {i}  \nArticle Snippet: {doc.page_content}"
            for i, doc in enumerate(docs)
        ]

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

    result = chain.invoke({"input": question})

    references = {
        state["documents"][ref_index].metadata["org_doc_id"]
        for ref_index in result["answer"].citations
    }
    return {
        "text": result["answer"].answer,
        "references": list(references),
    }


def grade_documents(state: GraphState) -> dict:
    """
    Determines whether the retrieved documents are relevant to the question.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates documents key with only filtered relevant documents
    """

    print("---CHECK DOCUMENT RELEVANCE TO QUESTION---")
    question = state["question"]
    documents = state["documents"]

    # Retrieval Grader

    class GradeDocuments(BaseModel):
        """Binary score for relevance check on retrieved documents."""

        binary_score: str = Field(
            description="Documents are relevant to the question, 'yes' or 'no'"
        )

    structured_llm_grader = llm.with_structured_output(GradeDocuments).with_config(
        callbacks=[
            TokenUsageLogger(
                user_identifier=state["user_identifier"],
                exec_id=state["exec_id"],
                func_info=TokenUsageLogger.get_func_info(),
            )
        ]
    )

    system = """You are a grader assessing relevance of a retrieved document to a user question. \n 
        It does not need to be a stringent test. The goal is to filter out erroneous retrievals. \n
        If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant. \n
        Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question."""
    grade_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            (
                "human",
                "Retrieved document: \n\n {document} \n\n User question: {question}",
            ),
        ]
    )

    retrieval_grader = grade_prompt | structured_llm_grader

    # Score each doc
    filtered_docs = []
    for d in documents:
        score = retrieval_grader.invoke(
            {"question": question, "document": d.page_content}
        )
        grade = score.binary_score
        if grade == "yes":
            print("---GRADE: DOCUMENT RELEVANT---")
            filtered_docs.append(d)
        else:
            print("---GRADE: DOCUMENT NOT RELEVANT---", d.id)
            continue
    return {"documents": filtered_docs, "question": question}


def transform_query(state: GraphState) -> dict:
    """
    Transform the query to produce a better question.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates question key with a re-phrased question
    """

    print("---TRANSFORM QUERY---")
    question = state["question"]
    documents = state["documents"]

    # Question Re-writer
    system = """You a question re-writer that converts an input question to a better version that is optimized \n 
        for vector store retrieval. Look at the input and try to reason about the underlying semantic intent / meaning."""
    re_write_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            (
                "human",
                "Here is the initial question: \n\n {question} \n Formulate an improved question.",
            ),
        ]
    )

    question_rewriter = re_write_prompt | llm | StrOutputParser()

    better_question = question_rewriter.invoke({"question": question})

    return {"documents": documents, "question": better_question}

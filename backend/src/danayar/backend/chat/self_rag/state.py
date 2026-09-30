from typing import List
from typing_extensions import TypedDict

from langchain_core.documents import Document


class GraphState(TypedDict):
    """
    Represents the state of our graph.

    Attributes:
        question: question
        generation: LLM generation
        documents: list of documents
    """

    question: str
    text: str
    documents: List[Document] | None
    references: List[str] | None
    user_identifier: str
    exec_id: str

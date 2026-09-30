from typing import List, TypedDict, TypedDict, Annotated

from PIL import Image
from PIL.Image import Image as PILImage
from langchain_core.documents import Document
from langgraph.graph.message import AnyMessage, add_messages


class State(TypedDict):
    user_identifier: str
    exec_id: str
    question: str
    docs: List[Document] | None
    img: PILImage | None
    img_description: str | None
    results: str
    text: str
    references: List[str] | None
    # messages: Annotated[list[AnyMessage], add_messages]

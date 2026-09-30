from typing import Annotated
from typing_extensions import TypedDict

from langgraph.graph.message import add_messages, AnyMessage


class State(TypedDict):
    user_identifier: str
    exec_id: str
    messages: Annotated[list[AnyMessage], add_messages]

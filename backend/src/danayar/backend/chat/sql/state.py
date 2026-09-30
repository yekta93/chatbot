from typing import Annotated, Optional
from typing_extensions import TypedDict

import pandas as pd

from langgraph.graph.message import add_messages, AnyMessage


class State(TypedDict):
    user_identifier: str
    exec_id: str
    messages: Annotated[list[AnyMessage], add_messages]
    query: Optional[str] = None

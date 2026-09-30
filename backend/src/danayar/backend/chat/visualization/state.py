from typing import Annotated, Optional
import pandas as pd

from typing_extensions import TypedDict
from plotly.graph_objs import Figure
from langgraph.graph.message import AnyMessage, add_messages


class State(TypedDict):
    user_identifier: str
    exec_id: str
    query: Optional[str]
    visualization_type: Optional[str]
    sql_exec_res: Optional[str]
    plotly_code: Optional[str]
    plot_created: bool
    messages: Annotated[list[AnyMessage], add_messages]
    messages_plot: Annotated[list[AnyMessage], add_messages]

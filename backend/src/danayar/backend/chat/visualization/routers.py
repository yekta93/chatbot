from typing import Literal

from langgraph.graph import END
from langchain_core.messages import ToolMessage
from langchain_core.messages.ai import AIMessage, AIMessageChunk
from langchain_core.messages.chat import ChatMessage, ChatMessageChunk
from langchain_core.messages.function import FunctionMessage, FunctionMessageChunk
from langchain_core.messages.human import HumanMessage, HumanMessageChunk
from langchain_core.messages.system import SystemMessage, SystemMessageChunk
from langchain_core.messages.tool import ToolMessageChunk
from langgraph.graph.message import MessagesState
from backend.chat.human_in_the_loop import AskHumanTool

from .tools import model_check_query_tool
from .state import State


def should_continue(
    state: State,
) -> Literal[
    "parse_to_str",
    "correct_query",
    "query_gen",
    # "human_feedback",
]:
    messages: list[
        AIMessage
        | HumanMessage
        | ChatMessage
        | SystemMessage
        | FunctionMessage
        | ToolMessage
        | AIMessageChunk
        | HumanMessageChunk
        | ChatMessageChunk
        | SystemMessageChunk
        | FunctionMessageChunk
        | ToolMessageChunk
    ] = state["messages"]
    last_message = messages[-1]

    if type(last_message) is ToolMessage and last_message.content.startswith("Error:"):
        return "query_gen"
    elif last_message.tool_calls[0]["name"] == "SubmitFinalAnswer":
        return "parse_to_str"
    elif last_message.tool_calls[0]["name"] == model_check_query_tool.name:
        return "correct_query"
    # elif last_message.tool_calls[0]["name"] == AskHumanTool().name:
    #     return "human_feedback"
    else:
        raise


def should_continue_plot(
    state: State,
) -> Literal["generate_plot", END]:
    plot_created = state["plot_created"]

    # if type(last_message) is ToolMessage and last_message.content.startswith("Error:"):
    #     return "generate_plot"
    if plot_created == None:
        return "generate_plot"
    else:
        return END

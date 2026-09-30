from typing import Literal

from langchain_core.messages import ToolMessage
from langchain_core.messages.ai import AIMessage, AIMessageChunk
from langchain_core.messages.chat import ChatMessage, ChatMessageChunk
from langchain_core.messages.function import FunctionMessage, FunctionMessageChunk
from langchain_core.messages.human import HumanMessage, HumanMessageChunk
from langchain_core.messages.system import SystemMessage, SystemMessageChunk
from langchain_core.messages.tool import ToolMessageChunk
from langgraph.graph.message import MessagesState
from langgraph.graph import END

from backend.chat.human_in_the_loop import AskHumanTool


def should_continue(
    state: MessagesState,
) -> Literal["human_feedback", END]:
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

    if last_message.tool_calls[0]["name"] == AskHumanTool().name:
        return "human_feedback"
    else:
        raise

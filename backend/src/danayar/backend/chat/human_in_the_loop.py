import inspect
import sys
from typing import Optional, Type

from langchain_core.callbacks import (
    AsyncCallbackManagerForToolRun,
    CallbackManagerForToolRun,
)
from langchain_core.messages import ToolMessage, AIMessage
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from langgraph.errors import NodeInterrupt


class AskHumanInput(BaseModel):
    question: str = Field(description="explain your question for user clearly")


class AskHumanTool(BaseTool):
    name: str = "AskHuman"
    description: str = (
        "useful for when you need to 1. ask user for clarification 2. ask users idea on a topic 3. any situation you want to talk to user"
    )
    args_schema: Type[BaseModel] = AskHumanInput
    return_direct: bool = True

    def _run(
        self, question: str, run_manager: Optional[CallbackManagerForToolRun] = None
    ) -> str:
        raise NodeInterrupt(question)

    @classmethod
    def gen_answer(cls, answer: str, llm_question: AIMessage) -> ToolMessage:
        for tc in llm_question.tool_calls:
            if tc["name"] == cls.model_fields["name"].default:
                return ToolMessage(
                    content=answer,
                    tool_call_id=tc["id"],
                )

        raise

    @classmethod
    def extract_llm_question(cls, llm_question: AIMessage) -> str:
        return llm_question.tool_calls[0]["args"]["question"]


def find_tool(name: str) -> AskHumanTool:
    current_module = sys.modules[__name__]
    for _, obj in inspect.getmembers(current_module):
        if (
            inspect.isclass(obj)
            and issubclass(obj, AskHumanTool)
            and obj.model_fields["name"].default == name
        ):
            return obj

    raise KeyError()


def extract_llm_question(llm_question: AIMessage) -> str:
    assert len(llm_question.tool_calls) == 1
    tool_call = llm_question.tool_calls[0]
    tool_name = tool_call["name"]
    tool_class = find_tool(name=tool_name)
    return tool_class.extract_llm_question(llm_question=llm_question)


def gen_answer(answer: str, llm_question: AIMessage) -> ToolMessage:
    assert len(llm_question.tool_calls) == 1
    tool_call = llm_question.tool_calls[0]
    tool_name = tool_call["name"]
    tool_class = find_tool(name=tool_name)
    return tool_class.gen_answer(answer=answer, llm_question=llm_question)

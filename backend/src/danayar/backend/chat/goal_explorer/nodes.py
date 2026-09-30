from uuid import uuid4
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage
from langchain_core.output_parsers import StrOutputParser

from backend.chat.utils import TokenUsageLogger, create_tool_node_with_fallback
from .state import State
from .tools import list_tables_tool, get_schema_tool

llm_large_ = ChatOpenAI(model="gpt-4o", temperature=0)

list_tables = create_tool_node_with_fallback(tools=[list_tables_tool])
get_schema = create_tool_node_with_fallback(tools=[get_schema_tool])


def first_tool_call(state: State) -> dict[str, list[AIMessage]]:
    return {
        "messages": [
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "sql_db_list_tables",
                        "args": {},
                        "id": "tool_abcd123",
                    }
                ],
            )
        ],
    }


def model_get_schema(state: State) -> dict[str, list[AIMessage]]:
    last_message = state["messages"][-1]
    list_tables_output = last_message.content
    table_names = [table_name.strip() for table_name in list_tables_output.split(",")]
    return {
        "messages": [
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "sql_db_schema",
                        "args": {"table_names": table_name},
                        "id": str(uuid4()),
                        "type": "tool_call",
                    }
                    for table_name in table_names
                ],
            )
        ]
    }


async def analyzer(state: State) -> dict[str, list[AIMessage]]:
    messages = state["messages"]

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are an intelligent assistant designed to clarify unclear or ambiguous questions posed by the user. Upon receiving a question , you will first evaluate the information available in the database with this schema. If the question is unclear or difficult to interpret, you will consider multiple possible meanings based on the context.
For instance, if asked, 'Who is the best sales manager?', you should explore different criteria such as 'Highest invoice total per sales manager, lowest outstanding invoices, or highest number of invoices per sales manager,' to determine the most relevant interpretation of 'best'.
""",
            ),
            ("placeholder", "{messages}"),
        ]
    )
    llm_large_with_callback = llm_large_.with_config(
        callbacks=[
            TokenUsageLogger(
                user_identifier=state["user_identifier"],
                exec_id=state["exec_id"],
                func_info=TokenUsageLogger.get_func_info(),
            )
        ]
    )
    chain = prompt | llm_large_with_callback | StrOutputParser()

    message = await chain.ainvoke(dict(messages=messages))

    return {"messages": [message]}

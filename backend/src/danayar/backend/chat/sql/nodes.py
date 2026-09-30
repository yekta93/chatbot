from uuid import uuid4
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage, ToolMessage

from pydantic import BaseModel, Field

# from agent.human_in_the_loop import AskHumanTool # TODO: add HIL later
from backend.chat.utils import TokenUsageLogger, create_tool_node_with_fallback
from .state import State
from .tools import (
    list_tables_tool,
    get_schema_tool,
    db_query_tool,
    model_check_query_tool,
)

# llm_ = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm_large_ = ChatOpenAI(model="gpt-4o", temperature=0)

list_tables = create_tool_node_with_fallback(tools=[list_tables_tool])
get_schema = create_tool_node_with_fallback(tools=[get_schema_tool])
execute_query = create_tool_node_with_fallback(tools=[db_query_tool])
correct_query = create_tool_node_with_fallback(tools=[model_check_query_tool])
# human_feedback = ToolNode(tools=[AskHumanTool()], handle_tool_errors=False)


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
        ]
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


async def query_gen(state: State) -> dict[str, list[AIMessage]]:
    """Add a node for a model to generate a query based on the question and schema"""

    class SubmitFinalAnswer(BaseModel):
        """Submit the final answer to the user based on the query results. Final answer should not contain any SQL code."""

        final_answer: str = Field(..., description="The final answer to the user")

    query_gen_system = """\
You are a SQL expert with a strong attention to detail.

Given an input question, output a syntactically correct PostgreSQL query to run, then look at the results of the query and return the answer.

DO NOT call any tool besides SubmitFinalAnswer to submit the final answer.

When generating the query:

Please select id column in results when ever it is possible. (do not rename it AS SOMETHING)

Always use aliases to convert column names  to a meaningful name in Persian; for example: `SELECT name AS "نام شخص"`

Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most 5 results.
You can order the results by a relevant column to return the most interesting examples in the database.
Never query for all the columns from a specific table, only ask for the relevant columns given the question.

If you get an error while executing a query, rewrite the query and try again.

If you get an empty result set, you should try to rewrite the query to get a non-empty result set. 
NEVER make stuff up if you don't have enough information to answer the query... just say you don't have enough information.

If you have enough information to answer the input question, simply invoke the appropriate tool to submit the final answer to the user.

SKIP ALL ROWS WHERE ANY COLUMN IS NULL or "N/A" or "".

DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.

When the user asks a question that cannot be answered based on the available tables in the database, explain why the current data does not support the answer.
Additionally, offer insightful suggestions for other questions the user might ask that can be answered with the available data. 
Always aim to guide the user towards making the best use of the existing database structure, while maintaining a helpful and professional tone.
Use Persian language to generate responses
If user requests for table, always use markdown format to show the table.
"""

    # If user's question is ambiguous, ask for clarification using AskHumanTool. For example ask user which table you want to use, if tables are similar

    query_gen_prompt = ChatPromptTemplate.from_messages(
        messages=[("system", query_gen_system), ("placeholder", "{messages}")]
    )
    llm_large_with_callback = llm_large_.bind_tools(
        tools=[
            model_check_query_tool,
            SubmitFinalAnswer,
            # AskHumanTool(),
        ],
        tool_choice=True,
    ).with_config(
        callbacks=[
            TokenUsageLogger(
                user_identifier=state["user_identifier"],
                exec_id=state["exec_id"],
                func_info=TokenUsageLogger.get_func_info(),
            )
        ]
    )
    query_gen = query_gen_prompt | llm_large_with_callback
    message = await query_gen.ainvoke(state)

    # Sometimes, the LLM will hallucinate and call the wrong tool. We need to catch this and return an error message.
    tool_messages = []
    if message.tool_calls:
        for tc in message.tool_calls:
            if not tc["name"] in [
                "SubmitFinalAnswer",
                model_check_query_tool.name,
                # AskHumanTool().name,
            ]:
                tool_messages.append(
                    ToolMessage(
                        content=f"Error: The wrong tool was called: {
                            tc['name']}. Please fix your mistakes. Remember to only call SubmitFinalAnswer to submit the final answer. Generated queries should be submitted using {model_check_query_tool.name} tool call.",
                        tool_call_id=tc["id"],
                    )
                )
    else:
        tool_messages = []

    return {"messages": [message] + tool_messages}


def mid_step(state: State) -> dict[str, list[AIMessage]]:
    last_msg: ToolMessage = state["messages"][-1]
    assert last_msg.name == "model_check_query_tool"
    query = last_msg.content
    return {
        "messages": [
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "db_query_tool",
                        "args": {"query": last_msg.content},
                        "id": "db_query_tool" + str(uuid4())[:8],
                    }
                ],
            )
        ],
        "query": query,
    }


def parse_to_str(state: State) -> dict[str, list[AIMessage]]:
    last_msg = state["messages"][-1]
    tool_call = last_msg.tool_calls[0]
    new_msg = AIMessage(content=tool_call["args"]["final_answer"])
    return {"messages": [new_msg]}

from typing import Annotated

from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage
from langchain_core.tools.base import BaseTool
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState


from backend.conf import postgres_conn_info, postgres_exclude_tables
from backend.chat.utils import TokenUsageLogger
from .state import State

db_ = SQLDatabase.from_uri(
    database_uri=postgres_conn_info,
    ignore_tables=postgres_exclude_tables,
)
tools_ = SQLDatabaseToolkit(
    db=db_,
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
).get_tools()

list_tables_tool: BaseTool = next(
    tool for tool in tools_ if tool.name == "sql_db_list_tables"
)
get_schema_tool: BaseTool = next(
    tool for tool in tools_ if tool.name == "sql_db_schema"
)


@tool
def db_query_tool(query: str) -> str:
    """
    Execute a SQL query against the database and get back the result.
    If the query is not correct, an error message will be returned.
    If an error is returned, rewrite the query, check the query, and try again.
    """
    result = db_.run_no_throw(query)
    if not result:
        return "Error: Query failed. Please rewrite your query and try again."

    return result


@tool
async def model_check_query_tool(
    query: Annotated[str, "sql query"],
    user_question: Annotated[
        str, "description of the query's purpose (what user asks)"
    ],
    state: Annotated[State, InjectedState],
) -> str:
    """
    Use this tool to execute a query against database. this tool double-checks if your query is correct before executing it.
    """

    query_check_system = """You are a SQL expert with a strong attention to detail.
        Double check the PostgreSQL query for common mistakes, including:
        - Using NOT IN with NULL values
        - Using UNION when UNION ALL should have been used
        - Using BETWEEN for exclusive ranges
        - Data type mismatch in predicates
        - Properly quoting identifiers
        - Using the correct number of arguments for functions
        - Casting to the correct data type
        - Using the proper columns for joins

        If there are any of the above mistakes, rewrite the query. If there are no mistakes, just reproduce the original query.

        You will call the appropriate tool to execute the query after running this check."""

    query_check_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", query_check_system),
            ("human", user_question),
            ("assistant", query),
            ("human", "please double check the PostgreSQL query."),
        ]
    )

    llm_large_with_tools_and_callback = (
        ChatOpenAI(model="gpt-4o", temperature=0)
        .bind_tools(
            tools=[db_query_tool],
            tool_choice="required",
        )
        .with_config(
            callbacks=[
                TokenUsageLogger(
                    user_identifier=state["user_identifier"],
                    exec_id=state["exec_id"],
                    func_info=TokenUsageLogger.get_func_info(),
                )
            ]
        )
    )
    query_check = query_check_prompt | llm_large_with_tools_and_callback
    res_msg: AIMessage = await query_check.ainvoke(input={})

    return res_msg.tool_calls[0]["args"]["query"]


@tool
async def model_check_plot_tool(
    plotly_code: Annotated[str, "plotly code"],
    sql: Annotated[str, "sql query related by database schema"],
    state: Annotated[State, InjectedState],
) -> str:
    """
    Use this tool to execute a python plotly code against database. this tool double-checks if your plotly code is correct before executing it.
    """

    plot_check_system = """\
You are a Python plotting expert with strong attention to detail.
Double-check the plot figure creation code for common mistakes, including:
- Using incorrect data types for x and y axes
- Failing to label axes and provide titles for the plot
- Not handling NaN values in the data
- Using incorrect plotting functions for the desired visualization type (e.g., using scatter instead of line)
- Forgetting to set the figure size or resolution
- Incorrectly setting plotting parameters or styles
- Not displaying or saving the plot correctly
- Overlapping elements in the plot (e.g., labels, legends)

If there are any of the above mistakes, rewrite the code. If there are no mistakes, just reproduce the original code.

You will then proceed to execute the plotting code after running this check."""

    query_check_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", plot_check_system),
            ("human", sql),
            ("assistant", plotly_code),
            ("human", "please double check the plotly_code."),
        ]
    )
    llm_large_with_callback = ChatOpenAI(model="gpt-4o", temperature=0).with_config(
        callbacks=[
            TokenUsageLogger(
                user_identifier=state["user_identifier"],
                exec_id=state["exec_id"],
                func_info=TokenUsageLogger.get_func_info(),
            )
        ]
    )
    query_check = query_check_prompt | llm_large_with_callback
    res_msg: AIMessage = await query_check.ainvoke(input={})

    return res_msg.tool_calls[0]["args"]["final_answer"]

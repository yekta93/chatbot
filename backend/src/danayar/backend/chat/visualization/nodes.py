from uuid import uuid4

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel, Field
import pandas as pd
import plotly.express as px

from backend.chat.utils import (
    TokenUsageLogger,
    create_tool_node_with_fallback,
    sql_query_to_df_and_str,
)

from backend.chat.human_in_the_loop import AskHumanTool
from .state import State

from .tools import (
    list_tables_tool,
    get_schema_tool,
    db_query_tool,
    model_check_query_tool,
    model_check_plot_tool,
)

llm_ = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm_large_ = ChatOpenAI(model="gpt-4o", temperature=0)

list_tables = create_tool_node_with_fallback(tools=[list_tables_tool])
get_schema = create_tool_node_with_fallback(tools=[get_schema_tool])
execute_query = create_tool_node_with_fallback(tools=[db_query_tool])
correct_query = create_tool_node_with_fallback(tools=[model_check_query_tool])


# human_feedback = ToolNode(tools=[AskHumanTool()], handle_tool_errors=False)


def init_and_first_tool_call(state: State) -> dict[str, list[AIMessage]]:
    human_message: HumanMessage = state["messages"][-1]

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
        "messages_plot": [human_message],
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
Your task is to write an PostgreSQL query that can be used to create visualizations such as bar, pie, or line charts.
Given an input question, output a syntactically correct PostgreSQL query to run, then look at the results of the query and return the answer.

DO NOT call any tool besides SubmitFinalAnswer to submit the final answer.

When generating the query:


Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most 5 results.
You can order the results by a relevant column to return the most interesting examples in the database.
Never query for all the columns from a specific table, only ask for the relevant columns given the question.

If you get an error while executing a query, rewrite the query and try again.

If you get an empty result set, you should try to rewrite the query to get a non-empty result set. 
NEVER make stuff up if you don't have enough information to answer the query... just say you don't have enough information.

If you have enough information to answer the input question, simply invoke the appropriate tool to submit the final answer to the user.

SKIP ALL ROWS WHERE ANY COLUMN IS NULL or "N/A" or "".

DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
The result of this query is going to be converted into plotly chart in the next steps.
If user's question is ambiguous, ask for clarification using AskHumanTool. For example ask user which table you want to use, if tables are similar
"""

    query_gen_prompt = ChatPromptTemplate.from_messages(
        messages=[("system", query_gen_system), ("placeholder", "{messages}")]
    )
    llm_large_with_tools_and_callback = llm_large_.bind_tools(
        tools=[
            model_check_query_tool,
            SubmitFinalAnswer,
            AskHumanTool(),
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
    query_gen = query_gen_prompt | llm_large_with_tools_and_callback
    message = await query_gen.ainvoke(state)

    # Sometimes, the LLM will hallucinate and call the wrong tool. We need to catch this and return an error message.
    tool_messages = []
    if message.tool_calls:
        for tc in message.tool_calls:
            if not tc["name"] in [
                "SubmitFinalAnswer",
                model_check_query_tool.name,
                AskHumanTool().name,
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
        "query": last_msg.content,
    }


def parse_to_str(state: State) -> dict[str, list[AIMessage]]:
    last_msg = state["messages"][-1]
    tool_call = last_msg.tool_calls[0]
    new_msg = AIMessage(content=tool_call["args"]["final_answer"])
    return {"messages": [new_msg]}


async def choose_visualization(state: State) -> dict:
    messages_plot: HumanMessage = state["messages_plot"]
    sql = state["query"]
    sql_exec_res, _ = sql_query_to_df_and_str(sql)

    if sql is None:
        raise
        return {"visualization_type": None}

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are an AI assistant that recommends appropriate data visualizations. Based on the user's question, SQL query, and query results, suggest the most suitable type of graph or chart to visualize the data. If no visualization is appropriate, indicate that. 
Available chart types and their use cases:
- Bar Graphs: Best for comparing categorical data or showing changes over time when categories are discrete and the number of categories is more than 2. Use for questions like "What are the sales figures for each product?" or "How does the population of cities compare? or "What percentage of each city is male?"
- Horizontal Bar Graphs: Best for comparing categorical data or showing changes over time when the number of categories is small or the disparity between categories is large. Use for questions like "Show the revenue of A and B?" or "How does the population of 2 cities compare?" or "How many men and women got promoted?" or "What percentage of men and what percentage of women got promoted?" when the disparity between categories is large.
- Scatter Plots: Useful for identifying relationships or correlations between two numerical variables or plotting distributions of data. Best used when both x axis and y axis are continuous. Use for questions like "Plot a distribution of the fares (where the x axis is the fare and the y axis is the count of people who paid that fare)" or "Is there a relationship between advertising spend and sales?" or "How do height and weight correlate in the dataset? Do not use it for questions that do not have a continuous x axis."
- Pie Charts: Ideal for showing proportions or percentages within a whole. Use for questions like "What is the market share distribution among different companies?" or "What percentage of the total revenue comes from each product?"
- Line Graphs: Best for showing trends and distributions over time. Best used when both x axis and y axis are continuous. Used for questions like "How have website visits changed over the year?" or "What is the trend in temperature over the past decade?". Do not use it for questions that do not have a continuous x axis or a time based x axis.

Consider these types of questions when recommending a visualization:
1. Aggregations and Summarizations (e.g., "What is the average revenue by month?" - Line Graph)
2. Comparisons (e.g., "Compare the sales figures of Product A and Product B over the last year." - Line or Column Graph)
3. Plotting Distributions (e.g., "Plot a distribution of the age of users" - Scatter Plot)
4. Trends Over Time (e.g., "What is the trend in the number of active users over the past year?" - Line Graph)
5. Proportions (e.g., "What is the market share of the products?" - Pie Chart)
6. Correlations (e.g., "Is there a correlation between marketing spend and revenue?" - Scatter Plot)

Provide your response in only one word:
ONLY use the following names: bar, horizontal_bar, line, pie, scatter

Select the appropriate visualization type based on persian such as :'خطی' : 'bar', 'میله ای':'line','دایره ای':'pie' ,'پراکندگی':'scatter'
""",
            ),
            (
                "assistant",
                "this is sql query which is related by user's question {sql}",
            ),
            ("assistant", " Query results: {sql_exec_res}"),
            ("placeholder", "{messages_plot}"),
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

    response = await chain.ainvoke(
        dict(sql_exec_res=sql_exec_res, sql=sql, messages_plot=messages_plot)
    )

    visualization_type = None
    if not "none" in response.lower():
        visualization_type = response

    return {"visualization_type": visualization_type}


async def generate_plot(state: State) -> dict:
    """Add a node for a model to generate a plot based on the question and schema"""

    visualization_type = state["visualization_type"]
    sql = state["query"]
    _, df = sql_query_to_df_and_str(sql)
    messages_plot = state["messages_plot"]

    if visualization_type is None:
        raise
        return {"plot": None}

    class SubmitFinalAnswer(BaseModel):
        """Submit the final answer as a plotly python code based on the query results."""

        plotly_code: str = Field(
            ..., description="one line python code starting with `fig = px.<YOUR_CODE>`"
        )

    parser = JsonOutputParser(pydantic_object=SubmitFinalAnswer)

    syatem_temp = """
You are an AI assistant equipped with the ability to interact with a dataframe referred to as `df`, 
containing the columns specified in `{columns}`. Data types of columns are {dtypes}. The dataframe is a result of executing the following query on data base. \n\nSQL Query: {sql}\n\n 
According to user's question, your task is to generate Plotly Python code that is {visualization}.
Plotly library is imported for you (`import plotly.express as px`) and you should return just one line code without any imports or any explanations.
Show title of chart into Persian.Translate the labels for the chart into Persian as well.

don't create an image using image generation capabilities, only plotly code.
{format_instructions} 
"""
    plot_gen_prompt = ChatPromptTemplate(
        messages=[("system", syatem_temp), ("placeholder", "{messages_plot}")]
    )
    llm_large_with_tools_and_callback = llm_large_.bind_tools(
        tools=[
            model_check_plot_tool,
            SubmitFinalAnswer,
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
    plot_gen = plot_gen_prompt | llm_large_with_tools_and_callback

    message = await plot_gen.ainvoke(
        {
            "columns": df.columns,
            "visualization": visualization_type,
            "dtypes": df.dtypes,
            "sql": sql,
            "messages_plot": messages_plot,
            "format_instructions": parser.get_format_instructions(),
        }
    )
    # Sometimes, the LLM will hallucinate and call the wrong tool. We need to catch this and return an error message.
    tool_messages = []
    if message.tool_calls:
        for tc in message.tool_calls:
            if not tc["name"] in [
                "SubmitFinalAnswer",
                model_check_plot_tool.name,
            ]:
                tool_messages.append(
                    ToolMessage(
                        content=f"Error: The wrong tool was called: {
                            tc['name']}. Please fix your mistakes. Remember to only call SubmitFinalAnswer to submit the final answer. Generated queries should be submitted using {model_check_plot_tool.name} tool call.",
                        tool_call_id=tc["id"],
                    )
                )
    else:
        tool_messages = []

    plotly_code = message.tool_calls[0]["args"]["plotly_code"]

    return {"messages": [message] + tool_messages, "plotly_code": plotly_code}


def run_plot(state: State) -> dict:
    messages_plot = state["messages_plot"]
    query = state["query"]
    plotly_code = state["plotly_code"]
    _, df = sql_query_to_df_and_str(query)

    try:
        local_namespace = {"df": df, "px": px, "pd": pd}
        exec(plotly_code, {}, local_namespace)
        plot = local_namespace["fig"]

        # TODO: this line should be deleted
        # plot.show()

    except Exception as e:
        return {messages_plot: [e], "plot_created": False}

    return {"plot_created": True}

from zoneinfo import ZoneInfo
from datetime import datetime
import jdatetime
from backend.conf import chroma_conn_info, postgres_conn_info, postgres_exclude_tables
import operator
from typing import Annotated, List, Literal, Optional
import chromadb
from typing_extensions import TypedDict

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from PIL.Image import Image as PILImage


from backend.conf import graph_debug_mode
from .utils import TokenUsageLogger, sql_query_to_df_and_str
from .sql import sql_graph
from .visualization import vis_graph
from .self_rag import rag_graph
from .goal_explorer import goals_explorer_graph, State as GoalsExplorerState
from .summarization import sum_graph


from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_core.tools.base import BaseTool


db_ = SQLDatabase.from_uri(
    database_uri=postgres_conn_info,
    ignore_tables=postgres_exclude_tables,
)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

tools_ = SQLDatabaseToolkit(
    db=db_,
    llm=llm,
).get_tools()

list_tables_tool: BaseTool = next(
    tool for tool in tools_ if tool.name == "sql_db_list_tables"
)

get_schema_tool: BaseTool = next(
    tool for tool in tools_ if tool.name == "sql_db_schema"
)

list_of_tables = list_tables_tool.invoke({})

tables_info = get_schema_tool.invoke({"table_names": list_of_tables})
# print(tables_info)


prompt = ChatPromptTemplate.from_template(
    "You are given the schema definitions of several database tables. "
    "For each table, generate a clear, concise description of its purpose and key columns.\n\n"
    "{tables_info}"
)

chain = prompt | llm | StrOutputParser()
tables_description = chain.invoke({"tables_info": tables_info})
# print(">>>>>>>>>>>>>>>>tables_description",tables_description)


class State(TypedDict):
    user_identifier: str
    exec_id: str
    messages: Annotated[list, add_messages]
    data_of_df: Optional[dict]
    plotly_code: Optional[str]
    plotly_sql: Optional[str]
    references: List[str]
    image: Optional[PILImage]


class DatabaseAgent(BaseModel):
    """An agent that can answer questions about a SQL database.."""

    user_question: str = Field(
        ...,
        description="provide user's question. It should be extracted from conversation. It should be clear and with full details. It should not contain any reference to any part of conversation. If user requests a table, mention it in the question.",
    )  # TODO: test if llm can handel refrences to previous messages


class VisualizationAgent(BaseModel):
    """An agent that can create visualizations like bar, pie, line charts and etc. from a SQL database. Note that tables are not kind of visualization."""

    user_question: str = Field(
        ...,
        description="provide user's question. It should be extracted from conversation. It should be clear and with full details. It should not contain any reference to any part of conversation.",
    )  # TODO: test if llm can handel refrences to previous messages


class RAGAgent(BaseModel):
    """An agent that retrieves relevant information from a knowledge base or document store to answer complex questions.
    related topics = [اصلاعات درباره شرکت امن افزار، اطلاعات درباره معماری دانایار، اطلاعات درباره بند های قراردادها]
    """

    user_question: str = Field(
        ...,
        description="provide user's question. It should be extracted from conversation. It should be clear and with full details. It should not contain any reference to any part of conversation.",
    )  # TODO: test if llm can handel refrences to previous messages


class GoalExplorerAgent(BaseModel):
    """An agent that can clarify ambiguous questions and analyze it.
    For example, if the user asks, 'Who are the most loyal customers?', you should analyze the concept of loyalty using the data available in the database. Clarify loyalty by considering factors such as 'the highest purchase amount per invoice, the greatest number of invoices, or the lowest outstanding receivable balance per invoice'.
    """

    user_question: str = Field(
        ...,
        description="provide user's question. It should be extracted from conversation. It should be clear and with full details. It should not contain any reference to any part of conversation.",
    )


class SummarizeAgent(BaseModel):
    """An agent that give summary of documents."""

    doc_id: str = Field(
        ...,
        description="doc_id is a specific id related by each documents.",
    )
    theme: Optional[str] = Field(
        ...,
        description="If the user specifies a theme for document summarization, apply it using this variable; otherwise, leave the parameter null,theme is tone of speaking such as academic,formal,detailed,journalistic...",
    )


class DocIDAgent(BaseModel):
    "An agent that can find the most similar document based on users' question."

    user_question: str = Field(
        ...,
        description="provide user's question. It should be extracted from conversation. ",
    )


class CurrentTime(BaseModel):
    "An agent that can find current time."

    time: str = Field(
        ...,
        description="Returns the current date and time in a human-readable format. ",
    )


system_prompt = """\
You are دانایار, an AI agent developed by Amn Afzar Gostareh Sharif's R&D team. You possess secure, comprehensive knowledge of the organization's data, including databases, documents (both digital and paper-based), and any additional informational sources. You provide precise and contextually accurate answers by referencing organizational data, and you are capable of producing management dashboards and data visualizations upon request in natural language.

When responding:

1. **Understand User Intent:** Interpret the user’s questions accurately, aiming to provide detailed and relevant answers.
2. **Refer to Data Sources:** Always reference the source of information when possible, allowing for transparency and traceability in your responses.
3. **Deliver Natural Responses:** Communicate in natural language, aiming for clarity, simplicity, and an informative tone that matches professional and organizational standards.
4. **Enable Insights and Analysis:** When asked, provide analytical insights, visualizations, or summaries to support decision-making, based on available data.
5. **Persian** always use Persian (فارسی) to communicate to user.

When the user asks a question that cannot be answered based on the available tables in the database, explain why the current data does not support the answer.
Additionally, offer insightful suggestions for other questions the user might ask that can be answered with the available data.


-for questions about database, there is description for every tables{tables_description} 

-If the user explicitly asks for a summary of a document, first call the doc_id_agent to retrieve the relevant document ID. Once you have the document ID, use the summarize_agent to generate the summary.

-If the answer to the user's question is not found using the database_agent, you should call the rag_agent to retrieve the information.
-If you need to understand current time you can call current_time_agent .  
"""

prompt = ChatPromptTemplate.from_messages(
    messages=[
        ("system", system_prompt),
        ("placeholder", "{messages}"),
    ]
)
llm_large_ = ChatOpenAI(model="gpt-4o", temperature=0)


async def danayar(state: State) -> State:

    last_message = state["messages"][-1]
    if isinstance(last_message, HumanMessage):
        metadata = {"user_input": last_message.content}
    else:
        metadata = None

    llm_large_with_tools_and_callback = llm_large_.bind_tools(
        tools=[
            DatabaseAgent,
            VisualizationAgent,
            RAGAgent,
            GoalExplorerAgent,
            SummarizeAgent,
            DocIDAgent,
            CurrentTime,
        ]
    ).with_config(
        callbacks=[
            TokenUsageLogger(
                user_identifier=state["user_identifier"],
                exec_id=state["exec_id"],
                func_info=TokenUsageLogger.get_func_info(),
                metadata=metadata,
            )
        ]
    )
    chain = prompt | llm_large_with_tools_and_callback
    print("danayar")
    res = await chain.ainvoke(
        {"messages": state["messages"], "tables_description": tables_description}
    )
    print("danayar-end")
    return {"messages": [res]}


async def database_agent(state: State) -> State:
    tool_call: dict = state["messages"][-1].tool_calls[0]
    user_question: str = tool_call["args"]["user_question"]
    tool_id = tool_call["id"]
    try:

        res = await sql_graph.ainvoke(
            input={
                "user_identifier": state["user_identifier"],
                "exec_id": state["exec_id"],
                "messages": [("human", user_question)],
            },
            debug=graph_debug_mode,
        )
        text = res["messages"][-1].content
        query = res.get("query")
        if query is not None:
            data, df = sql_query_to_df_and_str(query)
            data_of_df = list(df.to_dict("index").values())
        else:
            data = ""
            data_of_df = None

        return {
            "messages": [
                ToolMessage(
                    content=f"""\
Database agent runs query=`{query}` on database. results are: {data}
Database agent says: {text}""",
                    tool_call_id=tool_id,
                )
            ],
            "data_of_df": data_of_df,
        }
    except Exception as e:
        print("db >>>>", e)
        return {
            "messages": [
                ToolMessage(
                    content=f"For some reasons operation failed.",
                    tool_call_id=tool_id,
                )
            ]
        }


async def visualization_agent(state: State) -> State:
    tool_call: dict = state["messages"][-1].tool_calls[0]
    user_question: str = tool_call["args"]["user_question"]
    tool_id = tool_call["id"]
    try:
        res = await vis_graph.ainvoke(
            input={
                "user_identifier": state["user_identifier"],
                "exec_id": state["exec_id"],
                "messages": [("human", user_question)],
                "query": None,
                "plot_created": False,
                "plotly_code": None,
                "sql_exec_res": None,
                "visualization_type": None,
            },
            debug=graph_debug_mode,
        )
        plotly_code = res["plotly_code"]
        plotly_sql = res["query"]
        data, df = sql_query_to_df_and_str(plotly_sql)

        return {
            "messages": [
                ToolMessage(
                    content=f"""\
Visualization is created using this data : {data}
""",
                    tool_call_id=tool_id,
                )
            ],
            "plotly_code": plotly_code,
            "plotly_sql": plotly_sql,
        }
    except Exception as e:
        print("vis >>>>", e)
        return {
            "messages": [
                ToolMessage(
                    content=f"For some reasons operation failed.",
                    tool_call_id=tool_id,
                )
            ]
        }


async def rag_agent(state: State) -> State:
    tool_call: dict = state["messages"][-1].tool_calls[0]
    user_question: str = tool_call["args"]["user_question"]
    tool_id = tool_call["id"]

    res = await rag_graph.ainvoke(
        input={
            "user_identifier": state["user_identifier"],
            "exec_id": state["exec_id"],
            "question": user_question,
        },
        debug=graph_debug_mode,
    )

    # TODO: SDD img_description to sate
    if res.get("img_description"):
        img_des = f"An Image is retrieved and showed to user,  description is:{
            res['img_description']}"
    else:
        img_des = ""

    print('>>>>>>>>>>>>>>res["references"]', res["references"])
    return {
        "messages": [
            ToolMessage(
                content=f"""RAG agent says: {res["text"]} \n {img_des} """,
                tool_call_id=tool_id,
            )
        ],
        "references": res["references"],
        # "image": res["img"],
    }


async def goals_explorer_agent(state: State) -> State:
    tool_call: dict = state["messages"][-1].tool_calls[0]
    user_question: str = tool_call["args"]["user_question"]
    tool_id = tool_call["id"]

    res: GoalsExplorerState = await goals_explorer_graph.ainvoke(
        input={
            "user_identifier": state["user_identifier"],
            "exec_id": state["exec_id"],
            "messages": [("human", user_question)],
        },
        debug=graph_debug_mode,
    )
    return {
        "messages": [
            ToolMessage(
                content=f"""goals_explorer agent says: {
                    res["messages"][-1].content}  """,
                tool_call_id=tool_id,
            )
        ]
    }


async def summarize_agent(state: State) -> State:
    tool_call: dict = state["messages"][-1].tool_calls[0]
    tool_id = tool_call["id"]
    doc_id = tool_call["args"]["doc_id"]
    theme = tool_call["args"]["theme"]
    print(">>>>>>>>>>>>>>>>theme", theme)

    res = await sum_graph.ainvoke(
        input={
            "user_identifier": state["user_identifier"],
            "exec_id": state["exec_id"],
            "doc_id": str(doc_id),
            "theme": theme,
        },
        debug=graph_debug_mode,
    )

    assert "final_summary" in res, "there is an Error in summarization Agent"
    return {
        "messages": [
            ToolMessage(
                content=f"""summarize agent says: {res["final_summary"]} """,
                tool_call_id=tool_id,
            )
        ]
    }


class SelectionOutput(BaseModel):
    selected_index: int = Field(
        ..., description="Index (1-based) of the most relevant document."
    )


async def doc_id_agent(state: State) -> State:
    tool_call: dict = state["messages"][-1].tool_calls[0]
    tool_id = tool_call["id"]
    user_question: str = tool_call["args"]["user_question"]

    embedding_function = OpenAIEmbeddings()
    question_embedding = embedding_function.embed_query(user_question)

    chromadb_client = chromadb.HttpClient(**chroma_conn_info)
    collection = chromadb_client.get_collection("document-abstract")

    results = collection.query(query_embeddings=[question_embedding], n_results=5)

    # TODO: ADD owner: Related Access Control
    abstracts = results["documents"][0]
    metadatas = results["metadatas"][0]

    formatted_docs = "\n\n".join(f"[{i+1}] {doc}" for i, doc in enumerate(abstracts))

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are given five document texts and a user question. "
                "Choose the one most relevant to the question.\n\n"
                "User Question: {question}\n\n"
                "Documents:\n{docs}",
            )
        ]
    )
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    chain = prompt | llm.with_structured_output(SelectionOutput)

    output: SelectionOutput = await chain.ainvoke(
        {
            "question": user_question,
            "docs": formatted_docs,
        }
    )

    selected_index = output.selected_index - 1
    print(">>>>>>>>>>>>> selected_index of document = ", selected_index)

    doc_id = metadatas[selected_index]["org_doc_id"]
    print(">>>>>>>>>>>>> doc_id = ", doc_id)

    return {
        "messages": [
            ToolMessage(
                content=f"""doc_id_agent says: {doc_id}""",
                tool_call_id=tool_id,
            )
        ]
    }


def current_time_agent(state: State) -> State:
    tool_call: dict = state["messages"][-1].tool_calls[0]
    tool_id = tool_call["id"]

    now_tehran = datetime.now(ZoneInfo("Asia/Tehran"))
    shamsi_now = jdatetime.datetime.fromgregorian(datetime=now_tehran)
    time = shamsi_now.strftime("📅 امروز %A %d %B %Y - 🕒 ساعت %H:%M:%S (به‌وقت تهران)")

    print(">>>>>>>>>>>>>>>>time: ", time)
    tool_call["args"]["time"] = time

    return {
        "messages": [
            ToolMessage(
                content=f"""current_time_agent says: {time}""",
                tool_call_id=tool_id,
            )
        ]
    }


def router(
    state: State,
) -> Literal[
    END,
    "database_agent",
    "visualization_agent",
    "rag_agent",
    "goals_explorer_agent",
    "summarize_agent",
    "doc_id_agent",
    "current_time_agent",
]:
    messages = state["messages"]
    last_message = messages[-1]

    # TODO: add tool name validator later
    # if type(last_message) is ToolMessage and last_message.content.startswith("Error:"):
    #     return "query_gen"

    if len(last_message.tool_calls) == 0:
        return END
    elif last_message.tool_calls[0]["name"] == "DatabaseAgent":
        return "database_agent"
    elif last_message.tool_calls[0]["name"] == "VisualizationAgent":
        return "visualization_agent"
    elif last_message.tool_calls[0]["name"] == "RAGAgent":
        return "rag_agent"
    elif last_message.tool_calls[0]["name"] == "GoalExplorerAgent":
        return "goals_explorer_agent"
    elif last_message.tool_calls[0]["name"] == "SummarizeAgent":
        return "summarize_agent"
    elif last_message.tool_calls[0]["name"] == "DocIDAgent":
        return "doc_id_agent"
    elif last_message.tool_calls[0]["name"] == "CurrentTime":
        return "current_time_agent"
    else:
        raise


graph_builder = StateGraph(State)
graph_builder.add_node("danayar", danayar)
graph_builder.add_node("database_agent", database_agent)
graph_builder.add_node("visualization_agent", visualization_agent)
graph_builder.add_node("rag_agent", rag_agent)
graph_builder.add_node("goals_explorer_agent", goals_explorer_agent)
graph_builder.add_node("summarize_agent", summarize_agent)
graph_builder.add_node("doc_id_agent", doc_id_agent)
graph_builder.add_node("current_time_agent", current_time_agent)

graph_builder.add_edge(START, "danayar")
graph_builder.add_edge("database_agent", "danayar")
graph_builder.add_edge("visualization_agent", "danayar")
graph_builder.add_edge("rag_agent", "danayar")
graph_builder.add_edge("goals_explorer_agent", "danayar")
graph_builder.add_edge("summarize_agent", "danayar")
graph_builder.add_edge("doc_id_agent", "danayar")
graph_builder.add_edge("current_time_agent", "danayar")
graph_builder.add_conditional_edges("danayar", router)


graph = graph_builder.compile(checkpointer=MemorySaver())

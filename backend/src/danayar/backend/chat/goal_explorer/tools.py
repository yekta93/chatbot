from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_core.tools.base import BaseTool

from backend.conf import postgres_conn_info, postgres_exclude_tables

db_ = SQLDatabase.from_uri(
    database_uri=postgres_conn_info,
    ignore_tables=postgres_exclude_tables,
)
tools_ = SQLDatabaseToolkit(
    db=db_,
    # TODO: add Logging if possible
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
).get_tools()

list_tables_tool: BaseTool = next(
    tool for tool in tools_ if tool.name == "sql_db_list_tables"
)

get_schema_tool: BaseTool = next(
    tool for tool in tools_ if tool.name == "sql_db_schema"
)

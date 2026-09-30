import inspect
from langchain.callbacks.base import AsyncCallbackHandler
from typing import Any, Optional, Tuple

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableLambda, RunnableWithFallbacks
from langgraph.prebuilt import ToolNode
import pandas as pd
import psycopg
from beanie import init_beanie
from beanie.exceptions import CollectionWasNotInitialized
from motor.motor_asyncio import AsyncIOMotorClient

from backend.conf import postgres_conn_info, mongo_conn_str
from backend.models.log import TokenUsageLog


def create_tool_node_with_fallback(tools: list) -> RunnableWithFallbacks[Any, dict]:
    """
    Create a ToolNode with a fallback to handle errors and surface them to the agent.
    """
    return ToolNode(tools).with_fallbacks(
        [RunnableLambda(handle_tool_error)], exception_key="error"
    )


def handle_tool_error(state) -> dict:
    error = state.get("error")
    tool_calls = state["messages"][-1].tool_calls
    return {
        "messages": [
            ToolMessage(
                content=f"Error: {repr(error)}\n please fix your mistakes.",
                tool_call_id=tc["id"],
            )
            for tc in tool_calls
        ]
    }


def sql_query_to_df_and_str(query: str) -> Tuple[str | None, pd.DataFrame] | None:
    """Execute SQL query on the remote database and return results."""
    try:
        conn = psycopg.connect(postgres_conn_info.replace("+psycopg", ""))
        cursor = conn.cursor()

        res = ""
        all_data = []
        cursor.execute(query)
        for x in cursor.fetchall():
            res += str(list(x)) + ", "
            all_data.append(x)

        column_names = [description[0] for description in cursor.description]
        df = pd.DataFrame(data=all_data, columns=column_names)

        return f"[{res}]", df

    except Exception as e:
        # raise Exception(f"Error executing query: {str(e)}")
        # no need to print or log anything
        print(">>>> sql_query_to_df_and_str: ", e)
        return None, None


class TokenUsageLogger(AsyncCallbackHandler):
    def __init__(
        self,
        user_identifier: str,
        exec_id: str,
        func_info: dict,
        metadata: Optional[dict] = None,
    ):
        super().__init__()
        self.user_identifier = user_identifier
        self.exec_id = exec_id
        self.func_info = func_info
        self.metadata = metadata

    async def on_chat_model_start(self, *args, **kwargs):
        pass

    async def on_llm_end(self, outputs, **kwargs):
        if not self.is_beanie_initialized():
            print("Initializing beanie with TokenUsageLog")
            client = AsyncIOMotorClient(mongo_conn_str)
            await init_beanie(database=client.db_name, document_models=[TokenUsageLog])

        print("TokenUsageLog")
        log = TokenUsageLog(
            user_identifier=self.user_identifier,
            exec_id=self.exec_id,
            func_info=self.func_info,
            llm_output=outputs.llm_output,
            metadata=self.metadata,
        )
        await log.insert()

    @staticmethod  # TODO: move to utils
    def is_beanie_initialized():
        try:
            TokenUsageLog.get_settings()
        except CollectionWasNotInitialized as e:
            return False
        else:
            return True

    @staticmethod
    def get_func_info() -> str:
        frame_info = inspect.stack()[1]
        return {
            "file_name": frame_info.filename,
            "line_no": frame_info.lineno,
            "func_name": frame_info.function,
        }


# query = ('SELECT "فاکتور" AS "شماره فاکتور", "تاریخ" AS "تاریخ صدور", "نام '
#          'خریدار" AS "نام خریدار", "جمع فاکتور" AS "مبلغ کل فاکتور", "مبلغ '
#          'دریافتی" AS "مبلغ دریافتی", "مانده" AS "مانده بدهی" FROM '
#          'debt_collection LIMIT 6;')

# print(sql_query_to_df_and_str(query)[1].head())

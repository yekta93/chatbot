import operator
from typing import Annotated, Any, Optional, List, TypedDict
from langchain_core.documents import Document


class SummaryState(TypedDict):
    user_identifier: str
    exec_id: str
    doc_id: str
    contents: List[str]
    summaries: Annotated[list, operator.add]
    collapsed_summaries: List[Document]
    final_summary: str
    content: str
    theme: Optional[str]

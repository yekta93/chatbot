from typing import List, Literal
from langgraph.graph import END
from .state import SummaryState
from .nodes import length_function


def should_collapse(
    state: SummaryState,
) -> Literal["collapse_summaries", "generate_final_summary"]:
    token_max = 1000

    num_tokens = length_function(state["collapsed_summaries"])
    if num_tokens > token_max:
        return "collapse_summaries"
    else:
        return "generate_final_summary"

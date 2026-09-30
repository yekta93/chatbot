from langgraph.graph import START, END, StateGraph
from langgraph.graph.state import CompiledStateGraph

from .state import SummaryState
from .nodes import (
    get_doc_with_ids,
    generate_final_summary,
    generate_summary,
    collapse_summaries,
    collect_summaries,
    map_summaries,
)
from .routers import should_collapse


def get_compiled_sub_graph_sum() -> CompiledStateGraph:

    sub_graph = StateGraph(SummaryState)
    sub_graph.add_node("get_doc_with_ids", get_doc_with_ids)
    sub_graph.add_node("generate_summary", generate_summary)
    sub_graph.add_node("collect_summaries", collect_summaries)
    sub_graph.add_node("collapse_summaries", collapse_summaries)
    sub_graph.add_node("generate_final_summary", generate_final_summary)

    sub_graph.add_edge(START, "get_doc_with_ids")
    sub_graph.add_conditional_edges(
        "get_doc_with_ids", map_summaries, ["generate_summary"]
    )

    sub_graph.add_edge("generate_summary", "collect_summaries")
    sub_graph.add_conditional_edges("collect_summaries", should_collapse)
    sub_graph.add_conditional_edges("collapse_summaries", should_collapse)

    sub_graph.add_edge("generate_final_summary", END)

    return sub_graph.compile()


sum_graph: CompiledStateGraph = get_compiled_sub_graph_sum()


def gen_graph_image() -> None:
    png = sum_graph.get_graph(xray=True).draw_mermaid_png()
    with open("./graph_sum.png", "wb") as f:
        f.write(png)

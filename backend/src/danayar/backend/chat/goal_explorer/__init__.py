from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph

from .state import State
from .nodes import first_tool_call, model_get_schema, analyzer, list_tables, get_schema


def get_compiled_sub_graph_get_goals() -> CompiledStateGraph:

    sub_graph = StateGraph(State)
    sub_graph.add_node("first_tool_call", first_tool_call)
    sub_graph.add_node("list_tables", list_tables)
    sub_graph.add_node("get_schema", get_schema)
    sub_graph.add_node("model_get_schema", model_get_schema)
    sub_graph.add_node("analyzer", analyzer)

    sub_graph.add_edge(START, "first_tool_call")
    sub_graph.add_edge("first_tool_call", "list_tables")
    sub_graph.add_edge("list_tables", "model_get_schema")
    sub_graph.add_edge("model_get_schema", "get_schema")
    sub_graph.add_edge("get_schema", "analyzer")
    sub_graph.add_edge("analyzer", END)

    return sub_graph.compile()


goals_explorer_graph: CompiledStateGraph = get_compiled_sub_graph_get_goals()


def gen_graph_image() -> None:
    png = goals_explorer_graph.get_graph(xray=True).draw_mermaid_png()
    with open("./graph_goals_explorer_graph.png", "wb") as f:
        f.write(png)

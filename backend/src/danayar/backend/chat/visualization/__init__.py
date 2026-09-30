from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph
from langgraph.checkpoint.memory import MemorySaver

from .state import State
from .nodes import (
    init_and_first_tool_call,
    list_tables,
    get_schema,
    model_get_schema,
    query_gen,
    execute_query,
    correct_query,
    parse_to_str,
    mid_step,
    # human_feedback,
    choose_visualization,
    generate_plot,
    run_plot,
)

from .routers import should_continue, should_continue_plot


def get_compiled_sub_graph_vis() -> CompiledStateGraph:
    sub_graph = StateGraph(state_schema=State)
    sub_graph.add_node(node="init_and_first_tool_call", action=init_and_first_tool_call)
    sub_graph.add_node(node="list_tables", action=list_tables)
    sub_graph.add_node(node="get_schema", action=get_schema)
    sub_graph.add_node(node="model_get_schema", action=model_get_schema)
    sub_graph.add_node(node="query_gen", action=query_gen)
    sub_graph.add_node(node="execute_query", action=execute_query)
    sub_graph.add_node(node="correct_query", action=correct_query)
    sub_graph.add_node(node="parse_to_str", action=parse_to_str)
    sub_graph.add_node(node="mid_step", action=mid_step)
    # sub_graph.add_node(node="human_feedback", action=human_feedback)
    sub_graph.add_node(node="choose_visualization", action=choose_visualization)
    sub_graph.add_node(node="generate_plot", action=generate_plot)
    sub_graph.add_node(node="run_plot", action=run_plot)

    sub_graph.add_edge(start_key=START, end_key="init_and_first_tool_call")
    sub_graph.add_edge(start_key="init_and_first_tool_call", end_key="list_tables")
    sub_graph.add_edge(start_key="list_tables", end_key="model_get_schema")
    sub_graph.add_edge(start_key="model_get_schema", end_key="get_schema")
    sub_graph.add_edge(start_key="get_schema", end_key="query_gen")
    sub_graph.add_conditional_edges(
        source="query_gen",
        path=should_continue,
    )
    sub_graph.add_edge(start_key="parse_to_str", end_key="choose_visualization")
    sub_graph.add_edge(start_key="correct_query", end_key="mid_step")
    # sub_graph.add_edge(start_key="human_feedback", end_key="query_gen")
    sub_graph.add_edge(start_key="mid_step", end_key="execute_query")
    sub_graph.add_edge(start_key="execute_query", end_key="query_gen")
    sub_graph.add_edge(start_key="choose_visualization", end_key="generate_plot")
    sub_graph.add_edge(start_key="generate_plot", end_key="run_plot")
    sub_graph.add_conditional_edges(
        source="run_plot",
        path=should_continue_plot,
    )
    return sub_graph.compile()

    # return sub_graph.compile(checkpointer=MemorySaver())


vis_graph: CompiledStateGraph = get_compiled_sub_graph_vis()


def gen_graph_image() -> None:
    png = vis_graph.get_graph(xray=True).draw_mermaid_png()
    with open("./graph_vis.png", "wb") as f:
        f.write(png)

from pprint import pprint
from langgraph.graph import END, StateGraph, START
from langgraph.graph.state import CompiledStateGraph

from .nodes import generate, grade_documents, retrieve, transform_query
from .state import GraphState
from .nodes import generate, grade_documents, retrieve, transform_query
from .tools import decide_to_generate, grade_generation_v_documents_and_question


def get_compiled_sub_graph_rag() -> CompiledStateGraph:

    workflow = StateGraph(GraphState)
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("grade_documents", grade_documents)
    workflow.add_node("generate", generate)
    workflow.add_node("transform_query", transform_query)

    workflow.add_edge(START, "retrieve")
    workflow.add_edge("retrieve", "grade_documents")
    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {
            "transform_query": "transform_query",
            "generate": "generate",
        },
    )
    workflow.add_edge("transform_query", "retrieve")
    workflow.add_conditional_edges(
        "generate",
        grade_generation_v_documents_and_question,
        {
            "not supported": "generate",
            "useful": END,
            "not useful": "transform_query",
        },
    )
    return workflow.compile()


rag_graph = get_compiled_sub_graph_rag()


# # Run

# inputs = {"question": "مقاله دانایار از چند ماژول تشکیل شده است؟"}

# for output in rag_graph.stream(inputs, {"recursion_limit": 20}):
#     for key, value in output.items():
#         # Node
#         pprint(f"Node '{key}':")
#         # Optional: print full state at each node
#         # pprint.pprint(value["keys"], indent=2, width=80, depth=None)
#     pprint("\n---\n")

# # Final generation
# pprint(value["generation"])

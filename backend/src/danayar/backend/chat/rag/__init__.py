from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph
from langgraph.checkpoint.memory import MemorySaver

from .state import State
from .nodes import retrieve_docs, augment_and_generate

# human_feedback)

# from .routers import should_continue


#     def retrieve_imgs(self,State: dict) -> dict:
#         question =State["question"]

#         img = None
#         img_description = None

#         img_name = "danayar-arch.png"
#         img_caption = json.load(open("artifacts/Images/info.json"))[img_name]

#         system_prompt = """You are a useful AI assistant. According to the user's question and this image caption below,
# determine if this caption is relevant to the user's question. If it is relevant, return `Yes` else return `No` and nothing else.
# """
#         prompt = ChatPromptTemplate.from_messages(
#             [
#                 ("system", system_prompt),
#                 (
#                     "human",
#                     "The user's question is: `{question}` \nThe image's caption is: `{caption}`",
#                 ),
#             ]
#         )

#         chain = prompt | self.llm | StrOutputParser()

#         result = chain.invoke({"question": question, "caption": img_caption})

#         if "yes" in result.lower():
#             img = Image.open(f"artifacts/Images/{img_name}")
#             img_description = img_caption

#             logger.debug("%s >> img retrieved >> %s", __name__, img_description[:50])

#         return {
#             "img": img,
#             "img_description": img_description,
#         }


def get_compiled_sub_graph_rag() -> CompiledStateGraph:

    sub_graph = StateGraph(State)
    sub_graph.add_node("retrieve_docs", retrieve_docs)
    sub_graph.add_node("augment_and_generate", augment_and_generate)
    # sub_graph.add_node(node="human_feedback", action=human_feedback)

    sub_graph.set_entry_point("retrieve_docs")
    sub_graph.add_edge("retrieve_docs", "augment_and_generate")

    # sub_graph.add_conditional_edges(
    #         source="augment_and_generate",
    #         path=should_continue,
    #     )
    sub_graph.add_edge("augment_and_generate", END)
    return sub_graph.compile()

    # return sub_graph.compile(checkpointer=MemorySaver())


rag_graph: CompiledStateGraph = get_compiled_sub_graph_rag()


def gen_graph_image() -> None:
    png = rag_graph.get_graph(xray=True).draw_mermaid_png()
    with open("./graph_rag.png", "wb") as f:
        f.write(png)

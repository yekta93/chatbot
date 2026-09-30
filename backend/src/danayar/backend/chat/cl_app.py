import io
from io import BytesIO
import random
import os
import logging
import json
from pathlib import Path
from typing import Dict, Optional
from uuid import uuid4


import openai
import chainlit as cl
from chainlit.data.sql_alchemy import SQLAlchemyDataLayer
import pandas as pd
import plotly.express as px
from beanie import PydanticObjectId


from backend.chat.minio_storage_client import MinIOStorageClient
from backend.chat.utils import sql_query_to_df_and_str
from backend.minio_utils import get_link_of_object
from backend.routes.document import get_docs_from_doc_ids
from backend.chat.graph import graph
from backend.conf import graph_debug_mode, postgres_conn_info


logger = logging.getLogger(__name__)
if log_level := os.getenv("LOG_LEVEL"):
    logger.setLevel(int(log_level))

client = openai.OpenAI()
storage_client = MinIOStorageClient()


@cl.data_layer
def get_data_layer():
    return SQLAlchemyDataLayer(
        conninfo=postgres_conn_info.replace("psycopg", "asyncpg"),
        storage_provider=storage_client,
    )


@cl.on_chat_resume
async def on_chat_resume(thread):
    pass


# @cl.on_audio_chunk
# async def on_audio_chunk(chunk: cl.AudioChunk):
#     if chunk.isStart:
#         buffer = BytesIO()
#         buffer.name = f"input_audio.{chunk.mimeType.split('/')[1]}"
#         cl.user_session.set("audio_buffer", buffer)
#         cl.user_session.set("audio_mime_type", chunk.mimeType)

#     cl.user_session.get("audio_buffer").write(chunk.data)


# @cl.on_audio_end
# async def on_audio_end(elements: list):
#     audio_buffer: BytesIO = cl.user_session.get("audio_buffer")
#     audio_buffer.seek(0)
#     audio_file = audio_buffer.read()
#     audio_mime_type: str = cl.user_session.get("audio_mime_type")

#     input_audio_el = cl.Audio(mime=audio_mime_type, content=audio_file)
#     msg = cl.Message(
#         author="You",
#         type="user_message",
#         content="",
#         elements=[input_audio_el],
#     )

#     msg.content = json.dumps(
#         {
#             "type": input_audio_el.type,
#             "for_id": input_audio_el.for_id,
#             "id": input_audio_el.id,
#             "src": f"/project/file/{input_audio_el.chainlit_key}?session_id={cl.user_session.get('id')}",
#         },
#         ensure_ascii=False,
#     )
#     await msg.send()

#     whisper_input = (audio_buffer.name, audio_file, audio_mime_type)

#     transcription = client.audio.transcriptions.create(
#         model="whisper-1", file=whisper_input
#     ).text

#     logger.debug(
#         "%s >> transcription_user_voice.on_audio_end >> %s",
#         __name__,
#         transcription,
#     )
#     await main(cl.Message(content=transcription))


async def extract_second_msg_content(res):  # TODO: add types
    chainlit_element = None
    send_second_msg_content = None

    if res.get("img") is not None:
        img_byte_arr = io.BytesIO()
        res["img"].save(img_byte_arr, format="PNG")
        img = img_byte_arr.getvalue()
        chainlit_element = cl.Image(content=img, display="inline", size="large")
        send_second_msg_content = {
            "type": chainlit_element.type,
            "id": chainlit_element.id,
            "src": chainlit_element.url,
        }

    if res.get("plotly_code") is not None:
        plotly_code = res["plotly_code"]
        plotly_sql = res["plotly_sql"]
        _, df = sql_query_to_df_and_str(plotly_sql)

        local_namespace = {"df": df, "px": px, "pd": pd}
        exec(plotly_code, {}, local_namespace)
        plot = local_namespace["fig"]
        # plot.update_traces(
        #     marker_color="#54C3CD", hovertemplate="%{x}<br>%{y:.2f}K<extra></extra>"
        # )
        plot.update_layout(
            plot_bgcolor="#f5f5f5",
            font_family="vazirmatn",
            font_color="black",
            title_font_family="vazirmatn",
            title_font_color="black",
            legend_title_font_color="black",
            hoverlabel=dict(
                font_family="vazirmatn",
                font_size=12,
                font_color="black",
                bgcolor="white",
            ),
            title=dict(
                x=0.5,
                xanchor="center",
            ),
        )
        chainlit_element = cl.Plotly(figure=plot, display="inline", size="small")

        send_second_msg_content = {
            "type": chainlit_element.type,
            "id": chainlit_element.id,
            "src": chainlit_element.url,
        }

    if res.get("references"):  # None: False, empty list: False
        doc_ids = [PydanticObjectId(ref) for ref in res["references"]]
        docs = get_docs_from_doc_ids(doc_ids)
        minio_object_names = [doc.minio_object_name async for doc in docs]
        object_links = [
            get_link_of_object(minio_object_name)
            for minio_object_name in minio_object_names
        ]

        send_second_msg_content = {
            "type": "document",
            "id": str(uuid4()),
            "src": object_links[0],  # TODO: support multi references
        }

    if res.get("data_of_df") is not None and len(res.get("data_of_df")) > 0:
        if "id" in res["data_of_df"][0]:
            res["documents"] = [row["id"] for row in res["data_of_df"]]
        else:
            send_second_msg_content = {
                "type": "table",
                "id": str(uuid4()),
                "src": res["data_of_df"],
            }

    if res.get("documents") is not None:
        send_second_msg_content = {
            "type": "documents",
            "id": str(uuid4()),
            "src": "/?" + "&".join(f"doc_ids={doc_id}" for doc_id in res["documents"]),
        }
    return (
        send_second_msg_content,
        [chainlit_element] if chainlit_element is not None else None,
    )


# # this function should not be removed
# @cl.header_auth_callback
# def header_auth_callback(headers: Dict) -> Optional[cl.User]:
#     print(">>>>>>>>> header_auth_callback")
#     raise NotImplementedError("header_auth_callback is not implemented")


@cl.on_message
async def main(message: cl.Message):
    app_user: Optional[cl.User] = cl.user_session.get("user")
    if app_user is None:
        await cl.Message("کاربر احراز هویت نشد").send()
        return
    res_msg = cl.Message("")
    await res_msg.send()
    await res_msg.stream_token(" ")

    config = {
        "configurable": {"thread_id": cl.context.session.thread_id},
        "recursion_limit": 25,
    }

    if len(message.content) == 1:
        from langchain_core.messages import AIMessage

        res = {"messages": [AIMessage(content="یک پیام از سمت دانایار")]}
        match message.content:
            case "a":

                res["references"] = ["67595a97b59c35ccfe6b8293"]

            case "b":
                import pandas as pd

                res["data_of_df"] = list(
                    pd.DataFrame(
                        data=[("صمدی", "مشهد", "1380", "2000000000")] * 5,
                        columns=[
                            "نام همدل",
                            "بتای مربوطه",
                            "سال آغاز همدلی",
                            "سود پرداختی تا کنون",
                        ],
                    )
                    .to_dict("index")
                    .values()
                )
            case "c":
                res["documents"] = [
                    "672f17b8b8522ffc4477f767",
                    "672f17b9b8522ffc4477f768",
                    "672f17b9b8522ffc4477f769",
                ]
            case "d":
                from PIL import Image as PILImage

                res["img"] = PILImage.open(open("artifacts/sample_img.jpg", "rb"))
    else:
        graph_input = {
            "messages": [("human", message.content)],
            "data_of_df": None,
            "plotly_code": None,
            "plotly_sql": None,
            "user_identifier": app_user.identifier,
            "exec_id": str(uuid4()),
        }
        res = await graph.ainvoke(
            input=graph_input,
            config=config,
            stream_mode="values",
            debug=graph_debug_mode,
        )

    response_text = ""

    if res["messages"]:
        response_text += res["messages"][-1].content + "\n"

    for token in response_text.split(" "):
        await cl.sleep(random.random() * 0.1)
        await res_msg.stream_token(token + " ")
    # Note: in order to save llm's output to database as history, we should use `update` rather than `send`.
    await res_msg.update()

    send_second_msg_content, chainlit_elements = await extract_second_msg_content(res)

    if send_second_msg_content:
        await cl.Message(
            content=json.dumps(send_second_msg_content, ensure_ascii=False),
            elements=chainlit_elements,
        ).send()

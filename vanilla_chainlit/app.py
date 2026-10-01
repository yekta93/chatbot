from io import BytesIO
import audioop
import wave

import chainlit as cl
from chainlit.data.sql_alchemy import SQLAlchemyDataLayer
import numpy as np
from openai import AsyncOpenAI

openai_client = AsyncOpenAI()

# Define a threshold for detecting silence and a timeout for ending a turn
SILENCE_THRESHOLD = (
    3500  # Adjust based on your audio level (e.g., lower for quieter audio)
)
SILENCE_TIMEOUT = 1300.0  # Seconds of silence to consider the turn finished


@cl.password_auth_callback
def auth_callback(username: str, password: str):

    if (username, password) == ("admin", "admin"):
        return cl.User(
            identifier="admin", metadata={"role": "admin", "provider": "credentials"}
        )
    else:
        return None


# @cl.on_chat_start
# async def start():
#     await cl.Message(
#         content="Welcome to the Chainlit . Press `P` to talk!"
#     ).send()


# from chainlit.data.storage_clients import AzureStorageClient
# storage_client = AzureStorageClient(account_url="<your_account_url>", container="<your_container>")

@cl.data_layer
def get_data_layer():
    return SQLAlchemyDataLayer(conninfo="postgresql+asyncpg://postgres:postgres1234@postgresql:5432/postgres", storage_provider=None)

@cl.on_message
async def main(message: cl.Message):

    res_msg = cl.Message(
        content=f"Received: {message.content}",
    )

    await res_msg.send()
    await res_msg.update()


@cl.on_audio_start
async def on_audio_start():
    cl.user_session.set("silent_duration_ms", 0)
    cl.user_session.set("is_speaking", False)
    cl.user_session.set("audio_chunks", [])
    return True


@cl.on_audio_chunk
async def on_audio_chunk(chunk: cl.InputAudioChunk):
    audio_chunks = cl.user_session.get("audio_chunks")

    if audio_chunks is not None:
        audio_chunk = np.frombuffer(chunk.data, dtype=np.int16)
        audio_chunks.append(audio_chunk)

    # If this is the first chunk, initialize timers and state
    if chunk.isStart:
        cl.user_session.set("last_elapsed_time", chunk.elapsedTime)
        cl.user_session.set("is_speaking", True)
        return

    audio_chunks = cl.user_session.get("audio_chunks")
    last_elapsed_time = cl.user_session.get("last_elapsed_time")
    silent_duration_ms = cl.user_session.get("silent_duration_ms")
    is_speaking = cl.user_session.get("is_speaking")

    # Calculate the time difference between this chunk and the previous one
    time_diff_ms = chunk.elapsedTime - last_elapsed_time
    cl.user_session.set("last_elapsed_time", chunk.elapsedTime)

    # Compute the RMS (root mean square) energy of the audio chunk
    audio_energy = audioop.rms(
        chunk.data, 2
    )  # Assumes 16-bit audio (2 bytes per sample)

    if audio_energy < SILENCE_THRESHOLD:
        # Audio is considered silent
        silent_duration_ms += time_diff_ms
        cl.user_session.set("silent_duration_ms", silent_duration_ms)
        if silent_duration_ms >= SILENCE_TIMEOUT and is_speaking:
            cl.user_session.set("is_speaking", False)
            await process_audio()
    else:
        # Audio is not silent, reset silence timer and mark as speaking
        cl.user_session.set("silent_duration_ms", 0)
        if not is_speaking:
            cl.user_session.set("is_speaking", True)


async def speech_to_text(audio_file):
    response = await openai_client.audio.transcriptions.create(
        model="whisper-1", file=audio_file
    )

    return response.text


async def process_audio():
    # Get the audio buffer from the session
    if audio_chunks := cl.user_session.get("audio_chunks"):
        # Concatenate all chunks
        concatenated = np.concatenate(list(audio_chunks))

        # Create an in-memory binary stream
        wav_buffer = BytesIO()

        # Create WAV file with proper parameters
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)  # mono
            wav_file.setsampwidth(2)  # 2 bytes per sample (16-bit)
            wav_file.setframerate(24000)  # sample rate (24kHz PCM)
            wav_file.writeframes(concatenated.tobytes())

        # Reset buffer position
        wav_buffer.seek(0)

        cl.user_session.set("audio_chunks", [])

    frames = wav_file.getnframes()
    rate = wav_file.getframerate()

    duration = frames / float(rate)
    if duration <= 1.71:
        print("The audio is too short, please try again.")
        return

    audio_buffer = wav_buffer.getvalue()

    input_audio_el = cl.Audio(content=audio_buffer, mime="audio/wav")

    whisper_input = ("audio.wav", audio_buffer, "audio/wav")
    transcription = await speech_to_text(whisper_input)

    await cl.Message(
        author="You",
        type="user_message",
        content=transcription,
        elements=[input_audio_el],
    ).send()

    # answer = await generate_text_answer(transcription)

    # output_name, output_audio = await text_to_speech(answer, "audio/wav")

    # output_audio_el = cl.Audio(
    #     auto_play=True,
    #     mime="audio/wav",
    #     content=output_audio,
    # )

    # await cl.Message(content=answer, elements=[output_audio_el]).send()


@cl.on_chat_resume
async def on_chat_resume(thread):
    pass
import hashlib
import logging

from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

# from pydantic import BaseModel


logger = logging.getLogger(__name__)

open_ai_embeddings = OpenAIEmbeddings()


def load_cache():
    lines = open(
        "/workspaces/initialization/artifacts/embeddings/emb_cache"
    ).readlines()
    lines = [line.split(",") for line in lines]
    keys = [x[0] for x in lines]
    embeds = [[float(x) for x in xs[1:]] for xs in lines]
    print(">>>>>>>>>>>>>>>load_cache")
    return dict(zip(keys, embeds))


def write_cache(key, embed):
    embed = [str(x) for x in embed]
    s = ",".join([key, *embed])
    with open("/workspaces/initialization/artifacts/embeddings/emb_cache", "a") as f:
        f.write("\n" + s)
    print(">>>>>>>>>>>>>>>write_cache")


# class OpenAIEmbeddingsWithCache(BaseModel, Embeddings):

#     def embed_documents(self, texts: list[str]) -> list[list[float]]:
#         """Embed search docs.

#         Args:
#             texts: List of text to embed.

#         Returns:
#             List of embeddings.
#         """
#         print(">>>>>>>>>>>>>embed_documents", len(texts))

#         cache = load_cache()

#         embeddings = []

#         for text in texts:
#             input_md5 = hashlib.md5(text.encode("utf-8")).hexdigest()

#             if embed := cache.get(input_md5):
#                 embeddings.append(embed)
#             else:
#                 embed = open_ai_embeddings.embed_documents(texts=[text])[0]
#                 write_cache(input_md5, embed)
#                 embeddings.append(embed)

#         return embeddings

#     def embed_query(self, text: str) -> list[float]:
#         """Embed query text.

#         Args:
#             text: Text to embed.

#         Returns:
#             Embedding.
#         """
#         return self.embed_documents([text])[0]


class OpenAIEmbeddingsWithCache(Embeddings):

    def __init__(self):
        self.cache = load_cache()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        print(">>>>>>>>>>>>>embed_documents", len(texts))
        embeddings = []

        for text in texts:
            input_md5 = hashlib.md5(text.encode("utf-8")).hexdigest()

            if embed := self.cache.get(input_md5):
                embeddings.append(embed)
            else:
                embed = open_ai_embeddings.embed_documents(texts=[text])[0]
                write_cache(input_md5, embed)
                embeddings.append(embed)
                self.cache[input_md5] = embed  # Update local cache too

        return embeddings

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]

# fmt: off
import os
import sys
import logging
sys.path.append("../")

import chromadb
from minio import Minio
import psycopg
from motor.motor_asyncio import AsyncIOMotorClient

from backend.src.danayar.backend.conf import (
    mongo_conn_str,
    chroma_conn_info,
    minio_conn_info,
    postgres_conn_info,
)

# fmt: on


logger = logging.getLogger(__name__)


async def reset_mongo():
    client = AsyncIOMotorClient(mongo_conn_str)
    await client.db_name.drop_collection(name_or_collection="groups")
    await client.db_name.drop_collection(name_or_collection="documents")
    await client.db_name.drop_collection(name_or_collection="users")


def reset_chroma():
    chroma_client = chromadb.HttpClient(**chroma_conn_info)
    # search for all collections and remove all collections
    collections = chroma_client.list_collections()
    for collection in collections:
        chroma_client.delete_collection(collection)

    # add collection to chroma
    chroma_client.create_collection("document-chunks")
    chroma_client.create_collection("document-abstract")


def reset_minio():
    # run bash commands
    os.system(
        f"$HOME/minio-binaries/mc alias set m http://{minio_conn_info['endpoint']} {minio_conn_info['access_key']} {minio_conn_info['secret_key']} 2> /dev/null"
    )

    minio_client = Minio(**minio_conn_info)
    # search for all buckets and remove all buckets
    buckets = minio_client.list_buckets()
    for bucket in buckets:
        # remove all objects in the bucket
        objects = minio_client.list_objects(bucket.name, recursive=True)
        for obj in objects:
            minio_client.remove_object(bucket.name, obj.object_name)
        # remove the bucket
        minio_client.remove_bucket(bucket.name)

    # create a bucket
    minio_client.make_bucket("danayar-documents")
    minio_client.make_bucket("danayar-processed")
    minio_client.make_bucket("danayar-images")
    minio_client.make_bucket("danayar-chainlit")
    minio_client.make_bucket("danayar-abstract")

    os.system(
        "$HOME/minio-binaries/mc anonymous set download m/danayar-chainlit 2> /dev/null"
    )


def reset_postgres():
    # connect to postgres
    conn = psycopg.connect(postgres_conn_info.replace("+psycopg", ""))
    cur = conn.cursor()
    # search for all tables and remove all tables
    cur.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    )
    tables = cur.fetchall()
    for table in tables:
        cur.execute(f"DROP TABLE {table[0]} CASCADE")
    conn.commit()
    cur.close()
    conn.close()

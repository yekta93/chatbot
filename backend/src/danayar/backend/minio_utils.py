from datetime import timedelta
from io import BytesIO
from minio import Minio

from .conf import minio_conn_info


def get_object(object_name: str, bucket_name: str = "danayar-documents") -> bytes:
    minio = Minio(**minio_conn_info)

    data = minio.get_object(bucket_name=bucket_name, object_name=object_name)

    return data.read()


def get_link_of_object(object_name: str, bucket_name: str = "danayar-documents") -> str:
    minio = Minio(**minio_conn_info)
    link = minio.presigned_get_object(
        bucket_name=bucket_name,
        object_name=object_name,
        expires=timedelta(hours=1),
        response_headers={
            "response-content-disposition": "inline",
            "response-content-type": "application/pdf",
        },
    )
    return link


# .replace("minio", "localhost")   # TODO: handle with better way


# TODO: The name of this function should be changed after persisting the data.

# TODO: BytesIO -> BinaryIO (BinaryIO Includes both buffered (BufferedReader, BytesIO) and raw (FileIO) binary streams.)


def insert_object_new(
    file: BytesIO, object_name: str, bucket_name: str = "danayar-documents"
):
    minio = Minio(**minio_conn_info)
    minio.put_object(
        bucket_name=bucket_name,
        object_name=object_name,
        data=file,
        length=-1,
        part_size=10 * 1024 * 1024,
    )


def insert_object(path: str, object_name: str, bucket_name: str = "danayar-documents"):
    minio = Minio(**minio_conn_info)
    minio.fput_object(
        bucket_name=bucket_name,
        object_name=object_name,
        file_path=path,
    )


def remove_bucket(bucket_name: str = "danayar"):
    minio = Minio(**minio_conn_info)
    if minio.bucket_exists(bucket_name=bucket_name):
        for obj in minio.list_objects(bucket_name=bucket_name, recursive=True):
            minio.remove_object(
                bucket_name=bucket_name,
                object_name=obj.object_name,
            )
        minio.remove_bucket(bucket_name=bucket_name)


def add_bucket(bucket_name: str = "danayar"):
    minio = Minio(**minio_conn_info)
    minio.make_bucket(bucket_name=bucket_name)

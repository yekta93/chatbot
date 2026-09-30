import io
import asyncio

from minio import Minio, error
from chainlit.data.storage_clients.base import BaseStorageClient
from typing import Any, Dict, Union

from backend.conf import minio_conn_info

# TODO: refactor using chainlit.make_async
# TODO: the default bucket is public, need to make it private


class MinIOStorageClient(BaseStorageClient):
    """
    Class to enable MinIO storage provider
    """

    def __init__(self, minio_conn_info=minio_conn_info, bucket_name="danayar-chainlit"):
        try:
            self.bucket = bucket_name
            self.client = Minio(**minio_conn_info)
        except Exception as e:
            print(f"MinIOStorageClient initialization error: {e}")
            raise

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
    ) -> Dict[str, Any]:
        try:
            # Ensure the bucket exists
            if not self.client.bucket_exists(self.bucket):
                # self.client.make_bucket(self.bucket)
                print(
                    f"Bucket {self.bucket} does not exist, initialization script failed"
                )
                raise Exception(f"Bucket {self.bucket} does not exist")

            # Upload the file
            if isinstance(data, str):
                data = data.encode("utf-8")
            # convert bytes to BinaryIO
            data = io.BytesIO(data)
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=object_key,
                data=data,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=mime,
            )

            url = f"http://minio:9000/{self.bucket}/{object_key}"
            return {"object_key": object_key, "url": url}
        except error.S3Error as e:
            print(f"MinIOStorageClient, upload_file error: {e}")
            return {}
        except Exception as e:
            print(f"MinIOStorageClient, upload_file unexpected error: {e}")
            return {}

    async def delete_file(self, object_key: str) -> bool:
        try:
            self.client.remove_object(
                bucket_name=self.bucket,
                object_name=object_key,
            )
            return True
        except Exception as e:
            print(f"MinIOStorageClient, delete_file unexpected error: {e}")
            return False

    async def get_read_url(self, object_key: str) -> str:
        url = f"http://minio:9000/{self.bucket}/{object_key}"
        return url

from datetime import datetime
from typing import List, Literal
from beanie import PydanticObjectId
from pydantic import BaseModel

from .document import FileProcessingStatus


class UploadResponse(BaseModel):
    doc_id: PydanticObjectId
    name: str
    creation_ts: datetime
    status: List[FileProcessingStatus]
    number_total_steps: int
    state: Literal["done", "failed", "processing"]


class DocumentIDResponse(BaseModel):
    doc_id: PydanticObjectId

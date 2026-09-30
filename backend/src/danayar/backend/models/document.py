from typing import Annotated, Any, Dict, List, Literal, Optional
from datetime import datetime, timedelta

from beanie import Indexed, Document as BeanieDocument, PydanticObjectId
from pydantic import Field, BaseModel
from .user import PhoneNumber


class FileProcessingStatus(BaseModel):
    name: Literal[
        "parsing file",
        "generating abstract",
        "insert .md file in minIO",
        "chunking content",
        "indexing data to vector database",
        "inserting abstract in chromadb",
        "file upload successfully",
        "done",
        "failed",
    ]
    start_ts: datetime = Field(default_factory=datetime.now)
    error: Optional[str] = Field(default=None)


class Document(BeanieDocument):
    creation_ts: datetime = Field(default_factory=datetime.now)
    # prosseced_ts: datetime = Field(default_factory=datetime.now) # TODO: add this line
    name: str
    minio_object_name: str
    tags: Annotated[List[str], Indexed()]
    is_content_available: bool = Field(default=False)
    status: List[FileProcessingStatus] = Field(default_factory=list)
    owner: str | PhoneNumber = Field(default="organization")

    class Settings:
        name = "documents"
        is_root = True


class ContractDocument(Document):
    start_date: datetime
    duration_in_month: Optional[int]
    year: int
    subject: str
    related_product_or_service: str
    employer: str
    contractor: str
    total_amount: int
    guarantee_amount: Optional[int]


class LetterDocument(Document):  # what to do with attachments?
    date: str
    serial: str


class DocumentResponse(BaseModel):
    doc_id: PydanticObjectId
    name: str
    creation_ts: datetime
    src: str
    tags: List[str]
    metadata: Dict[str, Any]


class ItemDisplay(BaseModel):
    title: str
    type: Literal["currency", "date", "str", "float", "int"]
    description: str


display_info = {
    "start_date": ItemDisplay(
        title="تاریخ شروع قرارداد",
        type="date",
        description="زمانی که قرارداد آغاز می‌شود",
    ),
    "duration_in_month": ItemDisplay(
        title="مدت زمان قرارداد به ماه",
        type="int",
        description="مدت زمان کل قرارداد به ماه",
    ),
    "year": ItemDisplay(
        title="سال قرارداد",
        type="int",
        description="سالی که قرارداد تنظیم شده است.",
    ),
    "subject": ItemDisplay(
        title="موضوع قرارداد",
        type="str",
        description="موضوع قرارداد طرفین",
    ),
    "related_product_or_service": ItemDisplay(
        title="محصولات یا خدمات مرتبط",
        type="str",
        description="این قرارداد در کدام دسته از محصولات یا خدمات شرکت قرار دارد؟",
    ),
    "employer": ItemDisplay(
        title="نام کارفرما",
        type="str",
        description="نام مشتری، کارفرما یا طرف قرارداد",
    ),
    "contractor": ItemDisplay(
        title="نام پیمانکار",
        type="str",
        description="نام فروشنده یا پیمانکار ",
    ),
    "total_amount": ItemDisplay(
        title="مبلغ کل قرارداد",
        type="currency",
        description="هزینه کلی یا مبلغ کل قرارداد",
    ),
    "guarantee_amount": ItemDisplay(
        title="مبلغ ضمانت‌ نامه",
        type="currency",
        description="مبلغ کل ضمانت نامه داده شده برای قرارداد",
    ),
}


display_info_all_docs = {
    "name": ItemDisplay(title="نام مستند", type="str", description="نام مستند"),
    "creation_ts": ItemDisplay(
        title=" زمان ایجاد مستند",
        type="date",
        description=" زمان ایجاد مستند",
    ),
}

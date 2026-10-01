import io
from io import BytesIO
import uuid
import logging
from beanie import Indexed, Document as BeanieDocument, PydanticObjectId

# from llama_parse import LlamaParse
# from langchain.schema import Document as LangchainDocument
import os
from typing import List, Optional
from uuid import uuid4
import glob
from datetime import datetime

from beanie import PydanticObjectId, init_beanie
from llama_parse import LlamaParse
from motor.motor_asyncio import AsyncIOMotorClient
from persiantools.jdatetime import JalaliDate
from sqlalchemy import create_engine

# from langchain_chroma.vectorstores import Chroma
# from langchain_openai import OpenAIEmbeddings
# from langchain.text_splitter import RecursiveCharacterTextSplitter


# fmt: off

import sys
sys.path.append("../")
from backend.src.danayar.backend.conf import (
    mongo_conn_str,
    postgres_conn_info,

)

from backend.src.danayar.backend.models import __beanie_models__
from backend.src.danayar.backend.models.document import ContractDocument, Document, FileProcessingStatus
from backend.src.danayar.backend.models.group import Group, DocumentGroup, DatabaseGroup
from backend.src.danayar.backend.minio_utils import add_bucket, get_object, insert_object, insert_object_new, remove_bucket
from backend.src.danayar.backend.models.upload import DocumentIDResponse
from backend.src.danayar.backend.routes.upload import process_file, generate_abstract

# fmt: on

logger = logging.getLogger(__name__)


async def insert_contract(
    name: str,
    start_date: datetime,
    duration_in_month: Optional[int],
    year: int,
    subject: str,
    related_product_or_service: str,
    employer: str,
    contractor: str,
    total_amount: int,
    guarantee_amount: Optional[int],
):
    path = f"artifacts/contracts/{name}"
    minio_object_name = str(uuid4())
    insert_object(path, minio_object_name)
    doc = ContractDocument(
        name=name,
        minio_object_name=minio_object_name,
        tags=["قرارداد"],
        year=year,
        start_date=start_date,  # JalaliDate(1402, 2, 11).to_gregorian(),
        duration_in_month=duration_in_month,  # timedelta(days=1*365),
        subject=subject,
        related_product_or_service=related_product_or_service,
        employer=employer,
        contractor=contractor,
        total_amount=total_amount,
        guarantee_amount=guarantee_amount,
    )
    doc.tags.append(doc.related_product_or_service)
    doc.tags.append(doc.employer)
    doc.status.append(FileProcessingStatus(name="done"))
    await doc.insert()


async def insert_contracts():
    await insert_contract(
        name="آسیاتک.pdf",
        start_date=JalaliDate(1402, 2, 11).to_gregorian(),
        duration_in_month=None,  # timedelta(days=1*365),,
        year=1402,
        subject="ارزیابی امنیتی و ارتقا امنیت زیرساخت شبکه و سرویس‌های فناوری اطلاعات",
        related_product_or_service="pentest",
        employer="انتقال داده های آسیاتک",
        contractor="امن افزار گستر شریف",
        total_amount=7_800_000_000,
        guarantee_amount=780_000_000,
    )

    await insert_contract(
        name="بانک صادرات آمون نفوذ 1401.pdf",
        start_date=JalaliDate(1401, 3, 2).to_gregorian(),
        duration_in_month=12,
        year=1401,
        subject="ارزیابی امنیتی وبسایت‌های اینترنتی (تست نفوذ)",
        related_product_or_service="pentest",
        employer="بانک صادرات ایران",
        contractor="امن افزار گستر شریف",
        total_amount=6_000_000_000,
        guarantee_amount=600_000_000,
    )

    await insert_contract(
        name="برق منطقه ای خوزستان.pdf",
        start_date=JalaliDate(1402, 10, 10).to_gregorian(),
        duration_in_month=12,
        year=1402,
        subject="انجام خدمات مشاوره و پشتیبانی مرکز عملیات امنیت SOC شرکت برق منطقه‌ای خوزستان",
        related_product_or_service="SOC",
        employer="شرکت سهامی برق منطقه‌ای خوزستان",
        contractor="امن افزار گستر شریف",
        total_amount=5_304_744_476,
        guarantee_amount=0,
    )

    await insert_contract(
        name="توسعه امن ناجی.pdf",
        start_date=JalaliDate(1401, 8, 23).to_gregorian(),
        duration_in_month=12,
        year=1401,
        subject="خرید چهار دستگاه سرور",
        related_product_or_service="تامین سخت افزار",
        employer="فناوران توسعه امن ناجی",
        contractor="امن افزار گستر شریف",
        total_amount=28_680_000_000,
        guarantee_amount=286_800_000,
    )

    await insert_contract(
        name="ملت 1402.pdf",
        start_date=JalaliDate(1402, 2, 28).to_gregorian(),
        duration_in_month=12,
        year=1402,
        subject="ارایه خدمات مشاوره ای امنیت اطلاعات",
        related_product_or_service="مشاوره",
        employer="بانک ملت",
        contractor="امن افزار گستر شریف",
        total_amount=14_000_000_000,
        guarantee_amount=1_400_000_000,
    )

    await insert_contract(
        name="وزارت راه و شهرسازی.pdf",
        start_date=JalaliDate(1402, 5, 30).to_gregorian(),
        duration_in_month=1,
        year=1402,
        subject="خرید تجهیزات  شبکه و دوربین و رایانه ای وزارت راه و شهرسازی",
        related_product_or_service="تامین سخت افزار",
        employer=" وزارت راه و شهرسازی",
        contractor="امن افزار گستر شریف",
        total_amount=122_470_000_000,
        guarantee_amount=12_247_000_000,
    )

    await insert_contract(
        name="تارا.pdf",
        start_date=JalaliDate(1402, 7, 15).to_gregorian(),
        duration_in_month=12,
        year=1402,
        subject="تفاهم نامه آزمون نفوذ و ارزیابی امنیتی",
        related_product_or_service="pentest",
        employer="شرکت توسعه و تجارت و فناوری تارا ",
        contractor="امن افزار گستر شریف",
        total_amount=7_300_000_000,
        guarantee_amount=730_000_000,
    )

    await insert_contract(
        name="سایپا.pdf",
        start_date=JalaliDate(1400, 12, 1).to_gregorian(),
        duration_in_month=30,
        year=1400,
        subject="طراحی تامین نصب و راه اندازی مرکز عملیات امنیت شرکت سایپا",
        related_product_or_service="SOC",
        employer="شرکت سایپا",
        contractor="امن افزار گستر شریف",
        total_amount=18_300_000_000,
        guarantee_amount=0,
    )

    await insert_contract(
        name="نیروی برق قزوین.pdf",
        start_date=JalaliDate(1402, 10, 20).to_gregorian(),
        duration_in_month=3,
        year=1402,
        subject="تهیه و راه اندازی سیستم پایش و نظارت بر ارتباطات کلاینت",
        related_product_or_service="PAM",
        employer="شرکت توزیع نیروی برق استان قزوین",
        contractor="امن افزار گستر شریف",
        total_amount=1_200_000_000,
        guarantee_amount=120_000_000,
    )

    await insert_contract(
        name="وزارت کار  پارس پم.pdf",
        start_date=JalaliDate(1402, 4, 20).to_gregorian(),
        duration_in_month=2,
        year=1402,
        subject=" ارتقا لایسنس سامانه مدیریت دسترسی کاربران سطح بالا",
        related_product_or_service="PAM",
        employer="وزارت تعاون کار و رفاه اجتماعی",
        contractor="امن افزار گستر شریف",
        total_amount=8_500_000_000,
        guarantee_amount=850_000_000,
    )


async def insert_groups():

    all_doc_g = DocumentGroup(
        name="تمام مستندات",
        description="همه اسناد موجود در سامانه",
        filter_tags=[],
        empty=False,
    )
    await all_doc_g.insert()

    contract_g = DocumentGroup(
        name="قرارداد‌ها",
        description="همه اسنادی که قرارداد هستند",
        filter_tags=["قرارداد"],
        empty=False,
    )
    await contract_g.insert()

    db_g1 = DatabaseGroup(
        name="جدول ۱",
        description="----",
        empty=True,
    )
    await db_g1.insert()

    db_g2 = DatabaseGroup(
        name="جدول ۲",
        description="----",
        empty=True,
    )
    await db_g2.insert()

    db_g = DatabaseGroup(
        name="پایگاه داده",
        description="----",
        children=[db_g1.id, db_g2.id],
    )
    await db_g.insert()

    main_g = Group(
        id=PydanticObjectId(oid="f" * 24),
        name="main",
        description="----",
        children=[contract_g.id, db_g.id, all_doc_g.id],
    )
    await main_g.insert()


async def convert_init_docs_to_str(document: Document) -> str:
    document.status.append(FileProcessingStatus(name="parsing file"))
    await document.save()

    doc_name_pdf = document.name
    doc_name_md = doc_name_pdf.replace(".pdf", ".md")
    file_path = os.path.join("./artifacts/docs/md/", doc_name_md)

    all_content = []
    with open(file_path, "r", encoding="utf-8") as f:
        all_content.append(f.read())

    all_content_str = "\n".join(all_content)
    return all_content_str


def generate_abstract_with_cache(text: str, name: str) -> str:
    summary_file_name = f'./artifacts/docs/summaries/{name.replace(".pdf", ".txt")}'
    if os.path.exists(summary_file_name):
        with open(summary_file_name) as f:
            return f.read()
    else:
        abstract = generate_abstract(text, name)
        with open(summary_file_name, "w") as f:
            f.write(abstract)
        return abstract


async def insert_documents(
    directory_path: str = "./artifacts/docs/pdf",
):
    pattern = "*.pdf"
    file_pathes = glob.glob(os.path.join(directory_path, pattern))

    for file_path in file_pathes:

        file = open(file_path, "rb")

        # 1 insert object_minio
        minio_object_name = str(uuid.uuid4())
        insert_object_new(
            file=file,
            object_name=minio_object_name,
            bucket_name="danayar-documents",
        )

        # 2 insert mongodb
        document = Document(
            name=f"{os.path.basename(file_path)}",
            minio_object_name=minio_object_name,
            tags=[],
            is_content_available=True,
            owner="organization",
        )
        await document.insert()

        await process_file(
            document.id, convert_init_docs_to_str, generate_abstract_with_cache
        )

        logger.info(f"document {document.name} inserted.")


async def init_mongo():
    client = AsyncIOMotorClient(mongo_conn_str)
    await init_beanie(database=client.db_name, document_models=__beanie_models__)

    await insert_groups()
    logger.info("insert_groups done")
    await insert_contracts()
    logger.info("insert_contracts done")
    await insert_documents()
    logger.info("insert_documents done")

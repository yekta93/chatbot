import os
import logging
from glob import glob

import pandas as pd
import psycopg
from sqlalchemy import create_engine
from hazm import Normalizer
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

# fmt: off

import sys
sys.path.append("../")
from backend.src.danayar.backend.conf import (
    mongo_conn_str,
    postgres_conn_info,
)
from backend.src.danayar.backend.models import __beanie_models__
from backend.src.danayar.backend.models.document import ContractDocument

# fmt: on

logger = logging.getLogger(__name__)


def inset_chainlit_tables():
    # connect to postgres
    conn = psycopg.connect(postgres_conn_info.replace("+psycopg", ""))
    cur = conn.cursor()

    with open("src/init_postgres.sql") as f:
        cur.execute(f.read())
    conn.commit()

    cur.close()
    conn.close()


async def insert_contracts_to_postgres():
    client = AsyncIOMotorClient(mongo_conn_str)
    await init_beanie(database=client.db_name, document_models=__beanie_models__)

    data = []
    async for doc in ContractDocument.find_all():
        data.append(
            doc.model_dump(
                mode="json",
                exclude={
                    "creation_ts",
                    "name",
                    "minio_object_name",
                    "tags",
                    "status",
                },
            )
        )
    engine = create_engine(postgres_conn_info)

    pd.DataFrame.from_dict(data).to_sql(
        name="contracts",
        con=engine,
        if_exists="replace",
        index=False,
    )


def insert_debt_collection_to_postgres():
    files = glob("artifacts/debt_collection/*/*/*.xls")
    df_list = []
    for file_path in files:
        file_name = os.path.basename(file_path)
        name = (file_name.split("."))[0].split("_")[2]
        df = pd.read_excel(file_path)
        df["نام مدیرفروش"] = name
        df_list.append(df)

    merged_df = pd.concat(df_list, ignore_index=True)
    merged_df = merged_df.dropna(axis=1, how="all")

    name = {
        "vakili": "وکیلی",
        "mahdavi": "مهدوی",
        "mobaraki": "مبارکی",
        "norozi": "نوروزی",
        "dadmehr": "دادمهر",
        "dadmehr3 mah": " دادمهر سه ماه",
        "ahmadiyan": "احمدیان",
        "ashrafi": "اشرفی",
        "baradaran": "برادران",
        "azarniya": "آذرنیا",
        "dadmehr9 mah": "دادمهر نه ماه",
    }
    merged_df["نام مدیرفروش"] = merged_df["نام مدیرفروش"].map(name)

    # Normalize and rename merged_df.columns using Hazm's Normalizer
    normalizer = Normalizer()
    normalized_col = [normalizer.normalize(col) for col in merged_df.columns]
    new_col = dict(list(zip(merged_df.columns, normalized_col)))
    merged_df.rename(columns=new_col, inplace=True)

    engine = create_engine(postgres_conn_info)

    merged_df.to_sql(
        name="debt_collection",
        con=engine,
        if_exists="replace",
        index=False,
    )


async def init_postgres():
    inset_chainlit_tables()
    logger.info("Chainlit tables created.")
    insert_debt_collection_to_postgres()
    logger.info("Debt collection data inserted.")
    await insert_contracts_to_postgres()
    logger.info("Contracts data inserted.")

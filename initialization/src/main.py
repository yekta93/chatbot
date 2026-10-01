import os
import time
import asyncio
import logging

from reset import reset_mongo, reset_chroma, reset_minio, reset_postgres
from init_mongo import init_mongo
from init_postgres import init_postgres

logger = logging.getLogger(__name__)

READY_FILE = "/tmp/ready"


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.FileHandler("app.log"), logging.StreamHandler()],
    )


async def main():
    logger.info("Resetting databases...")

    await reset_mongo()
    reset_chroma()
    reset_minio()
    reset_postgres()
    logger.info("Resetting databases is done.")

    logger.info("Initializing databases...")
    await init_mongo()
    await init_postgres()
    logger.info("Databases are ready.")


if __name__ == "__main__":
    setup_logging()
    logger.info("Starting initialization script...")

    if os.path.exists(READY_FILE):
        os.remove(READY_FILE)
    logger.info("Ready file removed. status is unhealthy.")

    asyncio.run(main())

    with open(READY_FILE, "w") as f:
        f.write("done")
    logger.info("Ready file created. status is healthy.")

    # Keep the script running to avoid container exit
    while True:
        time.sleep(86400)

graph_debug_mode = False

mongo_conn_str = "mongodb://root:abc@mongodb:27017/?authMechanism=DEFAULT&tls=false"

minio_conn_info = {
    "endpoint": "minio:9000",
    "access_key": "minio",
    "secret_key": "minio12345678",
    "secure": False,
}

sms_api_info = {
    "url": "https://api.sms.ir/v1/send/verify",
    "template_id": "988971",
    "api_key": "eaN5OLApcMvXzvhgCA0JlgFncZBhTgYy5tpkTKyEo0OfEnwq",
}

jwt_conf = dict(
    SECRET_KEY="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
    ALGORITHM="HS256",
    ACCESS_TOKEN_EXPIRE_MINUTES=24 * 60,
)

chroma_conn_info = {
    "host": "chromadb",
    "port": 8000,
}

postgres_conn_info = (
    "postgresql+psycopg://postgres:postgres1234@postgresql:5432/postgres"
)
postgres_exclude_tables = [
    "users",
    "threads",
    "steps",
    "elements",
    "feedbacks",
]


ollama_url = "http://ollama:11434"

FROM docker.arvancloud.ir/python:3.11.11-bookworm

WORKDIR /app/initialization

COPY initialization/pyproject.toml poetry.lock* /app/initialization/
RUN pip install poetry
RUN poetry install

RUN curl https://dl.min.io/client/mc/release/linux-amd64/mc \
  --create-dirs \
  -o $HOME/minio-binaries/mc
RUN chmod +x $HOME/minio-binaries/mc

COPY backend /app/backend
COPY initialization /app/initialization

RUN echo "" > /app/backend/src/danayar/backend/__init__.py; 

HEALTHCHECK --interval=5s --timeout=1s --start-period=30s --retries=3 \
  CMD test -f /tmp/ready || exit 1

CMD ["poetry", "run", "python", "src/main.py"]

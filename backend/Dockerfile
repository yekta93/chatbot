FROM docker.arvancloud.ir/python:3.12.6-slim

RUN pip install poetry
ENV CHAINLIT_CUSTOM_AUTH=true

WORKDIR /app
COPY pyproject.toml poetry.lock* ./
RUN poetry install

COPY . .

CMD ["poetry", "run", "fastapi", "run", "--workers", "1", "src/danayar/backend", "--port", "8088"]

# number of workers should be 1,  otherwise it will not work because of the websocket session

EXPOSE 8088

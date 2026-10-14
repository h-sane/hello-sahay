FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary pgvector \
    pydantic httpx python-dotenv pyjwt boto3 amazon-transcribe awscrt python-multipart
WORKDIR /app

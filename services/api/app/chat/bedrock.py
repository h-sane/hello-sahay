import json
import os

import boto3
from botocore.config import Config

_client = None


def _runtime():
    # Always the explicit personal profile: the machine default is the company account.
    global _client
    if _client is None:
        session = boto3.Session(
            profile_name=os.environ.get("AWS_PROFILE", "personal-bedrock"),
            region_name=os.environ.get("AWS_REGION", "ap-south-1"),
        )
        _client = session.client(
            "bedrock-runtime",
            config=Config(retries={"mode": "adaptive", "max_attempts": 10}, read_timeout=30),
        )
    return _client


def embed(text: str) -> list[float]:
    """Titan Text Embeddings v2, 1024 dims, unit-normalised."""
    model = os.environ.get("BEDROCK_EMBED_MODEL_ID", "amazon.titan-embed-text-v2:0")
    body = json.dumps({"inputText": text, "dimensions": 1024, "normalize": True})
    out = _runtime().invoke_model(modelId=model, body=body)
    return json.loads(out["body"].read())["embedding"]


def generate(system: str, user: str, max_tokens: int = 500) -> str:
    model = os.environ.get("BEDROCK_FAST_MODEL_ID", "apac.amazon.nova-lite-v1:0")
    out = _runtime().converse(
        modelId=model,
        system=[{"text": system}],
        messages=[{"role": "user", "content": [{"text": user}]}],
        inferenceConfig={"temperature": 0, "maxTokens": max_tokens},
    )
    return out["output"]["message"]["content"][0]["text"].strip()

"""Phase 0 setup check: database, Bedrock, embeddings, Polly, Transcribe.

Run: python scripts/check_setup.py   (needs boto3 and psycopg or psycopg2)
Reads AWS_PROFILE / AWS_REGION / model IDs from the environment (see .env.example).
"""
import os
import sys

import boto3

try:
    import psycopg
except ImportError:  # psycopg2 works too for this check
    import psycopg2 as psycopg

PROFILE = os.getenv("AWS_PROFILE", "personal-bedrock")
REGION = os.getenv("AWS_REGION", "ap-south-1")
FAST_MODEL = os.getenv("BEDROCK_FAST_MODEL_ID", "apac.amazon.nova-lite-v1:0")
EMBED_MODEL = os.getenv("BEDROCK_EMBED_MODEL_ID", "amazon.titan-embed-text-v2:0")
DB = os.getenv("DATABASE_URL", "postgresql://sahay:sahay@localhost:5433/sahay").replace("+psycopg", "")

session = boto3.Session(profile_name=PROFILE, region_name=REGION)


def check_db():
    conn = psycopg.connect(DB, connect_timeout=5)
    try:
        cur = conn.cursor()
        cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
        row = cur.fetchone()
    finally:
        conn.close()
    assert row, "pgvector extension missing"
    return f"pgvector {row[0]}"


def check_identity():
    arn = session.client("sts").get_caller_identity()["Arn"]
    if "099900259932" in arn:
        raise RuntimeError("this is the Nirmaan company account; use the personal profile")
    return arn


def check_llm():
    out = session.client("bedrock-runtime").converse(
        modelId=FAST_MODEL,
        messages=[{"role": "user", "content": [{"text": "Reply with just: ok"}]}],
    )
    return out["output"]["message"]["content"][0]["text"].strip()


def check_embed():
    import json

    body = json.dumps({"inputText": "டெங்கு காய்ச்சல் தடுப்பு"})
    out = session.client("bedrock-runtime").invoke_model(modelId=EMBED_MODEL, body=body)
    return f"{len(json.loads(out['body'].read())['embedding'])} dims"


def check_polly():
    out = session.client("polly").synthesize_speech(
        Text="नमस्ते, मैं सहाय हूँ", VoiceId="Kajal", Engine="neural", LanguageCode="hi-IN", OutputFormat="mp3"
    )
    return f"{len(out['AudioStream'].read())} bytes of Hindi audio"


def check_transcribe():
    session.client("transcribe").list_transcription_jobs(MaxResults=1)
    return "access ok (streaming ta-IN/hi-IN/en-IN tested in P1-5)"


CHECKS = [
    ("Database", check_db),
    ("AWS identity", check_identity),
    ("Bedrock LLM", check_llm),
    ("Embeddings", check_embed),
    ("Polly", check_polly),
    ("Transcribe", check_transcribe),
]

if __name__ == "__main__":
    failed = 0
    for name, fn in CHECKS:
        try:
            print(f"[ OK ] {name}: {fn()}")
        except Exception as e:  # report every check, don't stop at the first failure
            failed += 1
            print(f"[FAIL] {name}: {str(e)[:200]}")
    sys.exit(1 if failed else 0)

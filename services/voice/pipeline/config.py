"""Settings from the repo-root .env (already-set environment variables win)."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

_env = ROOT / ".env"
if _env.exists():
    for _line in _env.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip().strip("\"'"))

REGION = os.environ.get("AWS_REGION", "ap-south-1")
PROFILE = os.environ.get("AWS_PROFILE", "personal-bedrock")
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8001/api/v1")
LLM_MODEL = os.environ.get("BEDROCK_SMART_MODEL_ID", "apac.amazon.nova-pro-v1:0")
SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")

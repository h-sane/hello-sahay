from functools import lru_cache

import boto3
from botocore.config import Config

from . import config


@lru_cache
def session() -> boto3.Session:
    if config.PROFILE in ("", "default"):
        raise RuntimeError("Refusing the default AWS profile (Nirmaan company account); set AWS_PROFILE=personal-bedrock")
    return boto3.Session(profile_name=config.PROFILE, region_name=config.REGION)


@lru_cache
def client(name: str):
    # a stuck request must fail in seconds and be retried, not hold a caller in silence for a minute
    return session().client(name, config=Config(connect_timeout=5, read_timeout=15,
                                                retries={"max_attempts": 2, "mode": "standard"}))

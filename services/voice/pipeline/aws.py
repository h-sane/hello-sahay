from functools import lru_cache

import boto3

from . import config


@lru_cache
def session() -> boto3.Session:
    if config.PROFILE in ("", "default"):
        raise RuntimeError("Refusing the default AWS profile (Nirmaan company account); set AWS_PROFILE=personal-bedrock")
    return boto3.Session(profile_name=config.PROFILE, region_name=config.REGION)


@lru_cache
def client(name: str):
    return session().client(name)

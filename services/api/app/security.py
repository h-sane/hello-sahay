import hashlib
import hmac
import logging
import os
import time

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

log = logging.getLogger("sahay.auth")

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me")
if JWT_SECRET == "change-me":
    log.warning("JWT_SECRET is the placeholder; set a real one in .env")
TOKEN_HOURS = 12
_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split("$")
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
    return hmac.compare_digest(digest, bytes.fromhex(digest_hex))


def make_token(sub: str, role: str, facility_id: int | None = None, doctor_id: int | None = None) -> str:
    claims = {"sub": sub, "role": role, "facility_id": facility_id, "doctor_id": doctor_id,
              "exp": int(time.time()) + TOKEN_HOURS * 3600}
    return jwt.encode(claims, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def optional_claims(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict | None:
    return decode_token(creds.credentials) if creds else None


def require_staff(claims: dict | None = Depends(optional_claims)) -> dict:
    """Desk or admin token; returns the claims (sub, role, facility_id)."""
    if claims is None:
        raise HTTPException(401, "missing or invalid token")
    if claims["role"] not in ("desk", "admin"):
        raise HTTPException(403, "staff only")
    return claims


def check_facility(claims: dict, facility_id: int | None) -> None:
    """A desk user may only touch its own facility; admin may touch any."""
    if claims["role"] == "desk" and facility_id != claims["facility_id"]:
        raise HTTPException(403, "not your facility")

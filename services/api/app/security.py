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


PATIENT_TOKEN_HOURS = 30 * 24  # a patient signs in once per phone, not every 12 hours


def make_token(sub: str, role: str, facility_id: int | None = None, doctor_id: int | None = None,
               hours: int = TOKEN_HOURS) -> str:
    claims = {"sub": sub, "role": role, "facility_id": facility_id, "doctor_id": doctor_id,
              "exp": int(time.time()) + hours * 3600}
    return jwt.encode(claims, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def optional_claims(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict | None:
    return decode_token(creds.credentials) if creds else None


# Hello Sahay's own team is "admin". Every hospital login belongs to one facility and has one of these roles.
FRONT_DESK_ROLES = ("hospital_admin", "receptionist", "nurse")
HOSPITAL_ROLES = FRONT_DESK_ROLES + ("doctor",)


def require_staff(claims: dict | None = Depends(optional_claims)) -> dict:
    """Any hospital login or the Hello Sahay admin; returns the claims (sub, role, facility_id, doctor_id)."""
    if claims is None:
        raise HTTPException(401, "missing or invalid token")
    if claims["role"] != "admin" and claims["role"] not in HOSPITAL_ROLES:
        raise HTTPException(403, "staff only")
    return claims


def require_front_desk(claims: dict = Depends(require_staff)) -> dict:
    """Everything except a doctor login: the whole hospital's appointments, doctors and calls."""
    if claims["role"] == "doctor":
        raise HTTPException(403, "not available to doctor accounts")
    return claims


def require_hospital_admin(claims: dict = Depends(require_staff)) -> dict:
    """Managing logins and doctors: the hospital's admin, or the Hello Sahay team on its behalf."""
    if claims["role"] not in ("hospital_admin", "admin"):
        raise HTTPException(403, "hospital admin only")
    return claims


def check_facility(claims: dict, facility_id: int | None) -> None:
    """A hospital login may only touch its own facility; the Hello Sahay admin may touch any."""
    if claims["role"] != "admin" and facility_id != claims.get("facility_id"):
        raise HTTPException(403, "not your facility")

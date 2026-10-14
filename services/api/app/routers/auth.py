import hmac
import logging
import os
import secrets
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import normalize_phone
from ..db import get_session
from ..models import DeskUser, Facility, Patient
from ..security import PATIENT_TOKEN_HOURS, hash_password, make_token, verify_password

log = logging.getLogger("sahay.auth")
router = APIRouter(prefix="/auth")

OTP_TTL_S, OTP_TRIES, OTP_RESEND_S = 300, 5, 30
SHOW_CODE = os.environ.get("OTP_SHOW_CODE", "1") != "0"
# ponytail: in-memory, one API process; a second instance needs a shared store (the otp table or Redis)
_otps: dict[str, dict] = {}

DEMO_PASSWORD = "demo1234"
ADMIN_EMAIL = "admin@sahay.demo"
# Checked when the email is unknown so a miss costs the same as a wrong password.
_DUMMY_HASH = hash_password("not-a-real-password")


def desk_email(facility_id: int) -> str:
    return f"desk{facility_id}@sahay.demo"


def ensure_demo_users(session: Session) -> None:
    """The Hello Sahay admin plus one hospital admin per partner facility. Idempotent.

    Receptionists, nurses and doctors are created by the hospital admin (Users tab in Sahay Desk), or seeded
    from data/seed/users.csv for the demo hospital.
    """
    existing = {u.email: u for u in session.scalars(select(DeskUser))}
    wanted = [(desk_email(f.id), "hospital_admin", f.id, f"{f.name} admin")
              for f in session.scalars(select(Facility).where(Facility.is_partner))]
    wanted.append((ADMIN_EMAIL, "admin", None, "Hello Sahay admin"))
    for email, role, facility_id, name in wanted:
        if email not in existing:
            session.add(DeskUser(email=email, password_hash=hash_password(DEMO_PASSWORD),
                                 role=role, facility_id=facility_id, name=name))
        elif not existing[email].name:  # accounts made before logins had names
            existing[email].name = name
    session.commit()


class LoginIn(BaseModel):
    email: str
    password: str


class OtpRequestIn(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class OtpVerifyIn(OtpRequestIn):
    code: str


@router.post("/login")
def login(body: LoginIn, session: Session = Depends(get_session)):
    email = body.email.strip().lower()
    user = session.scalar(select(DeskUser).where(DeskUser.email == email))
    if user is None:
        # Partner facilities may have been seeded after startup.
        ensure_demo_users(session)
        user = session.scalar(select(DeskUser).where(DeskUser.email == email))
    ok = verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
    if user is None or not ok:
        raise HTTPException(401, "invalid email or password")
    if not user.active:
        raise HTTPException(403, "this login has been switched off; ask your hospital admin")
    return {"token": make_token(user.email, user.role, user.facility_id, user.doctor_id),
            "role": user.role, "facility_id": user.facility_id, "doctor_id": user.doctor_id,
            "name": user.name, "email": user.email}


@router.post("/otp/request")
def otp_request(body: OtpRequestIn):
    """Issue a random 6-digit code. No SMS route exists for India without DLT registration, so while
    OTP_SHOW_CODE is on (default) the code comes back in the response and the app shows it on screen."""
    now = time.time()
    held = _otps.get(body.phone)
    if held and now - held["sent_at"] < OTP_RESEND_S:
        raise HTTPException(429, f"Wait {int(OTP_RESEND_S - (now - held['sent_at'])) + 1} seconds before asking again.")
    code = f"{secrets.randbelow(10 ** 6):06d}"
    _otps[body.phone] = {"code": code, "exp": now + OTP_TTL_S, "tries": 0, "sent_at": now}
    log.info("otp issued for ***%s", body.phone[-4:])
    out = {"sent": True, "expires_in": OTP_TTL_S, "delivery": "screen" if SHOW_CODE else "none"}
    if SHOW_CODE:
        out["demo_code"] = code
    return out


@router.post("/otp/verify")
def otp_verify(body: OtpVerifyIn, session: Session = Depends(get_session)):
    held = _otps.get(body.phone)
    if held is None or time.time() > held["exp"]:
        _otps.pop(body.phone, None)
        raise HTTPException(401, "That code has expired. Ask for a new one.")
    held["tries"] += 1
    if held["tries"] > OTP_TRIES:
        _otps.pop(body.phone, None)
        raise HTTPException(429, "Too many wrong codes. Ask for a new one.")
    if not hmac.compare_digest(body.code.strip().encode(), held["code"].encode()):
        raise HTTPException(401, "Wrong code. Check the 6 digits and try again.")
    _otps.pop(body.phone, None)
    patient = session.scalar(select(Patient).where(Patient.phone == body.phone))
    if patient is None:
        patient = Patient(phone=body.phone)
        session.add(patient)
        session.commit()
    return {"token": make_token(patient.phone, "patient", hours=PATIENT_TOKEN_HOURS),
            "patient": {"id": patient.id, "name": patient.name, "phone": patient.phone, "language": patient.language,
                        "village": patient.village, "age": patient.age, "gender": patient.gender}}

import hmac
import logging
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import normalize_phone
from ..db import get_session
from ..models import DeskUser, Doctor, Facility, Patient
from ..security import hash_password, make_token, verify_password

log = logging.getLogger("sahay.auth")
router = APIRouter(prefix="/auth")

DEMO_PASSWORD = "demo1234"
ADMIN_EMAIL = "admin@sahay.demo"
# Checked when the email is unknown so a miss costs the same as a wrong password.
_DUMMY_HASH = hash_password("not-a-real-password")


def desk_email(facility_id: int) -> str:
    return f"desk{facility_id}@sahay.demo"


def doctor_email(doctor_id: int) -> str:
    return f"doctor{doctor_id}@sahay.demo"


def ensure_demo_users(session: Session) -> None:
    """One desk user per partner facility, one account per doctor there, plus one admin. Idempotent."""
    existing = set(session.scalars(select(DeskUser.email)))
    wanted = [(desk_email(f.id), "desk", f.id, None)
              for f in session.scalars(select(Facility).where(Facility.is_partner))]
    wanted += [(doctor_email(d.id), "desk", d.facility_id, d.id)
               for d in session.scalars(select(Doctor).join(Facility, Facility.id == Doctor.facility_id)
                                        .where(Facility.is_partner))]
    wanted.append((ADMIN_EMAIL, "admin", None, None))
    for email, role, facility_id, doctor_id in wanted:
        if email not in existing:
            session.add(DeskUser(email=email, password_hash=hash_password(DEMO_PASSWORD),
                                 role=role, facility_id=facility_id, doctor_id=doctor_id))
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
    return {"token": make_token(user.email, user.role, user.facility_id, user.doctor_id),
            "role": user.role, "facility_id": user.facility_id, "doctor_id": user.doctor_id}


@router.post("/otp/request")
def otp_request(body: OtpRequestIn):
    # Demo: no SMS is sent; every phone gets the fixed DEMO_OTP code.
    log.info("otp requested for ***%s", body.phone[-4:])
    return {"sent": True}


@router.post("/otp/verify")
def otp_verify(body: OtpVerifyIn, session: Session = Depends(get_session)):
    expected = os.environ.get("DEMO_OTP", "123456")
    if not hmac.compare_digest(body.code.encode(), expected.encode()):
        raise HTTPException(401, "wrong code")
    patient = session.scalar(select(Patient).where(Patient.phone == body.phone))
    if patient is None:
        patient = Patient(phone=body.phone)
        session.add(patient)
        session.commit()
    return {"token": make_token(patient.phone, "patient"),
            "patient": {"id": patient.id, "name": patient.name, "phone": patient.phone,
                        "language": patient.language, "village": patient.village}}

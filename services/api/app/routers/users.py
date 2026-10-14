"""Logins for a hospital's own people: receptionist, nurse and doctor.

The hospital admin manages their own hospital's logins; the Hello Sahay team (admin token) can do it for any
hospital and is the only one who can create a hospital admin. A doctor login is tied to one doctor record and
sees only that doctor's appointments.
"""
import re
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import DeskUser, Doctor, Facility
from ..security import check_facility, hash_password, require_hospital_admin
from ..slots import ensure_slots

router = APIRouter(prefix="/users")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
HOSPITAL_ADMIN_MAY_CREATE = ("receptionist", "nurse", "doctor")


class DoctorIn(BaseModel):
    department: str = Field(min_length=1, max_length=100)
    languages: list[str] = Field(default_factory=lambda: ["en"])


class UserIn(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    role: Literal["hospital_admin", "receptionist", "nurse", "doctor"]
    facility_id: int | None = None  # required for the Hello Sahay admin, ignored for a hospital admin
    doctor_id: int | None = None  # role doctor: an existing doctor who has no login yet
    doctor: DoctorIn | None = None  # role doctor: or create the doctor record now

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL.match(v):
            raise ValueError("enter a valid email address")
        return v


class UserPatch(BaseModel):
    password: str | None = Field(None, min_length=8, max_length=100)
    active: bool | None = None
    name: str | None = Field(None, min_length=1, max_length=200)


def _out(u: DeskUser, doctor: Doctor | None) -> dict:
    return {"id": u.id, "email": u.email, "name": u.name, "role": u.role, "active": u.active,
            "facility_id": u.facility_id, "doctor_id": u.doctor_id,
            "department": doctor.department if doctor else None}


def _scope(claims: dict, facility_id: int | None) -> int:
    """The facility a hospital admin works on; the Hello Sahay admin must name one."""
    if claims["role"] != "admin":
        return claims["facility_id"]
    if facility_id is None:
        raise HTTPException(422, "facility_id is required")
    return facility_id


@router.get("")
def list_users(facility_id: int | None = None, session: Session = Depends(get_session),
               claims: dict = Depends(require_hospital_admin)):
    facility_id = _scope(claims, facility_id)
    rows = session.execute(select(DeskUser, Doctor).outerjoin(Doctor, Doctor.id == DeskUser.doctor_id)
                           .where(DeskUser.facility_id == facility_id)
                           .order_by(DeskUser.role, DeskUser.name, DeskUser.id))
    order = {"hospital_admin": 0, "receptionist": 1, "nurse": 2, "doctor": 3}
    return sorted((_out(u, d) for u, d in rows), key=lambda x: order.get(x["role"], 9))


@router.post("", status_code=201)
def create_user(body: UserIn, session: Session = Depends(get_session),
                claims: dict = Depends(require_hospital_admin)):
    facility_id = _scope(claims, body.facility_id)
    if claims["role"] != "admin" and body.role not in HOSPITAL_ADMIN_MAY_CREATE:
        raise HTTPException(403, "only the Hello Sahay team creates a hospital admin")
    facility = session.get(Facility, facility_id)
    if facility is None:
        raise HTTPException(404, "facility not found")
    if session.scalar(select(DeskUser.id).where(DeskUser.email == body.email)):
        raise HTTPException(409, "that email already has a login")

    doctor = None
    if body.role == "doctor":
        if body.doctor_id is not None:
            doctor = session.get(Doctor, body.doctor_id)
            if doctor is None or doctor.facility_id != facility_id:
                raise HTTPException(404, "doctor not found at this hospital")
            if session.scalar(select(DeskUser.id).where(DeskUser.doctor_id == doctor.id)):
                raise HTTPException(409, "that doctor already has a login")
        elif body.doctor is not None:
            name = body.name.strip()
            doctor = Doctor(facility_id=facility_id, name=name if name.lower().startswith("dr") else f"Dr. {name}",
                            department=body.doctor.department.strip(),
                            languages=body.doctor.languages or ["en"])
            session.add(doctor)
            session.flush()
        else:
            raise HTTPException(422, "a doctor login needs doctor_id or doctor (department)")
    user = DeskUser(email=body.email, password_hash=hash_password(body.password), role=body.role,
                    facility_id=facility_id, doctor_id=doctor.id if doctor else None, name=body.name.strip())
    session.add(user)
    session.commit()
    if doctor is not None and facility.is_partner:
        ensure_slots(session, doctor_ids=[doctor.id])  # a new doctor is bookable straight away
    return _out(user, doctor)


@router.patch("/{user_id}")
def update_user(user_id: int, body: UserPatch, session: Session = Depends(get_session),
                claims: dict = Depends(require_hospital_admin)):
    user = session.get(DeskUser, user_id)
    if user is None or user.role == "admin":
        raise HTTPException(404, "user not found")
    check_facility(claims, user.facility_id)
    if claims["role"] != "admin" and user.role == "hospital_admin":
        raise HTTPException(403, "only the Hello Sahay team changes a hospital admin")
    if body.active is False and user.email == claims["sub"]:
        raise HTTPException(409, "you cannot switch off the login you are using")
    if body.password:
        user.password_hash = hash_password(body.password)
    if body.active is not None:
        user.active = body.active
    if body.name:
        user.name = body.name.strip()
    session.commit()
    return _out(user, session.get(Doctor, user.doctor_id) if user.doctor_id else None)

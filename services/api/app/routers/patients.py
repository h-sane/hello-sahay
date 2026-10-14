from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import IST, normalize_phone
from ..db import get_session
from ..models import Patient
from ..security import optional_claims

router = APIRouter()
FRESH_MINUTES = 30  # a location older than this is reported as not live


class LocationIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class ProfileIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    age: int = Field(ge=0, le=120)
    gender: Literal["female", "male", "other"]
    village: str = Field(min_length=2, max_length=200)
    language: Literal["ta", "hi", "en"] | None = None


def _phone(raw: str) -> str:
    try:
        return normalize_phone(raw)
    except ValueError:
        raise HTTPException(422, "invalid phone number")


@router.put("/patients/me")
def save_profile(body: ProfileIn, session: Session = Depends(get_session),
                 claims: dict | None = Depends(optional_claims)):
    """The signed-in patient saves their own details; the phone comes from the token, never the body."""
    if claims is None or claims.get("role") != "patient":
        raise HTTPException(401, "patient login required")
    p = session.scalar(select(Patient).where(Patient.phone == claims["sub"]))
    if p is None:
        raise HTTPException(404, "patient not found")
    p.name, p.age, p.gender, p.village = body.name.strip(), body.age, body.gender, body.village.strip()
    p.language = body.language or p.language
    p.consent_at = p.consent_at or datetime.now(IST)
    session.commit()
    return {"id": p.id, "name": p.name, "phone": p.phone, "age": p.age, "gender": p.gender,
            "village": p.village, "language": p.language}


@router.get("/patients/{phone}")
def patient_profile(phone: str, session: Session = Depends(get_session)):
    """What the helpline may know about a caller: registered or not, name, village and a fresh live location."""
    p = session.scalar(select(Patient).where(Patient.phone == _phone(phone)))
    if p is None:
        return {"registered": False, "location_live": False}
    live = (p.lat is not None and p.location_at is not None
            and (datetime.now(IST) - p.location_at).total_seconds() < FRESH_MINUTES * 60)
    return {"registered": True, "name": p.name, "village": p.village, "language": p.language,
            "location_live": live, "lat": p.lat if live else None, "lng": p.lng if live else None}


@router.put("/patients/{phone}/location")
def set_location(phone: str, body: LocationIn, session: Session = Depends(get_session),
                 claims: dict | None = Depends(optional_claims)):
    phone = _phone(phone)
    if claims is None or claims.get("role") != "patient" or claims.get("sub") != phone:
        raise HTTPException(401, "patient login required")
    p = session.scalar(select(Patient).where(Patient.phone == phone))
    if p is None:
        raise HTTPException(404, "patient not found")
    p.lat, p.lng, p.location_at = body.lat, body.lng, datetime.now(IST)
    session.commit()
    return {"ok": True}

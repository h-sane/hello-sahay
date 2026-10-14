from datetime import datetime

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


def _phone(raw: str) -> str:
    try:
        return normalize_phone(raw)
    except ValueError:
        raise HTTPException(422, "invalid phone number")


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

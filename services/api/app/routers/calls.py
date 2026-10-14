from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import normalize_phone
from ..db import get_session
from ..models import Call, Patient
from ..security import check_facility, require_staff
from .live import push

router = APIRouter()


class CallIn(BaseModel):
    patient_phone: str | None = None
    facility_id: int | None = None
    language: Literal["ta", "hi", "en"] | None = None
    transcript: list | dict | str | None = None
    summary: str | None = Field(None, max_length=4000)
    outcome: Literal["booked", "info_given", "emergency", "handed_off"] | None = None
    emergency: bool = False
    handoff: bool = False
    started_at: datetime | None = None
    duration_s: int | None = Field(None, ge=0)

    @field_validator("patient_phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return normalize_phone(v) if v else None


def _out(c: Call, phone: str | None) -> dict:
    return {"id": c.id, "patient_phone": phone, "facility_id": c.facility_id,
            "language": c.language, "transcript": c.transcript, "summary": c.summary,
            "outcome": c.outcome, "emergency": c.emergency, "handoff": c.handoff,
            "started_at": c.started_at, "duration_s": c.duration_s}


@router.post("/calls", status_code=201)
def create_call(body: CallIn, session: Session = Depends(get_session)):
    patient_id = None
    if body.patient_phone:
        patient = session.scalar(select(Patient).where(Patient.phone == body.patient_phone))
        if patient is None:
            patient = Patient(phone=body.patient_phone, language=body.language)
            session.add(patient)
            session.flush()
        patient_id = patient.id
    call = Call(patient_id=patient_id, facility_id=body.facility_id, language=body.language,
                transcript=body.transcript, summary=body.summary, outcome=body.outcome,
                emergency=body.emergency, handoff=body.handoff, duration_s=body.duration_s)
    if body.started_at:
        call.started_at = body.started_at
    session.add(call)
    session.commit()
    out = _out(call, body.patient_phone)
    push([call.facility_id], {"type": "call", "call": out})
    return out


def _list(session: Session, claims: dict, facility_id: int | None, handoff_only: bool, limit: int):
    if claims["role"] == "desk":
        check_facility(claims, facility_id if facility_id is not None else claims["facility_id"])
        facility_id = claims["facility_id"]
    query = (select(Call, Patient.phone).outerjoin(Patient, Patient.id == Call.patient_id)
             .order_by(Call.started_at.desc()).limit(limit))
    if facility_id is not None:
        query = query.where(Call.facility_id == facility_id)
    if handoff_only:
        query = query.where(Call.handoff.is_(True))
    return [_out(c, phone) for c, phone in session.execute(query)]


@router.get("/calls")
def list_calls(facility_id: int | None = None, limit: int = Query(50, ge=1, le=200),
               session: Session = Depends(get_session), claims: dict = Depends(require_staff)):
    return _list(session, claims, facility_id, False, limit)


@router.get("/handoffs")
def list_handoffs(facility_id: int | None = None, limit: int = Query(50, ge=1, le=200),
                  session: Session = Depends(get_session), claims: dict = Depends(require_staff)):
    return _list(session, claims, facility_id, True, limit)

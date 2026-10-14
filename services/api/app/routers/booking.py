from datetime import date as Date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import IST, day_range, normalize_phone, today_ist
from ..db import get_session
from ..models import Appointment, Doctor, Facility, Patient, Slot
from ..notify import send_whatsapp
from ..security import check_facility, optional_claims, require_staff
from .live import push

router = APIRouter()

_JOINED = (select(Appointment, Patient, Slot, Doctor, Facility)
           .join(Patient, Patient.id == Appointment.patient_id)
           .join(Slot, Slot.id == Appointment.slot_id)
           .join(Doctor, Doctor.id == Slot.doctor_id)
           .join(Facility, Facility.id == Doctor.facility_id))


def _out(row) -> dict:
    a, p, s, d, f = row
    return {
        "id": a.id, "status": a.status, "source": a.source, "reason_text": a.reason_text,
        "arrived_at": a.arrived_at,
        "patient": {"id": p.id, "name": p.name, "phone": p.phone,
                    "language": p.language, "village": p.village},
        "slot": {"id": s.id, "start": s.start, "end": s.end},
        "doctor": {"id": d.id, "name": d.name, "department": d.department},
        "facility": {"id": f.id, "name": f.name, "address": f.address, "phone": f.phone},
    }


def _load(session: Session, appointment_id: int) -> dict:
    return _out(session.execute(_JOINED.where(Appointment.id == appointment_id)).one())


def _facility_of(session: Session, slot_id: int) -> int:
    return session.scalar(select(Doctor.facility_id).join(Slot, Slot.doctor_id == Doctor.id)
                          .where(Slot.id == slot_id))


def _lock_open_slot(session: Session, slot_id: int) -> Slot:
    """Row lock so two concurrent bookings of one slot serialize; the loser gets 409."""
    slot = session.scalar(select(Slot).where(Slot.id == slot_id).with_for_update())
    if slot is None:
        raise HTTPException(404, "slot not found")
    if slot.status != "open":
        raise HTTPException(409, "slot is no longer available")
    if slot.start <= datetime.now(IST):
        raise HTTPException(409, "slot is in the past")
    return slot


class PatientIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone: str
    language: Literal["ta", "hi", "en"] | None = None
    village: str | None = Field(None, max_length=200)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class BookIn(BaseModel):
    patient: PatientIn
    slot_id: int
    source: Literal["helpline", "app", "desk"]
    reason_text: str | None = Field(None, max_length=1000)


class PatchIn(BaseModel):
    action: Literal["reschedule", "cancel", "arrived"]
    new_slot_id: int | None = None


@router.post("/appointments", status_code=201)
def book(body: BookIn, session: Session = Depends(get_session)):
    slot = _lock_open_slot(session, body.slot_id)
    p = body.patient
    patient = session.scalar(select(Patient).where(Patient.phone == p.phone))
    if patient is None:
        patient = Patient(phone=p.phone)
        session.add(patient)
    patient.name = p.name
    patient.language = p.language or patient.language
    patient.village = p.village or patient.village
    session.flush()
    appt = Appointment(patient_id=patient.id, slot_id=slot.id, source=body.source,
                       reason_text=body.reason_text, status="booked")
    slot.status = "booked"
    session.add(appt)
    session.commit()
    out = _load(session, appt.id)
    send_whatsapp(patient.phone, "booking_confirmed", appointment_id=appt.id)
    push([out["facility"]["id"]], {"type": "appointment", "appointment": out})
    return out


@router.patch("/appointments/{appointment_id}")
def change(appointment_id: int, body: PatchIn, session: Session = Depends(get_session),
           claims: dict | None = Depends(optional_claims)):
    appt = session.scalar(select(Appointment).where(Appointment.id == appointment_id)
                          .with_for_update())
    if appt is None:
        raise HTTPException(404, "appointment not found")
    if appt.status != "booked":
        raise HTTPException(409, f"appointment is already {appt.status}")
    old_slot = session.scalar(select(Slot).where(Slot.id == appt.slot_id).with_for_update())
    facilities = {_facility_of(session, old_slot.id)}

    if body.action == "arrived":
        # Arrival triggers the per-patient fee, so only that hospital's staff may mark it.
        if claims is None or claims["role"] not in ("desk", "admin"):
            raise HTTPException(401, "desk login required to mark arrival")
        check_facility(claims, next(iter(facilities)))
        appt.status, appt.arrived_at = "arrived", datetime.now(IST)
    elif body.action == "cancel":
        appt.status, old_slot.status = "cancelled", "open"
    else:
        if body.new_slot_id is None:
            raise HTTPException(422, "new_slot_id is required to reschedule")
        new_slot = _lock_open_slot(session, body.new_slot_id)
        old_slot.status, new_slot.status = "open", "booked"
        appt.slot_id = new_slot.id
        facilities.add(_facility_of(session, new_slot.id))

    session.commit()
    out = _load(session, appt.id)
    if body.action != "arrived":
        send_whatsapp(out["patient"]["phone"], f"appointment_{body.action}", appointment_id=appt.id)
    push(facilities, {"type": "appointment", "appointment": out})
    return out


@router.get("/appointments")
def desk_appointments(
    on: Date | None = Query(None, alias="date"),
    facility_id: int | None = None,
    session: Session = Depends(get_session),
    claims: dict = Depends(require_staff),
):
    """Desk list for the token's facility; admin may pass facility_id or see all."""
    if claims["role"] == "desk":
        facility_id = claims["facility_id"]
    start, end = day_range(on or today_ist())
    query = _JOINED.where(Slot.start >= start, Slot.start < end).order_by(Slot.start)
    if claims.get("doctor_id"):  # a doctor's own account sees only their patients
        query = query.where(Doctor.id == claims["doctor_id"])
    if facility_id is not None:
        query = query.where(Facility.id == facility_id)
    return [_out(r) for r in session.execute(query)]


@router.get("/patients/{phone}/appointments")
def patient_appointments(phone: str, session: Session = Depends(get_session)):
    try:
        phone = normalize_phone(phone)
    except ValueError:
        raise HTTPException(422, "invalid phone number")
    query = _JOINED.where(Patient.phone == phone).order_by(Slot.start)
    return [_out(r) for r in session.execute(query)]

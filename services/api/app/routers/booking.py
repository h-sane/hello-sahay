from datetime import date as Date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import IST, day_range, normalize_phone, today_ist
from ..db import get_session
from ..models import Appointment, Doctor, Facility, Patient, Slot
from ..notify import appointment_text, send_whatsapp
from ..security import FRONT_DESK_ROLES, check_facility, optional_claims, require_front_desk, require_staff
from .live import push

router = APIRouter()
WALK_IN_WAIT_MIN = 20

_JOINED = (select(Appointment, Patient, Slot, Doctor, Facility)
           .join(Patient, Patient.id == Appointment.patient_id)
           .join(Slot, Slot.id == Appointment.slot_id)
           .join(Doctor, Doctor.id == Slot.doctor_id)
           .join(Facility, Facility.id == Doctor.facility_id))


def _out(row) -> dict:
    a, p, s, d, f = row
    return {
        "id": a.id, "status": a.status, "source": a.source, "reason_text": a.reason_text,
        "arrived_at": a.arrived_at, "hospital_label": a.hospital_label,
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
    hospital_name: str | None = Field(None, max_length=200)  # the hospital the patient chose (demo wiring)


class PatchIn(BaseModel):
    action: Literal["reschedule", "cancel", "arrived", "complete", "no_show"]
    new_slot_id: int | None = None


class WalkInIn(BaseModel):
    patient: PatientIn
    doctor_id: int
    reason_text: str | None = Field(None, max_length=1000)


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
                       reason_text=body.reason_text, status="booked",
                       hospital_label=(body.hospital_name or "").strip() or None)
    slot.status = "booked"
    session.add(appt)
    session.commit()
    out = _load(session, appt.id)
    send_whatsapp(patient.phone, "booking_confirmed", appointment_text("booking_confirmed", out), appointment_id=appt.id)
    push([out["facility"]["id"]], {"type": "appointment", "appointment": out})
    return out


@router.post("/appointments/walk-in", status_code=201)
def walk_in(body: WalkInIn, session: Session = Depends(get_session), claims: dict = Depends(require_front_desk)):
    """A patient at the counter right now: takes the doctor's free slot starting within the next 20 minutes, or an
    extra slot starting now, and is marked arrived.

    Unlike a patient booking this never fails because the day's slots are used up or already past.
    """
    doctor = session.get(Doctor, body.doctor_id)
    if doctor is None:
        raise HTTPException(404, "doctor not found")
    check_facility(claims, doctor.facility_id)
    if not doctor.on_duty:
        raise HTTPException(409, f"{doctor.name} is off duty today")
    now = datetime.now(IST)
    _, day_end = day_range(now.date())
    soon = now + timedelta(minutes=WALK_IN_WAIT_MIN)
    slot = session.scalar(select(Slot).where(Slot.doctor_id == doctor.id, Slot.status == "open",
                                             Slot.end > now, Slot.start <= soon, Slot.start < day_end)
                          .order_by(Slot.start).limit(1).with_for_update())
    if slot is None:  # nothing left on the grid: an extra slot starting now
        start = now.replace(second=0, microsecond=0)
        slot = Slot(doctor_id=doctor.id, start=start, end=start + timedelta(minutes=15), status="open")
        session.add(slot)
        session.flush()
    p = body.patient
    patient = session.scalar(select(Patient).where(Patient.phone == p.phone))
    if patient is None:
        patient = Patient(phone=p.phone)
        session.add(patient)
    patient.name = p.name
    patient.language = p.language or patient.language
    patient.village = p.village or patient.village
    session.flush()
    appt = Appointment(patient_id=patient.id, slot_id=slot.id, source="desk", reason_text=body.reason_text,
                       status="arrived", arrived_at=now)
    slot.status = "booked"
    session.add(appt)
    session.commit()
    out = _load(session, appt.id)
    push([out["facility"]["id"]], {"type": "appointment", "appointment": out})
    return out


@router.patch("/appointments/{appointment_id}")
def change(appointment_id: int, body: PatchIn, session: Session = Depends(get_session),
           claims: dict | None = Depends(optional_claims)):
    appt = session.scalar(select(Appointment).where(Appointment.id == appointment_id)
                          .with_for_update())
    if appt is None:
        raise HTTPException(404, "appointment not found")
    old_slot = session.scalar(select(Slot).where(Slot.id == appt.slot_id).with_for_update())
    facilities = {_facility_of(session, old_slot.id)}
    needs = "arrived" if body.action == "complete" else "booked"
    if appt.status != needs:
        raise HTTPException(409, f"appointment is already {appt.status}" if needs == "booked"
                            else "only a patient who has arrived can be completed")

    if body.action in ("arrived", "no_show", "complete"):
        # Arrival triggers the per-patient fee, so only that hospital's staff may change it.
        if claims is None or claims["role"] not in (*FRONT_DESK_ROLES, "admin", "doctor"):
            raise HTTPException(401, "desk login required")
        check_facility(claims, next(iter(facilities)))
        if claims["role"] == "doctor" and (body.action != "complete" or claims["doctor_id"] != old_slot.doctor_id):
            raise HTTPException(403, "a doctor can only complete their own patients")
        if body.action == "arrived":
            appt.status, appt.arrived_at = "arrived", datetime.now(IST)
        elif body.action == "complete":
            appt.status = "completed"
        else:
            appt.status = "no_show"
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
    if body.action in ("cancel", "reschedule"):
        kind = f"appointment_{body.action}"
        send_whatsapp(out["patient"]["phone"], kind, appointment_text(kind, out), appointment_id=appt.id)
    push(facilities, {"type": "appointment", "appointment": out})
    return out


@router.get("/appointments")
def desk_appointments(
    on: Date | None = Query(None, alias="date"),
    history: bool = False,
    facility_id: int | None = None,
    session: Session = Depends(get_session),
    claims: dict = Depends(require_staff),
):
    """Desk list for the token's facility; admin may pass facility_id or see all.

    history=true lists everything before today instead (newest first, 300 at most): the doctor's "past patients".
    """
    if claims["role"] != "admin":
        facility_id = claims["facility_id"]
    start, end = day_range(on or today_ist())
    if history:
        query = _JOINED.where(Slot.start < day_range(today_ist())[0]).order_by(Slot.start.desc()).limit(300)
    else:
        query = _JOINED.where(Slot.start >= start, Slot.start < end).order_by(Slot.start)
    if claims["role"] == "doctor":  # a doctor's own account sees only their patients
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

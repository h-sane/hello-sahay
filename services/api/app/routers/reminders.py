"""Medicine reminders kept on the server, with an "I took it" log the family can see."""
import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import today_ist
from ..db import get_session
from ..models import Patient, Reminder
from ..models_patient_app import CarePlan, ReminderTaken
from .care import me, notify

router = APIRouter()
TIME = r"^([01]\d|2[0-3]):[0-5]\d$"


class ReminderIn(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=200)
    times: list[str] = Field(min_length=1, max_length=6)
    active: bool = True


def _json(session: Session, r: Reminder, today: date) -> dict:
    taken = session.scalars(select(ReminderTaken.at_time).where(ReminderTaken.reminder_id == r.id,
                                                                ReminderTaken.day == today)).all()
    return {"id": r.id, "medicine_name": r.medicine_name, "times": sorted(r.times or []), "active": r.active,
            "taken_today": sorted(taken)}


def _valid_times(times: list[str]) -> list[str]:
    clean = sorted({t.strip() for t in times})
    if not all(re.match(TIME, t) for t in clean):
        raise HTTPException(422, "times must look like 08:00")
    return clean


def _own(session: Session, patient: Patient, reminder_id: int) -> Reminder:
    r = session.get(Reminder, reminder_id)
    if r is None or r.patient_id != patient.id:
        raise HTTPException(404, "reminder not found")
    return r


@router.get("/reminders")
def list_reminders(patient: Patient = Depends(me), session: Session = Depends(get_session)):
    rows = session.scalars(select(Reminder).where(Reminder.patient_id == patient.id).order_by(Reminder.id)).all()
    today = today_ist()
    return [_json(session, r, today) for r in rows]


@router.post("/reminders", status_code=201)
def add_reminder(body: ReminderIn, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    r = Reminder(patient_id=patient.id, medicine_name=body.medicine_name.strip(), times=_valid_times(body.times),
                 active=body.active)
    session.add(r)
    session.commit()
    return _json(session, r, today_ist())


@router.put("/reminders/{reminder_id}")
def edit_reminder(reminder_id: int, body: ReminderIn, patient: Patient = Depends(me),
                  session: Session = Depends(get_session)):
    r = _own(session, patient, reminder_id)
    r.medicine_name, r.times, r.active = body.medicine_name.strip(), _valid_times(body.times), body.active
    session.commit()
    return _json(session, r, today_ist())


@router.delete("/reminders/{reminder_id}", status_code=204)
def delete_reminder(reminder_id: int, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    r = _own(session, patient, reminder_id)
    for t in session.scalars(select(ReminderTaken).where(ReminderTaken.reminder_id == r.id)):
        session.delete(t)
    session.delete(r)
    session.commit()


class TakenIn(BaseModel):
    at_time: str = Field(pattern=TIME)


@router.post("/reminders/{reminder_id}/taken")
def taken(reminder_id: int, body: TakenIn, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    r = _own(session, patient, reminder_id)
    today = today_ist()
    already = session.scalar(select(ReminderTaken).where(
        ReminderTaken.reminder_id == r.id, ReminderTaken.day == today, ReminderTaken.at_time == body.at_time))
    if already is None:
        session.add(ReminderTaken(reminder_id=r.id, day=today, at_time=body.at_time))
        who = patient.name or "Your family member"
        for plan in session.scalars(select(CarePlan).where(CarePlan.parent_phone == patient.phone, CarePlan.active)):
            notify(session, plan.payer_phone, "medicine_taken", f"{who} took {r.medicine_name}", f"Dose of {body.at_time}")
        session.commit()
    return _json(session, r, today)

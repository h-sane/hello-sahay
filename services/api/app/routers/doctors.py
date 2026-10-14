"""A hospital's doctors with the day's load, and the on-duty switch.

The roster comes from the doctor table, so a doctor with no slots or no bookings still shows up.
"""
from datetime import date as Date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import day_range, today_ist
from ..db import get_session
from ..models import Appointment, DeskUser, Doctor, Slot
from ..security import check_facility, require_staff

router = APIRouter()


class DutyIn(BaseModel):
    on_duty: bool


def _view(d: Doctor, slots: dict, login: DeskUser | None) -> dict:
    s = slots.get(d.id, {})
    return {"id": d.id, "name": d.name, "department": d.department, "languages": d.languages or [],
            "on_duty": d.on_duty, "has_login": login is not None, "login_email": login.email if login else None,
            "booked_slots": s.get("booked", 0), "open_slots": s.get("open", 0),
            "first_start": s.get("first"), "last_end": s.get("last")}


@router.get("/doctors")
def list_doctors(facility_id: int | None = None, on: Date | None = Query(None, alias="date"),
                 session: Session = Depends(get_session), claims: dict = Depends(require_staff)):
    if claims["role"] != "admin":
        facility_id = claims["facility_id"]
    elif facility_id is None:
        raise HTTPException(422, "facility_id is required")
    start, end = day_range(on or today_ist())
    query = select(Doctor).where(Doctor.facility_id == facility_id).order_by(Doctor.department, Doctor.name)
    if claims["role"] == "doctor":  # a doctor sees only their own card
        query = query.where(Doctor.id == claims["doctor_id"])
    doctors = list(session.scalars(query))
    ids = [d.id for d in doctors]
    slots: dict[int, dict] = {}
    for doctor_id, status, n, first, last in session.execute(
            select(Slot.doctor_id, Slot.status, func.count(), func.min(Slot.start), func.max(Slot.end))
            .where(Slot.doctor_id.in_(ids), Slot.start >= start, Slot.start < end)
            .group_by(Slot.doctor_id, Slot.status)):
        s = slots.setdefault(doctor_id, {})
        s[status] = n
        s["first"] = first if not s.get("first") or first < s["first"] else s["first"]
        s["last"] = last if not s.get("last") or last > s["last"] else s["last"]
    logins = {u.doctor_id: u for u in session.scalars(select(DeskUser).where(DeskUser.doctor_id.in_(ids)))}
    return [_view(d, slots, logins.get(d.id)) for d in doctors]


@router.patch("/doctors/{doctor_id}")
def set_duty(doctor_id: int, body: DutyIn, session: Session = Depends(get_session),
             claims: dict = Depends(require_staff)):
    doctor = session.get(Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(404, "doctor not found")
    check_facility(claims, doctor.facility_id)
    if claims["role"] == "doctor" and claims["doctor_id"] != doctor.id:
        raise HTTPException(403, "doctors change only their own availability")
    doctor.on_duty = body.on_duty
    session.commit()
    return {"id": doctor.id, "on_duty": doctor.on_duty}

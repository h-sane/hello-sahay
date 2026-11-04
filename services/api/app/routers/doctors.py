"""A hospital's doctors with the day's load, the on-duty switch and each doctor's timetable.

The roster comes from the doctor table, so a doctor with no slots or no bookings still shows up.
"""
import re
from datetime import date as Date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import IST, day_range, today_ist
from ..db import get_session
from ..models import Appointment, DeskUser, Doctor, Slot
from ..security import check_facility, require_front_desk, require_staff
from ..slots import day_plan, effective_schedule, sync_doctor

router = APIRouter()


class DutyIn(BaseModel):
    on_duty: bool


_HHMM = re.compile(r"([01]\d|2[0-3]):[0-5]\d")


class ScheduleIn(BaseModel):
    """mode appointments: slots back to back. mode partial: after every `run` slots, `break_minutes` with no slot,
    kept for walk-in patients."""
    mode: Literal["appointments", "partial"]
    slot_minutes: int = Field(ge=5, le=120)
    run: int = Field(1, ge=1, le=12)
    break_minutes: int = Field(0, ge=0, le=120)
    windows: list[tuple[str, str]] = Field(min_length=1, max_length=4)
    days_off: list[int] = []
    apply_to_all: bool = False  # every doctor at the same hospital gets this timetable

    @model_validator(mode="after")
    def _check(self):
        if self.slot_minutes % 5 or self.break_minutes % 5:
            raise ValueError("slot and break lengths must be multiples of 5 minutes")
        if self.mode == "partial" and self.break_minutes < 5:
            raise ValueError("choose how long the walk-in break is")
        if self.mode == "appointments":
            self.run, self.break_minutes = 1, 0
        last = ""
        for begin, end in self.windows:
            if not (_HHMM.fullmatch(begin) and _HHMM.fullmatch(end)) or begin >= end or begin < last:
                raise ValueError("working hours must be HH:MM, start before end, and not overlap")
            if (int(end[:2]) * 60 + int(end[3:])) - (int(begin[:2]) * 60 + int(begin[3:])) < self.slot_minutes:
                raise ValueError("a working period is shorter than one slot")
            last = end
        if len(set(self.days_off)) != len(self.days_off) or not all(0 <= d <= 6 for d in self.days_off)                 or len(self.days_off) == 7:
            raise ValueError("days off must be different weekdays, and not all seven")
        return self

    def stored(self) -> dict:
        return {"mode": self.mode, "slot_minutes": self.slot_minutes, "run": self.run,
                "break_minutes": self.break_minutes, "windows": [list(w) for w in self.windows],
                "days_off": sorted(self.days_off)}


def _view(d: Doctor, slots: dict, login: DeskUser | None) -> dict:
    s = slots.get(d.id, {})
    return {"id": d.id, "name": d.name, "department": d.department, "languages": d.languages or [],
            "on_duty": d.on_duty, "has_login": login is not None, "login_email": login.email if login else None,
            "booked_slots": s.get("booked", 0), "open_slots": s.get("open", 0),
            "first_start": s.get("first"), "last_end": s.get("last"),
            "schedule": effective_schedule(d), "schedule_custom": d.schedule is not None}


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


@router.post("/schedule/preview")
def preview_schedule(body: ScheduleIn, claims: dict = Depends(require_front_desk)):
    """One working day laid out, so the editor can show appointments and walk-in breaks before anything is saved."""
    plan = body.stored()
    plan["days_off"] = []
    plan_day = list(day_plan(plan, today_ist()))
    return {"pieces": [{"start": s.strftime("%H:%M"), "end": e.strftime("%H:%M"), "kind": kind}
                       for s, e, kind in plan_day],
            "appointment_slots": sum(kind == "appointment" for _, _, kind in plan_day),
            "walk_in_minutes": sum(int((e - s).total_seconds() // 60) for s, e, kind in plan_day if kind == "walk_in")}


@router.put("/doctors/{doctor_id}/schedule")
def set_schedule(doctor_id: int, body: ScheduleIn, session: Session = Depends(get_session),
                 claims: dict = Depends(require_front_desk)):
    """Save the timetable and re-lay the coming week's slots; bookings already made are never moved or dropped."""
    doctor = session.get(Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(404, "doctor not found")
    check_facility(claims, doctor.facility_id)
    targets = list(session.scalars(select(Doctor).where(Doctor.facility_id == doctor.facility_id)))         if body.apply_to_all else [doctor]
    out = []
    for d in targets:
        d.schedule = body.stored()
        out.append({"id": d.id, "name": d.name, **sync_doctor(session, d, since=datetime.now(IST))})
    session.commit()
    return {"saved": out}

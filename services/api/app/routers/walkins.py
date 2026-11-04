"""Walk-in queue: patients at the counter without an appointment.

They are not slots. The hospital keeps break time in the doctor's timetable for them (see slots.py) and the Desk
calls them in during it. Each gets a number for the hospital's day, shown as W1, W2, ...
"""
from datetime import date as Date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..common import IST, normalize_phone, today_ist
from ..db import get_session
from ..models import Doctor, WalkIn
from ..security import check_facility, require_front_desk, require_staff
from .live import push

router = APIRouter()


class WalkInIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone: str | None = None
    doctor_id: int
    reason_text: str | None = Field(None, max_length=1000)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return normalize_phone(v) if v and v.strip() else None


class WalkInPatch(BaseModel):
    action: Literal["start", "done", "left"]


def _out(w: WalkIn) -> dict:
    return {"id": w.id, "label": f"W{w.number}", "number": w.number, "day": w.day, "facility_id": w.facility_id,
            "doctor_id": w.doctor_id, "name": w.name, "phone": w.phone, "reason_text": w.reason_text,
            "status": w.status, "created_at": w.created_at, "started_at": w.started_at,
            "finished_at": w.finished_at}


@router.post("/walk-ins", status_code=201)
def add_walk_in(body: WalkInIn, session: Session = Depends(get_session), claims: dict = Depends(require_front_desk)):
    doctor = session.get(Doctor, body.doctor_id)
    if doctor is None:
        raise HTTPException(404, "doctor not found")
    check_facility(claims, doctor.facility_id)
    if not doctor.on_duty:
        raise HTTPException(409, f"{doctor.name} is off duty today")
    day = today_ist()
    for _ in range(3):  # two desks adding at the same moment can pick the same number; the loser retries
        number = session.scalar(select(func.coalesce(func.max(WalkIn.number), 0) + 1)
                                .where(WalkIn.facility_id == doctor.facility_id, WalkIn.day == day))
        walk_in = WalkIn(facility_id=doctor.facility_id, doctor_id=doctor.id, day=day, number=number,
                         name=body.name.strip(), phone=body.phone, reason_text=body.reason_text)
        session.add(walk_in)
        try:
            session.commit()
            break
        except IntegrityError:
            session.rollback()
    else:
        raise HTTPException(409, "could not number the walk-in, try again")
    out = _out(walk_in)
    push([walk_in.facility_id], {"type": "walk_in", "walk_in": out})
    return out


@router.get("/walk-ins")
def list_walk_ins(on: Date | None = Query(None, alias="date"), facility_id: int | None = None,
                  session: Session = Depends(get_session), claims: dict = Depends(require_staff)):
    if claims["role"] != "admin":
        facility_id = claims["facility_id"]
    elif facility_id is None:
        raise HTTPException(422, "facility_id is required")
    query = select(WalkIn).where(WalkIn.facility_id == facility_id, WalkIn.day == (on or today_ist())) \
        .order_by(WalkIn.number)
    if claims["role"] == "doctor":
        query = query.where(WalkIn.doctor_id == claims["doctor_id"])
    return [_out(w) for w in session.scalars(query)]


@router.patch("/walk-ins/{walk_in_id}")
def change_walk_in(walk_in_id: int, body: WalkInPatch, session: Session = Depends(get_session),
                   claims: dict = Depends(require_staff)):
    w = session.scalar(select(WalkIn).where(WalkIn.id == walk_in_id).with_for_update())
    if w is None:
        raise HTTPException(404, "walk-in not found")
    check_facility(claims, w.facility_id)
    if claims["role"] == "doctor" and (claims["doctor_id"] != w.doctor_id or body.action == "left"):
        raise HTTPException(403, "a doctor can only start and finish their own walk-ins")
    needs = "in_consult" if body.action == "done" else "waiting"
    if w.status != needs:
        raise HTTPException(409, f"walk-in {w.number} is already {w.status}")
    now = datetime.now(IST)
    w.status = {"start": "in_consult", "done": "done", "left": "left"}[body.action]
    if body.action == "start":
        w.started_at = now
    else:
        w.finished_at = now
    session.commit()
    out = _out(w)
    push([w.facility_id], {"type": "walk_in", "walk_in": out})
    return out

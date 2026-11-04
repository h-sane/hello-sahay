"""Appointment slots for partner doctors: 15 minutes each, 09:00-13:00 and 16:00-18:00 IST.

Demo doctors are not on duty every minute: each has one weekly day off, and about a third of the remaining slots are
already taken (status blocked) by walk-ins and earlier bookings. Both are a fixed function of doctor and time, so
re-running never changes an answer.

Slots are created ahead of time and only ever added (booked and past ones are history), so this can run at every
start-up, every few hours and from the seed loader without touching anything that already exists.
"""
import asyncio
import logging
from datetime import datetime, time, timedelta

import anyio
from sqlalchemy import select
from sqlalchemy.orm import Session

from .common import IST, today_ist
from .db import SessionLocal
from .models import Appointment, Doctor, Facility, Slot

log = logging.getLogger("sahay.slots")
DAYS_AHEAD = 7
SLOT_MINUTES = 15
WINDOWS = [(time(9), time(13)), (time(16), time(18))]
REFRESH_EVERY_S = 6 * 3600


def _day_slots(day):
    step = timedelta(minutes=SLOT_MINUTES)
    for begin, end in WINDOWS:
        t, stop = datetime.combine(day, begin, IST), datetime.combine(day, end, IST)
        while t < stop:
            yield t, t + step
            t += step


def _day_off(doctor_id: int, day) -> bool:
    return day.weekday() == (doctor_id * 3) % 7


def _taken(doctor_id: int, start: datetime) -> bool:
    return (doctor_id * 7 + start.toordinal() * 5 + start.hour * 3 + start.minute // 15 * 2) % 10 < 3


def ensure_slots(session: Session, days: int = DAYS_AHEAD, doctor_ids: list[int] | None = None) -> int:
    """Create the missing slots for today and the next days-1 days. Returns how many were added."""
    query = select(Doctor.id).join(Facility, Facility.id == Doctor.facility_id).where(Facility.is_partner.is_(True))
    if doctor_ids is not None:
        query = query.where(Doctor.id.in_(doctor_ids))
    ids = list(session.scalars(query))
    if not ids:
        return 0
    today = today_ist()
    first = datetime.combine(today, time.min, IST)
    have = set(session.execute(
        select(Slot.doctor_id, Slot.start).where(Slot.doctor_id.in_(ids), Slot.start >= first)).all())
    added = [Slot(doctor_id=did, start=start, end=end, status="blocked" if _taken(did, start) else "open")
             for did in ids for d in range(days) for start, end in _day_slots(today + timedelta(days=d))
             if (did, start) not in have and not _day_off(did, start.date())]
    session.add_all(added)
    _apply_schedule(session, ids, first)
    session.commit()
    return len(added)


def _apply_schedule(session: Session, ids: list[int], first: datetime) -> None:
    """Bring slots made before the schedule existed in line with it; booked slots are never touched."""
    free = select(Slot).where(Slot.doctor_id.in_(ids), Slot.start >= first, Slot.status == "open",
                              Slot.id.not_in(select(Appointment.slot_id)))
    for slot in session.scalars(free):
        local = slot.start.astimezone(IST)
        if _day_off(slot.doctor_id, local.date()):
            session.delete(slot)
        elif _taken(slot.doctor_id, local):
            slot.status = "blocked"


def _refresh() -> None:
    with SessionLocal() as session:
        n = ensure_slots(session)
    if n:
        log.info("added %d slots", n)


async def keep_slots_fresh() -> None:
    """Background loop started with the API so the demo never runs out of future slots."""
    while True:
        try:
            await anyio.to_thread.run_sync(_refresh)
        except Exception:
            log.exception("slot refresh failed")
        await asyncio.sleep(REFRESH_EVERY_S)

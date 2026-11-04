"""Appointment slots for partner doctors, laid out by each doctor's timetable (Doctor.schedule).

A timetable is a mode (appointments only, or partial: a break after every few slots that the hospital keeps for
walk-in patients), the slot length, working windows and weekly days off. Break time has no slot rows at all, so the
helpline and the patient app can never offer it. A doctor whose schedule was never set (None) keeps the demo default:
15-minute slots 09:00-13:00 and 16:00-18:00 IST, one weekly day off, and about a third of the slots already taken
(status blocked) by earlier bookings; both are a fixed function of doctor and time, so re-running never changes an answer.

Slots are created ahead of time and only ever added or removed while nobody holds them: booked slots and their
appointments are never touched, so this can run at every start-up, every few hours, from the seed loader and whenever a
hospital edits a timetable.
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
DEFAULT_SCHEDULE = {"mode": "appointments", "slot_minutes": SLOT_MINUTES, "run": 1, "break_minutes": 0,
                    "windows": [["09:00", "13:00"], ["16:00", "18:00"]], "days_off": []}
REFRESH_EVERY_S = 6 * 3600


def _clock(text: str) -> time:
    hour, minute = text.split(":")
    return time(int(hour), int(minute))


def day_plan(schedule: dict, day):
    """One day as (start, end, kind) pieces: 'appointment' slots and, in partial mode, the 'walk_in' breaks between runs."""
    if day.weekday() in schedule["days_off"]:
        return
    step = timedelta(minutes=schedule["slot_minutes"])
    gap = timedelta(minutes=schedule["break_minutes"]) if schedule["mode"] == "partial" else timedelta(0)
    for begin, end in schedule["windows"]:
        t, stop = datetime.combine(day, _clock(begin), IST), datetime.combine(day, _clock(end), IST)
        booked = 0
        while t + step <= stop:
            yield t, t + step, "appointment"
            t += step
            booked += 1
            if gap and booked % schedule["run"] == 0 and t < stop:
                yield t, min(t + gap, stop), "walk_in"
                t += gap


def _day_slots(day):
    for start, end, _ in day_plan(DEFAULT_SCHEDULE, day):
        yield start, end


def _day_off(doctor_id: int, day) -> bool:
    return day.weekday() == (doctor_id * 3) % 7


def _taken(doctor_id: int, start: datetime) -> bool:
    return (doctor_id * 7 + start.toordinal() * 5 + start.hour * 3 + start.minute // 15 * 2) % 10 < 3


def effective_schedule(doctor: Doctor) -> dict:
    """The timetable in force, including the demo default's weekly day off, for showing in the editor."""
    return doctor.schedule or {**DEFAULT_SCHEDULE, "days_off": [(doctor.id * 3) % 7]}


def _wanted(doctor: Doctor, day) -> list[tuple[datetime, datetime]]:
    if doctor.schedule is None:
        return [] if _day_off(doctor.id, day) else list(_day_slots(day))
    return [(s, e) for s, e, kind in day_plan(doctor.schedule, day) if kind == "appointment"]


def sync_doctor(session: Session, doctor: Doctor, days: int = DAYS_AHEAD, since: datetime | None = None) -> dict:
    """Make the doctor's slots from `since` (default: start of today) on the next days match the timetable.

    Slots nobody holds are added, removed or reopened; a slot with an active appointment stays even if the new
    timetable no longer has it (counted as kept_outside), and nothing is added that would overlap such a slot.
    """
    today = today_ist()
    since = since or datetime.combine(today, time.min, IST)
    custom = doctor.schedule is not None
    wanted = {s: e for d in range(days) for s, e in _wanted(doctor, today + timedelta(days=d))}
    existing = {s.start: s for s in session.scalars(select(Slot).where(Slot.doctor_id == doctor.id, Slot.start >= since))}
    used = session.execute(select(Appointment.slot_id, Appointment.status)
                           .where(Appointment.slot_id.in_([s.id for s in existing.values()]))).all()
    ever = {sid for sid, _ in used}
    live = {sid for sid, status in used if status != "cancelled"}
    in_grid, kept_outside, removed = set(), [], 0
    for start, slot in existing.items():
        if wanted.get(start) == slot.end:
            in_grid.add(start)
            if slot.id not in ever:
                if custom:
                    slot.status = "open"
                elif slot.status == "open" and _taken(doctor.id, start):
                    slot.status = "blocked"
        elif slot.id in live:
            kept_outside.append(slot)
        elif slot.id in ever:
            slot.status = "blocked"
        else:
            session.delete(slot)
            removed += 1
    added = [Slot(doctor_id=doctor.id, start=start, end=end,
                  status="blocked" if not custom and _taken(doctor.id, start) else "open")
             for start, end in wanted.items()
             if start not in in_grid and start >= since
             and not any(k.start < end and start < k.end for k in kept_outside)]
    session.add_all(added)
    return {"added": len(added), "removed": removed, "kept_outside": len(kept_outside)}


def ensure_slots(session: Session, days: int = DAYS_AHEAD, doctor_ids: list[int] | None = None) -> int:
    """Create the missing slots for today and the next days-1 days. Returns how many were added."""
    query = select(Doctor).join(Facility, Facility.id == Doctor.facility_id).where(Facility.is_partner.is_(True))
    if doctor_ids is not None:
        query = query.where(Doctor.id.in_(doctor_ids))
    added = sum(sync_doctor(session, d, days)["added"] for d in session.scalars(query))
    session.commit()
    return added


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

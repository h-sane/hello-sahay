"""DEMO DATA for Sahay Desk: logins, appointments and helpline calls for the one demo hospital.

Everything is created only when missing, never overwritten, so a redeploy in the middle of a demo keeps whatever the
team has already clicked (arrived, done, callback made, changed passwords).
"""
import csv
from datetime import datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import Appointment, Call, DeskUser, Doctor, Facility, Patient, Slot
from app.routers.auth import DEMO_PASSWORD
from app.security import hash_password
from app.slots import SLOT_MINUTES

SEED = Path(__file__).resolve().parents[1] / "data" / "seed"
IST = ZoneInfo("Asia/Kolkata")


def read_csv(name):
    with open(SEED / name, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(line for line in f if not line.startswith("#")))


def _at(day_offset: str, hhmm: str) -> datetime:
    h, m = (int(x) for x in hhmm.split(":"))
    day = datetime.now(IST).date() + timedelta(days=int(day_offset))
    return datetime.combine(day, time(h, m), IST)


def retire_old_logins(session: Session) -> None:
    """Drop logins from the multi-hospital demo: per-doctor doctor<id>@ accounts and desks of hospitals that are no longer partners."""
    session.execute(delete(DeskUser).where(DeskUser.email.op("~")(r"^doctor\d+@sahay\.demo$")))
    partners = select(Facility.id).where(Facility.is_partner.is_(True))
    session.execute(delete(DeskUser).where(DeskUser.email.op("~")(r"^desk\d+@sahay\.demo$"),
                                           DeskUser.facility_id.not_in(partners)))


def seed_users(session: Session, facilities: dict, doctors: dict) -> int:
    have = set(session.scalars(select(DeskUser.email)))
    made = 0
    for r in read_csv("users.csv"):
        if r["email"] in have:
            continue
        doctor = doctors.get((r["facility_name"], r["doctor_name"])) if r["doctor_name"] else None
        session.add(DeskUser(email=r["email"], name=r["name"], role=r["role"], password_hash=hash_password(DEMO_PASSWORD),
                             facility_id=facilities[r["facility_name"]].id, doctor_id=doctor.id if doctor else None))
        made += 1
    session.flush()
    return made


def seed_appointments(session: Session, hospital: Facility) -> int:
    doctors = {d.name: d for d in session.scalars(select(Doctor).where(Doctor.facility_id == hospital.id))}
    made = 0
    for r in read_csv("demo_appointments.csv"):
        doctor, start = doctors[r["doctor_name"]], _at(r["day_offset"], r["time"])
        slot = session.scalar(select(Slot).where(Slot.doctor_id == doctor.id, Slot.start == start))
        if slot is None:  # past days have no generated slots
            slot = Slot(doctor_id=doctor.id, start=start, end=start + timedelta(minutes=SLOT_MINUTES), status="open")
            session.add(slot)
            session.flush()
        phone = "+91" + r["phone"]
        patient = session.scalar(select(Patient).where(Patient.phone == phone))
        if patient is None:
            patient = Patient(phone=phone, name=r["patient_name"], village=r["village"], language="ta")
            session.add(patient)
            session.flush()
        status = r["status"]
        if session.scalar(select(Appointment.id).where(Appointment.slot_id == slot.id,
                                                       Appointment.patient_id == patient.id)):
            continue  # already seeded (and possibly changed since)
        if status == "cancelled":  # a cancelled booking leaves its slot open
            session.add(Appointment(patient_id=patient.id, slot_id=slot.id, source=r["source"],
                                    reason_text=r["reason"], status="cancelled"))
            made += 1
            continue
        if slot.status != "open":
            continue
        arrived = status in ("arrived", "completed")
        session.add(Appointment(patient_id=patient.id, slot_id=slot.id, source=r["source"], reason_text=r["reason"],
                                status=status, arrived_at=start if arrived else None))
        slot.status = "booked"
        made += 1
    session.flush()
    return made


def seed_calls(session: Session, hospital: Facility) -> int:
    made = 0
    for r in read_csv("demo_calls.csv"):
        start = _at(r["day_offset"], r["time"])
        taken = session.scalar(select(func.count()).select_from(Call).where(
            Call.summary == r["summary"], Call.started_at >= start.replace(hour=0, minute=0),
            Call.started_at < start.replace(hour=0, minute=0) + timedelta(days=1)))
        if taken:
            continue
        phone = "+91" + r["phone"]
        patient = session.scalar(select(Patient).where(Patient.phone == phone))
        if patient is None:
            patient = Patient(phone=phone, language=r["language"])
            session.add(patient)
            session.flush()
        transcript = [{"role": "user", "text": r["caller_line"]}, {"role": "assistant", "text": r["sahay_line"]}]
        session.add(Call(patient_id=patient.id, facility_id=hospital.id, language=r["language"], transcript=transcript,
                         summary=r["summary"], outcome=r["outcome"], emergency=r["emergency"] == "true",
                         handoff=r["handoff"] == "true", started_at=start, duration_s=int(r["duration_s"])))
        made += 1
    session.flush()
    return made

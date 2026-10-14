"""Load the DEMO DATA in data/seed into Postgres. Safe to run repeatedly.

Facilities and doctors are updated in place (matched by name) so ids that
desk users and appointments reference stay valid. Open slots are regenerated;
booked and blocked slots are kept.
"""
import csv
import sys
from datetime import datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "api"))

from sqlalchemy import delete, select  # noqa: E402

from app.db import SessionLocal, init_db  # noqa: E402
from app.models import Doctor, Facility, Slot  # noqa: E402

SEED = ROOT / "data" / "seed"
IST = ZoneInfo("Asia/Kolkata")
DAYS = 3
SLOT_MINUTES = 15
WINDOWS = [(time(9), time(13)), (time(16), time(18))]


def read_csv(name):
    with open(SEED / name, encoding="utf-8-sig", newline="") as f:
        rows = (line for line in f if not line.startswith("#"))
        return list(csv.DictReader(rows))


def upsert(session, model, key, values):
    row = session.scalars(select(model).filter_by(**key)).first()
    if row is None:
        row = model(**key)
        session.add(row)
    for k, v in values.items():
        setattr(row, k, v)
    session.flush()
    return row


def slot_times():
    today = datetime.now(IST).date()
    step = timedelta(minutes=SLOT_MINUTES)
    for d in range(DAYS):
        day = today + timedelta(days=d)
        for begin, end in WINDOWS:
            t = datetime.combine(day, begin, IST)
            stop = datetime.combine(day, end, IST)
            while t < stop:
                yield t, t + step
                t += step


def main():
    init_db()
    with SessionLocal() as session:
        facilities = {}
        for r in read_csv("facilities.csv"):
            facilities[r["name"]] = upsert(
                session, Facility, {"name": r["name"]},
                dict(
                    type=r["type"], address=r["address"],
                    lat=float(r["lat"]), lng=float(r["lng"]),
                    phone=r["phone"], hours=r["hours"],
                    departments=r["departments"].split("|"),
                    pmjay=r["pmjay"] == "true", cmchis=r["cmchis"] == "true",
                    is_partner=r["is_partner"] == "true", plan=r["plan"] or None,
                ),
            )

        doctors = []
        for r in read_csv("doctors.csv"):
            fac = facilities[r["facility_name"]]
            doc = upsert(
                session, Doctor, {"facility_id": fac.id, "name": r["name"]},
                dict(department=r["department"], languages=r["languages"].split("|")),
            )
            doctors.append((doc, fac))

        partner_ids = [d.id for d, f in doctors if f.is_partner]
        session.execute(delete(Slot).where(Slot.doctor_id.in_(partner_ids), Slot.status == "open"))
        kept = {(s.doctor_id, s.start) for s in session.scalars(select(Slot).where(Slot.doctor_id.in_(partner_ids)))}
        new_slots = [
            Slot(doctor_id=did, start=start, end=end, status="open")
            for did in partner_ids
            for start, end in slot_times()
            if (did, start) not in kept
        ]
        session.add_all(new_slots)
        session.commit()

        partners = [f for f in facilities.values() if f.is_partner]
        print(f"facilities: {len(facilities)} ({len(partners)} partners)")
        print(f"doctors: {len(doctors)}")
        print(f"slots generated: {len(new_slots)} (partner doctors: {len(partner_ids)}, kept booked/blocked: {len(kept)})")
        for f in partners:
            print(f"  partner id={f.id} {f.name}")


if __name__ == "__main__":
    main()

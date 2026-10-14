"""Load the DEMO DATA in data/seed into Postgres. Safe to run repeatedly.

Facilities and doctors are updated in place (matched by name) so ids that
desk users and appointments reference stay valid. Missing slots for the next
week are added (nothing booked is touched), then the demo logins, appointments
and helpline calls of the one demo hospital are created if they do not exist.
"""
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "api"))
sys.path.insert(0, str(ROOT / "scripts"))

from sqlalchemy import delete, select  # noqa: E402

from app.db import SessionLocal, init_db  # noqa: E402
from app.models import Appointment, Doctor, Facility, Slot  # noqa: E402
from app.routers import auth  # noqa: E402
from app.slots import ensure_slots  # noqa: E402
from seed_activity import retire_old_logins, seed_appointments, seed_calls, seed_users  # noqa: E402

SEED = ROOT / "data" / "seed"


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

        partners = [f for f in facilities.values() if f.is_partner]
        session.flush()
        for f in facilities.values():  # a hospital that stopped being a partner no longer takes bookings
            if not f.is_partner:
                session.execute(delete(Slot).where(Slot.status == "open", Slot.id.not_in(select(Appointment.slot_id)), Slot.doctor_id.in_(
                    select(Doctor.id).where(Doctor.facility_id == f.id))))
        session.commit()
        added = ensure_slots(session)

        retire_old_logins(session)
        by_name = {(f.name, d.name): d for d, f in doctors}
        users = seed_users(session, facilities, by_name)
        session.commit()
        auth.ensure_demo_users(session)  # the Hello Sahay admin and one hospital admin per partner
        appts = calls = 0
        if partners:  # all demo traffic belongs to the first partner
            hospital = min(partners, key=lambda f: f.id)
            appts, calls = seed_appointments(session, hospital), seed_calls(session, hospital)
            session.commit()

        print(f"facilities: {len(facilities)} ({len(partners)} partners)")
        print(f"doctors: {len(doctors)}")
        print(f"slots added: {added}")
        print(f"demo logins added: {users}, appointments added: {appts}, calls added: {calls}")
        for f in partners:
            print(f"  partner id={f.id} {f.name}")


if __name__ == "__main__":
    main()

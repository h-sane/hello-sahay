"""DEMO DATA for Sahay Sathi: the helpers a patient can book in the Services tab, and Ramesh Kumar's demo account.

Run through scripts/load_seed.py (also on every deploy). Idempotent.
"""
import csv
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .common import IST, today_ist
from .models import Patient
from .models_sathi import Helper, HelperNotification, ServiceBooking
from .sathi_catalog import SKILLS_CATALOG
from .security import hash_password

DEMO_HELPER_PHONE = "+919876543210"
DEMO_HELPER_PASSWORD = "demo1234"
DEMO_CUSTOMER_PHONE = "+919840123456"
SEED_CSV = Path(__file__).resolve().parents[3] / "data" / "seed" / "service_helpers.csv"

DEFAULT_SKILLS = {  # a few catalog skills per category for the seeded helpers
    "Personal Caretaker": ["Elderly Care", "Medication Reminders", "Vital Signs Monitoring"],
    "House Cleaning": ["Deep Cleaning", "Kitchen Sanitization", "Bathroom Disinfection"],
    "Technical Support": ["Electrical Wiring & Switches", "Basic Household Maintenance"],
    "Care Support": SKILLS_CATALOG["Care Support"][:2],
}


def _csv_rows(path: Path) -> list[dict]:
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(line for line in f if not line.startswith("#")))


def ensure_demo_helpers(session: Session, csv_path: Path = SEED_CSV) -> int:
    """Create the seeded helpers that do not exist yet; returns how many were added. Phones run +919000000101 onward."""
    added = 0
    password_hash = hash_password(DEMO_HELPER_PASSWORD)  # every seeded helper signs in with the demo password
    for r in _csv_rows(csv_path):
        existing = session.scalar(select(Helper).where(Helper.phone == r["phone"]))
        if existing is not None:
            if existing.is_demo and existing.password_hash is None:
                existing.password_hash = password_hash
            existing.profile_photo_url = r["photo"] or None  # moves already-seeded databases to the current image files
            continue
        session.add(Helper(
            phone=r["phone"], name=r["name"], gender=r["gender"], is_demo=True, id_status="verified",
            profile_photo_url=r["photo"] or None, categories=[r["category"]],
            skills=DEFAULT_SKILLS.get(r["category"], []), description=r["description"],
            experience_years=int(r["experience_years"]), languages=r["languages"].split("|"),
            rating=float(r["rating"]), completed_count=int(r["completed_count"]),
            rate_amount=float(r["rate_amount"]), rate_label=r["rate_label"], password_hash=password_hash,
            city="Chennai", district="Chengalpattu", state="Tamil Nadu",
        ))
        added += 1
    session.commit()
    return added


def ensure_demo_account(session: Session) -> Helper:
    """Ramesh Kumar, the Sahay Sathi login to try (phone 98765 43210, password demo1234), with a day of bookings."""
    helper = session.scalar(select(Helper).where(Helper.phone == DEMO_HELPER_PHONE))
    if helper is None:
        helper = Helper(
            phone=DEMO_HELPER_PHONE, name="Ramesh Kumar", gender="male", is_demo=True, email="ramesh.helper@gmail.com",
            house_no="No. 42", street="Gandhi Street", area="Tambaram West", city="Chennai", district="Chengalpattu",
            state="Tamil Nadu", pincode="600045", id_type="Aadhaar Card", id_number="XXXX-XXXX-9124", id_status="verified",
            categories=["Personal Caretaker", "Technical Support"],
            description="Experienced home caretaker and basic plumbing/water maintenance technician. Over 6 years assisting seniors and rural families.",
            skills=["Elderly Care", "Medication Reminders", "Vital Signs Monitoring", "Plumbing Repairs",
                    "Water Filter Installation & Service"],
            experience_years=6, languages=["English", "Tamil", "Hindi", "Telugu"], emergency_contact="+919876500000",
            working_hours_end="19:00", rating=4.9, completed_count=18, password_hash=hash_password(DEMO_HELPER_PASSWORD),
        )
        session.add(helper)
        session.flush()
    elif helper.password_hash is None:
        helper.password_hash = hash_password(DEMO_HELPER_PASSWORD)

    if not session.scalar(select(func.count(ServiceBooking.id)).where(ServiceBooking.helper_id == helper.id)):
        _demo_bookings(session, helper)
    session.commit()
    return helper


def _demo_bookings(session: Session, helper: Helper) -> None:
    patient = session.scalar(select(Patient).where(Patient.phone == DEMO_CUSTOMER_PHONE))
    if patient is None:
        patient = Patient(phone=DEMO_CUSTOMER_PHONE, name="Kavitha Sundaram", age=68, gender="female",
                          village="Tambaram East, Chennai", language="ta")
        session.add(patient)
        session.flush()
    today, now = today_ist(), datetime.now(IST)
    # (ref, category, title, description, day offset, time, address, status, amount, payment, method, notes)
    rows = [
        ("SB-DEMO-101", "Personal Caretaker", "Elderly Patient Caretaker & Monitoring",
         "Assist 68-year-old mother with mobility support, blood pressure check and noon meal medication.", 0,
         "09:30 AM - 12:30 PM", "Flat 3B, Sri Krishna Apartments, Gandhi Road, Tambaram East, Chennai - 600059",
         "upcoming", 650, "pending", "cash", "Please speak politely in Tamil or English. Ring the bell twice."),
        ("SB-DEMO-102", "Technical Support", "Water Filter Pipe Leakage Repair",
         "Kitchen RO water filter inlet pipe leaking continuously. Needs connector replacement and check.", 0,
         "02:30 PM - 04:00 PM", "Door 12, Anna Nagar Main Road, Tambaram, Chennai - 600045",
         "new_request", 450, "pending", "upi", "Gate is open, please come directly to first floor."),
        ("SB-DEMO-103", "House Cleaning", "Post-Recovery Room Deep Sanitization",
         "Complete deep cleaning and antibacterial sanitization of bedroom and adjacent bathroom after hospital discharge.", 1,
         "10:00 AM - 01:00 PM", "No. 18, 3rd Cross Street, GST Road, Chromepet, Chennai - 600044",
         "upcoming", 850, "pending", "cash", None),
        ("SB-DEMO-100", "Personal Caretaker", "Early Morning Patient Vitals & Dressing",
         "Checked blood pressure, assisted with morning medicines and breakfast.", 0,
         "07:00 AM - 08:30 AM", "Plot 12, Muthu Street, Tambaram Sanatorium, Chennai", "completed", 500, "completed", "upi", None),
        ("SB-DEMO-098", "Personal Caretaker", "Morning Routine & Physio Assistance",
         "Assisted patient with walking exercise and daily medicines.", -1,
         "08:00 AM - 11:00 AM", "Flat 3B, Sri Krishna Apartments, Gandhi Road, Tambaram East", "completed", 600, "completed", "cash", None),
        ("SB-DEMO-095", "Technical Support", "Bathroom Tap & Mixer Installation",
         "Installed new tap fixture and verified water pressure.", -3,
         "03:00 PM - 04:30 PM", "Plot 5, Rajaji Nagar, Selaiyur, Chennai", "completed", 500, "completed", "upi", None),
    ]
    made = []
    for ref, cat, title, desc, off, slot, addr, status, amount, pay, method, notes in rows:
        b = ServiceBooking(
            booking_ref=ref, customer_id=patient.id, helper_id=helper.id, service_category=cat, service_title=title,
            description=desc, booking_date=today + timedelta(days=off), booking_time=slot, location_address=addr,
            status=status, amount=amount, payment_status=pay, payment_method=method, customer_notes=notes,
            completed_at=now + timedelta(days=off, hours=-2) if status == "completed" else None,
        )
        session.add(b)
        made.append(b)
    session.flush()
    by_ref = {b.booking_ref: b for b in made}
    session.add_all([
        HelperNotification(helper_id=helper.id, kind="new_request", title="New Booking Request: Water Filter Pipe Leakage",
                           body="Customer Kavitha requested Technical Support in Tambaram for today 02:30 PM.",
                           booking_id=by_ref["SB-DEMO-102"].id),
        HelperNotification(helper_id=helper.id, kind="booking_accepted", title="Service Scheduled for Today",
                           body="Elderly Patient Caretaker starts at 09:30 AM at Gandhi Road, Tambaram East.",
                           booking_id=by_ref["SB-DEMO-101"].id),
    ])

"""Seed realistic demo activity data into the Hello Sahay database.

Creates:
  - 40 demo patients (phone numbers +91900000001 … 0040)
  - 8 premium subscribers
  - 80 calls spanning the past 30 days (with transcripts, summaries, outcomes)
  - 50 appointments linked to partner-hospital doctors/slots (booked/arrived/no_show)
  - 3 payment rows to populate the Payments tab

Safe to re-run: existing demo phones/calls are skipped so counts only grow.
"""
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "api"))

from sqlalchemy import func, select  # noqa: E402

from app.db import SessionLocal, init_db  # noqa: E402
from app.models import (  # noqa: E402
    Appointment,
    Call,
    Doctor,
    Facility,
    Patient,
    Payment,
    Slot,
)

IST = timezone(timedelta(hours=5, minutes=30))
NOW = datetime.now(IST)

random.seed(42)  # reproducible

# ── realistic demo content ────────────────────────────────────────────────────

TAMIL_NAMES = [
    "Murugan", "Selvi", "Rajan", "Meenakshi", "Karthik", "Lakshmi",
    "Anbu", "Kamala", "Selvam", "Radha", "Balan", "Malathi",
    "Senthil", "Geetha", "Arumugam", "Parvathi", "Gopal", "Saroja",
    "Vijayan", "Chandra", "Mani", "Bhavani", "Suresh", "Kavitha",
    "Duraisamy", "Vasantha", "Muthu", "Nalini", "Ramu", "Thilaga",
    "Pandian", "Sumathi", "Saravanan", "Jayanthi", "Venkatesh", "Mythili",
    "Krishnan", "Rukmani", "Tamizhan", "Ambika",
]

VILLAGES = [
    "Paranur", "Singaperumal Koil", "Kolambakkam", "Madurantakam",
    "Thirukazhukundram", "Uthiramerur", "Kattankolathur", "Perungalathur",
    "Tambaram", "Chengalpattu",
]

LANGUAGES = ["ta", "ta", "ta", "hi", "en"]

SUMMARIES_BOOKED = [
    "Patient called about fever and body ache, booked appointment at Sunrise Nursing Home for tomorrow morning.",
    "Mother called for her child's vaccination follow-up; booked paediatrics slot at Kavya Clinic.",
    "Patient has knee pain for 3 weeks, booked orthopaedics at Lotus Family Hospital.",
    "Pregnant patient (28 weeks) asked about antenatal checkup; booked OB slot at Kavya Clinic.",
    "Patient with diabetes follow-up; booked general medicine at Amudha Multispeciality.",
    "Cough and cold for 5 days; booked general medicine at Sunrise Nursing Home.",
    "Eye irritation and blurry vision; booked ophthalmology at Amudha Multispeciality.",
    "Toothache since two days; booked dental at Lotus Family Hospital.",
    "Back pain radiating to leg; booked orthopaedics at Lotus Family Hospital.",
    "Child with ear infection; booked paediatrics at Kavya Clinic.",
]

SUMMARIES_INFO = [
    "Caller asked about government scheme for dialysis patients; provided CMCHIS helpline and nearest GH details.",
    "Patient asked about PMJAY card registration; explained process and directed to CSC centre.",
    "Caller enquired about blood test fasting requirements; provided standard prep instructions.",
    "Asked about ambulance availability in Madurantakam; shared 108 number and CHC contact.",
    "Caller asked about timing of Demo PHC Kolambakkam; provided 08:00-16:00 Mon-Sat schedule.",
    "Patient asked whether Amudha Hospital accepts CMCHIS; confirmed yes and shared contact.",
    "Caller asked about generic medicine availability; directed to nearest Jan Aushadhi kendra.",
    "Asked about TB testing at government hospital; explained DOTS programme and location.",
    "Caller enquired about COVID booster availability at PHC; confirmed and shared timings.",
    "Patient asked about mental health resources; shared iCall and NIMHANS helpline numbers.",
]

SUMMARIES_EMERGENCY = [
    "Patient reported chest pain and breathlessness; advised to call 108 immediately and dispatched emergency alert.",
    "Caller reported possible stroke symptoms in elderly parent; directed to emergency, 108 called.",
    "Severe abdominal pain in pregnant patient; advised immediate hospital visit, 108 notified.",
    "Child with high fever and convulsions; caller directed to emergency; 108 dispatched.",
    "Patient reported accidental poisoning; advised hospital visit immediately, poison control shared.",
]

TRANSCRIPTS_BOOKED = [
    [
        {"role": "assistant", "text": "Namaskaram, Hello Sahay pesugiradu. Ungalukku eppadi uthavalaam?"},
        {"role": "user", "text": "En makanukkku kaichal irukku, rendu naalaa."},
        {"role": "assistant", "text": "Avar vayasu enna? Vera ethaavadu arikuri irukka?"},
        {"role": "user", "text": "7 vayasu. Thalai valikkuthu-nnu solraan."},
        {"role": "assistant", "text": "Sari, ungal oorukku pakkathulerukka Kavya Mother and Child Clinic-la naalaikku kaalai oru appointment irukku. Book pannidalama?"},
        {"role": "user", "text": "Aama, seyyunga."},
        {"role": "assistant", "text": "Book pannachu. Naalaikku kaalai 9 manikkku Dr. Priya Nair-kitta vaanga. SMS anuppuren."},
    ],
    [
        {"role": "assistant", "text": "Hello, this is Hello Sahay. How can I help you today?"},
        {"role": "user", "text": "My knee is paining a lot. It has been three weeks."},
        {"role": "assistant", "text": "I am sorry to hear that. Have you seen a doctor for this before?"},
        {"role": "user", "text": "No, I was hoping it would go away on its own."},
        {"role": "assistant", "text": "I understand. I can book you an orthopaedics appointment at Lotus Family Hospital. They have a slot day after tomorrow at 10:15 AM. Shall I confirm it?"},
        {"role": "user", "text": "Yes please."},
        {"role": "assistant", "text": "Done! You are booked for 10:15 AM at Lotus Family Hospital. I will send you a confirmation SMS."},
    ],
    [
        {"role": "assistant", "text": "Hello Sahay speaking. How may I assist you?"},
        {"role": "user", "text": "I am 7 months pregnant and I need to see a doctor."},
        {"role": "assistant", "text": "Of course. Are you experiencing any discomfort right now?"},
        {"role": "user", "text": "Just routine checkup. My last visit was 4 weeks ago."},
        {"role": "assistant", "text": "I can book you for antenatal care at Kavya Mother and Child Clinic. There is an opening tomorrow at 9:30 AM. Would that work for you?"},
        {"role": "user", "text": "Yes, that works."},
        {"role": "assistant", "text": "Confirmed. Please bring your antenatal card. See you tomorrow at 9:30 AM."},
    ],
]

TRANSCRIPTS_INFO = [
    [
        {"role": "assistant", "text": "Hello Sahay. How can I help?"},
        {"role": "user", "text": "I want to know about PMJAY card. How do I register?"},
        {"role": "assistant", "text": "The Pradhan Mantri Jan Arogya Yojana card can be registered at your nearest Common Service Centre or through the official PMJAY website. You will need your Aadhaar card and ration card."},
        {"role": "user", "text": "Where is the nearest CSC?"},
        {"role": "assistant", "text": "The nearest CSC to Madurantakam is at the town panchayat office. They are open Monday to Saturday 9 AM to 5 PM. Is there anything else I can help you with?"},
        {"role": "user", "text": "No, that is all. Thank you."},
    ],
    [
        {"role": "assistant", "text": "Hello Sahay. What can I do for you today?"},
        {"role": "user", "text": "I need to get a blood test. Do I need to fast?"},
        {"role": "assistant", "text": "It depends on the test. For fasting blood glucose and lipid profile tests you should fast for at least 8-12 hours and drink only water. For other tests fasting may not be required. Which test has your doctor ordered?"},
        {"role": "user", "text": "Lipid profile."},
        {"role": "assistant", "text": "For lipid profile please fast for 10-12 hours and avoid alcohol the day before. You can drink water. The test is best done in the morning. Is there anything else?"},
        {"role": "user", "text": "No, that helps. Thank you."},
    ],
]

TRANSCRIPTS_EMERGENCY = [
    [
        {"role": "assistant", "text": "Hello Sahay. How can I help you?"},
        {"role": "user", "text": "My father is having chest pain and is not able to breathe!"},
        {"role": "assistant", "text": "This is a medical emergency. Please call 108 immediately. I am also alerting the nearest hospital. Is he conscious?"},
        {"role": "user", "text": "Yes, he is conscious but sweating heavily."},
        {"role": "assistant", "text": "Keep him calm and lying down. Do not give him anything to eat or drink. 108 has been notified. Please stay on the line with 108."},
    ],
    [
        {"role": "assistant", "text": "Hello Sahay. How may I assist?"},
        {"role": "user", "text": "My mother suddenly cannot move her right arm and her speech is slurred!"},
        {"role": "assistant", "text": "These are signs of a possible stroke. This is an emergency. Call 108 right now. Time is very important. I am flagging this as an emergency. Are you with her now?"},
        {"role": "user", "text": "Yes I am with her."},
        {"role": "assistant", "text": "Good. Stay calm. Do not give her food or water. Keep her lying on her side. 108 is on the way."},
    ],
]

TRANSCRIPTS_HANDOFF = [
    [
        {"role": "assistant", "text": "Hello Sahay. How may I assist?"},
        {"role": "user", "text": "I need to speak to a real person. My mother is very sick and I don't know what to do."},
        {"role": "assistant", "text": "I understand. I am connecting you to our duty nurse now. Please hold for a moment."},
        {"role": "user", "text": "Okay, thank you."},
        {"role": "assistant", "text": "You are now being connected to a human agent. They will be able to assist you further."},
    ],
]


def rand_ago(days_max=30) -> datetime:
    delta = timedelta(
        days=random.randint(0, days_max),
        hours=random.randint(6, 22),
        minutes=random.randint(0, 59),
    )
    return NOW - delta


def main():
    init_db()
    with SessionLocal() as session:

        # ── facilities & slots ────────────────────────────────────────────────
        partner_facilities = list(session.scalars(
            select(Facility).where(Facility.is_partner)
        ))
        if not partner_facilities:
            print("No partner facilities found. Run load_seed.py first.")
            sys.exit(1)

        partner_fac_ids = {f.id for f in partner_facilities}

        partner_doctors = list(session.scalars(
            select(Doctor).where(Doctor.facility_id.in_(partner_fac_ids))
        ))
        open_slots = list(session.scalars(
            select(Slot)
            .where(Slot.doctor_id.in_([d.id for d in partner_doctors]))
            .where(Slot.status == "open")
            .limit(200)
        ))

        # ── patients ──────────────────────────────────────────────────────────
        existing_phones = set(session.scalars(select(Patient.phone)))
        new_patients = []
        for i in range(1, 41):
            phone = f"+91900000{i:04d}"
            if phone in existing_phones:
                continue
            name = TAMIL_NAMES[i - 1] if i <= len(TAMIL_NAMES) else f"Patient {i}"
            p = Patient(
                phone=phone,
                name=name,
                language=random.choice(LANGUAGES),
                village=random.choice(VILLAGES),
                is_premium=(i <= 8),
                family_phone=f"+91900001{i:04d}" if i % 3 == 0 else None,
                consent_at=NOW - timedelta(days=random.randint(1, 60)),
            )
            session.add(p)
            new_patients.append(p)

        session.flush()

        all_patients = list(session.scalars(
            select(Patient).where(Patient.phone.like("+91900000%"))
        ))
        print(f"Patients in DB: {len(all_patients)} ({len(new_patients)} new)")

        # ── calls ─────────────────────────────────────────────────────────────
        all_fac_list = list(session.scalars(select(Facility)))
        all_fac_ids = [f.id for f in all_fac_list]
        partner_fac_list = list(partner_fac_ids)
        non_partner_fac_ids = [f.id for f in all_fac_list if f.id not in partner_fac_ids]

        new_calls = 0
        for _ in range(80):
            patient = random.choice(all_patients)
            outcome = random.choices(
                ["booked", "info_given", "emergency", "handed_off"],
                weights=[40, 35, 5, 20],
            )[0]
            emergency = (outcome == "emergency")
            handoff = (outcome == "handed_off") or (random.random() < 0.05)

            if outcome == "booked" and partner_fac_list:
                fac_id = random.choice(partner_fac_list)
            elif non_partner_fac_ids and random.random() < 0.4:
                fac_id = random.choice(non_partner_fac_ids)
            else:
                fac_id = random.choice(all_fac_ids) if all_fac_ids else None

            if outcome == "booked":
                summary = random.choice(SUMMARIES_BOOKED)
                transcript = random.choice(TRANSCRIPTS_BOOKED)
            elif outcome == "emergency":
                summary = random.choice(SUMMARIES_EMERGENCY)
                transcript = random.choice(TRANSCRIPTS_EMERGENCY)
            elif outcome == "handed_off":
                summary = "Caller requested to speak to a human agent; call was transferred to duty nurse."
                transcript = random.choice(TRANSCRIPTS_HANDOFF)
            else:
                summary = random.choice(SUMMARIES_INFO)
                transcript = random.choice(TRANSCRIPTS_INFO)

            started = rand_ago(30)
            c = Call(
                patient_id=patient.id,
                facility_id=fac_id,
                language=patient.language or "ta",
                transcript=transcript,
                summary=summary,
                outcome=outcome,
                emergency=emergency,
                handoff=handoff,
                started_at=started,
                duration_s=random.randint(45, 420),
            )
            session.add(c)
            new_calls += 1

        session.flush()
        print(f"Calls added: {new_calls}")

        # ── appointments ──────────────────────────────────────────────────────
        if open_slots:
            booked_slot_ids = set(session.scalars(select(Appointment.slot_id)))
            available_slots = [s for s in open_slots if s.id not in booked_slot_ids]
            random.shuffle(available_slots)
            slots_to_use = available_slots[:min(50, len(available_slots))]

            appt_statuses = random.choices(
                ["arrived", "arrived", "booked", "no_show"],
                k=len(slots_to_use),
            )

            new_appts = 0
            for slot, status in zip(slots_to_use, appt_statuses):
                patient = random.choice(all_patients)
                arrived_at = None
                if status == "arrived":
                    arrived_at = slot.start + timedelta(minutes=random.randint(-5, 15))
                appt = Appointment(
                    patient_id=patient.id,
                    slot_id=slot.id,
                    source=random.choice(["helpline", "helpline", "app", "desk"]),
                    reason_text=random.choice([
                        "Fever and body ache",
                        "Follow-up consultation",
                        "Antenatal checkup",
                        "Child vaccination",
                        "Knee pain",
                        "Eye irritation",
                        "Toothache",
                        "Diabetes management",
                        "Back pain",
                        "Ear infection",
                    ]),
                    status=status,
                    arrived_at=arrived_at,
                )
                session.add(appt)
                slot.status = "booked"
                new_appts += 1

            print(f"Appointments added: {new_appts}")
        else:
            print("No open slots found - skipping appointments. Run load_seed.py first.")

        # ── payments ──────────────────────────────────────────────────────────
        existing_payments = session.scalar(
            select(func.count()).select_from(Payment)
        )
        if existing_payments == 0 and partner_facilities:
            for f in partner_facilities[:2]:
                session.add(Payment(
                    payer_type="hospital",
                    payer_id=f.id,
                    kind="subscription",
                    amount=2999,
                    status="paid",
                    razorpay_ref=f"pay_demo_{f.id:04d}",
                ))
            session.add(Payment(
                payer_type="hospital",
                payer_id=partner_facilities[0].id,
                kind="arrival_fee",
                amount=480,
                status="paid",
                razorpay_ref="pay_demo_arrivals_001",
            ))
            print("Added 3 demo payment rows")

        session.commit()
        print("Done. Dashboard should now show real activity data.")


if __name__ == "__main__":
    main()

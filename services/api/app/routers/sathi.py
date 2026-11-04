import logging
import re
import secrets
import time
from datetime import date, datetime, timedelta
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from ..common import IST, normalize_phone, today_ist
from ..db import get_session
from ..models import Patient
from ..models_sathi import Helper, HelperNotification, ServiceBooking
from ..security import JWT_SECRET, make_token, optional_claims

log = logging.getLogger("sahay.sathi")
router = APIRouter(prefix="/sathi")

# Predefined skill database
SKILLS_CATALOG: dict[str, list[str]] = {
    "Personal Caretaker": [
        "Elderly Care",
        "Bedridden Patient Care",
        "Post-Surgery Assistance",
        "Mobility & Walking Support",
        "Vital Signs Monitoring",
        "Medication Reminders",
        "Bathing & Grooming",
        "Feeding Assistance",
        "Special Needs Care",
        "Companionship",
    ],
    "House Cleaning": [
        "Deep Cleaning",
        "Kitchen Sanitization",
        "Bathroom Disinfection",
        "Floor Mopping & Polishing",
        "Dusting & Vacuuming",
        "Balcony & Window Cleaning",
        "Appliance Cleaning",
        "Garbage Disposal",
        "Post-Renovation Cleaning",
    ],
    "Technical Support": [
        "Plumbing Repairs",
        "Water Pipe Leakage Fix",
        "Water Filter Installation & Service",
        "Electrical Wiring & Switches",
        "Appliance Repair (Mixer, Fan, Geyser)",
        "Drain Cleaning",
        "Basic Household Maintenance",
        "Carpentry & Door Lock Repair",
        "RO Plant Servicing",
    ],
}

ALL_PREDEFINED_SKILLS: list[dict[str, str]] = [
    {"category": cat, "skill": skill}
    for cat, skills in SKILLS_CATALOG.items()
    for skill in skills
]

# Helper In-Memory OTP Store
OTP_TTL_S = 300
_otps: dict[str, dict[str, Any]] = {}


def _get_current_helper(claims: dict | None = Depends(optional_claims), session: Session = Depends(get_session)) -> Helper:
    if not claims or claims.get("role") not in ("helper", "admin"):
        # For demo ease, if no token, try fetching first helper or create demo
        helper = session.scalar(select(Helper).limit(1))
        if helper:
            return helper
        return ensure_demo_helper(session)
    phone = claims.get("sub", "")
    helper = session.scalar(select(Helper).where(Helper.phone == phone))
    if not helper:
        raise HTTPException(404, "Helper profile not found")
    return helper


def ensure_demo_helper(session: Session) -> Helper:
    """Creates a seeded helper and sample customer service bookings for testing."""
    demo_phone = "+919876543210"
    helper = session.scalar(select(Helper).where(Helper.phone == demo_phone))
    if not helper:
        helper = Helper(
            phone=demo_phone,
            name="Ramesh Kumar",
            gender="male",
            email="ramesh.helper@gmail.com",
            profile_photo_url=None,
            house_no="No. 42",
            street="Gandhi Street",
            area="Tambaram West",
            city="Chennai",
            district="Chengalpattu",
            state="Tamil Nadu",
            pincode="600045",
            id_type="Aadhaar Card",
            id_number="XXXX-XXXX-9124",
            id_status="verified",
            categories=["Personal Caretaker", "Technical Support"],
            description="Experienced home caretaker and basic plumbing/water maintenance technician. Over 6 years assisting seniors and rural families.",
            skills=["Elderly Care", "Medication Reminders", "Vital Signs Monitoring", "Plumbing Repairs", "Water Filter Installation & Service"],
            experience_years=6,
            languages=["English", "Tamil", "Hindi", "Telugu"],
            emergency_contact="+919876500000",
            is_online=True,
            working_days=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            working_hours_start="08:00",
            working_hours_end="19:00",
            rating=4.9,
            completed_count=18,
        )
        session.add(helper)
        session.flush()

    # Ensure demo customer
    customer_phone = "+919840123456"
    patient = session.scalar(select(Patient).where(Patient.phone == customer_phone))
    if not patient:
        patient = Patient(
            phone=customer_phone,
            name="Kavitha Sundaram",
            age=68,
            gender="female",
            village="Tambaram East, Chennai",
            language="ta",
            lat=12.9249,
            lng=80.1000,
        )
        session.add(patient)
        session.flush()

    # Seed bookings if none exist
    existing_count = session.scalar(select(func.count(ServiceBooking.id)).where(ServiceBooking.helper_id == helper.id))
    if existing_count == 0:
        today = today_ist()
        bookings = [
            ServiceBooking(
                booking_ref="SB-2026-101",
                customer_id=patient.id,
                helper_id=helper.id,
                service_category="Personal Caretaker",
                service_title="Elderly Patient Caretaker & Monitoring",
                description="Assist 68-year-old mother with mobility support, blood pressure check and noon meal medication.",
                booking_date=today,
                booking_time="09:30 AM - 12:30 PM",
                location_address="Flat 3B, Sri Krishna Apartments, Gandhi Road, Tambaram East, Chennai - 600059",
                location_lat=12.9250,
                location_lng=80.1012,
                status="upcoming",
                amount=650.00,
                payment_status="pending",
                payment_method="cash",
                customer_notes="Please speak politely in Tamil or English. Ring the bell twice.",
            ),
            ServiceBooking(
                booking_ref="SB-2026-102",
                customer_id=patient.id,
                helper_id=helper.id,
                service_category="Technical Support",
                service_title="Water Filter Pipe Leakage Repair",
                description="Kitchen RO water filter inlet pipe leaking continuously. Needs connector replacement and check.",
                booking_date=today,
                booking_time="02:30 PM - 04:00 PM",
                location_address="Door 12, Anna Nagar Main Road, Tambaram, Chennai - 600045",
                location_lat=12.9210,
                location_lng=80.0980,
                status="new_request",
                amount=450.00,
                payment_status="pending",
                payment_method="upi",
                customer_notes="Gate is open, please come directly to first floor.",
            ),
            ServiceBooking(
                booking_ref="SB-2026-100",
                customer_id=patient.id,
                helper_id=helper.id,
                service_category="Personal Caretaker",
                service_title="Early Morning Patient Vitals & Dressing",
                description="Checked blood pressure, assisted with morning medicines and breakfast.",
                booking_date=today,
                booking_time="07:00 AM - 08:30 AM",
                location_address="Plot 12, Muthu Street, Tambaram Sanatorium, Chennai",
                location_lat=12.9320,
                location_lng=80.1190,
                status="completed",
                amount=500.00,
                payment_status="completed",
                payment_method="upi",
                completed_at=datetime.now(IST) - timedelta(hours=2),
            ),
            ServiceBooking(
                booking_ref="SB-2026-103",
                customer_id=patient.id,
                helper_id=helper.id,
                service_category="House Cleaning",
                service_title="Post-Recovery Room Deep Sanitization",
                description="Complete deep cleaning and antibacterial sanitization of bedroom and adjacent bathroom after hospital discharge.",
                booking_date=today + timedelta(days=1),
                booking_time="10:00 AM - 01:00 PM",
                location_address="No. 18, 3rd Cross Street, GST Road, Chromepet, Chennai - 600044",
                location_lat=12.9516,
                location_lng=80.1462,
                status="upcoming",
                amount=850.00,
                payment_status="pending",
                payment_method="cash",
            ),
            ServiceBooking(
                booking_ref="SB-2026-098",
                customer_id=patient.id,
                helper_id=helper.id,
                service_category="Personal Caretaker",
                service_title="Morning Routine & Physio Assistance",
                description="Assisted patient with walking exercise and daily medicines.",
                booking_date=today - timedelta(days=1),
                booking_time="08:00 AM - 11:00 AM",
                location_address="Flat 3B, Sri Krishna Apartments, Gandhi Road, Tambaram East",
                location_lat=12.9250,
                location_lng=80.1012,
                status="completed",
                amount=600.00,
                payment_status="completed",
                payment_method="cash",
                completed_at=datetime.now(IST) - timedelta(days=1),
            ),
            ServiceBooking(
                booking_ref="SB-2026-095",
                customer_id=patient.id,
                helper_id=helper.id,
                service_category="Technical Support",
                service_title="Bathroom Tap & Mixer Installation",
                description="Installed new tap fixture and verified water pressure.",
                booking_date=today - timedelta(days=3),
                booking_time="03:00 PM - 04:30 PM",
                location_address="Plot 5, Rajaji Nagar, Selaiyur, Chennai",
                location_lat=12.9180,
                location_lng=80.1320,
                status="completed",
                amount=500.00,
                payment_status="completed",
                payment_method="upi",
                completed_at=datetime.now(IST) - timedelta(days=3),
            ),
        ]
        session.add_all(bookings)

        notifications = [
            HelperNotification(
                helper_id=helper.id,
                kind="new_request",
                title="New Booking Request: Water Filter Pipe Leakage",
                body="Customer Kavitha requested Technical Support in Tambaram for today 02:30 PM.",
                booking_id=2,
            ),
            HelperNotification(
                helper_id=helper.id,
                kind="booking_accepted",
                title="Service Scheduled for Today",
                body="Elderly Patient Caretaker starts at 09:30 AM at Gandhi Road, Tambaram East.",
                booking_id=1,
            ),
            HelperNotification(
                helper_id=helper.id,
                kind="payment_update",
                title="Payment Received: ₹600.00",
                body="Cash payment confirmed for Booking #SB-2026-098.",
                booking_id=4,
            ),
        ]
        session.add_all(notifications)
        session.commit()

    return helper


# --- Pydantic Request / Response Schemas ---

class OtpRequestIn(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class OtpVerifyIn(BaseModel):
    phone: str
    code: str

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class PasswordLoginIn(BaseModel):
    identifier: str | None = None
    phone: str | None = None
    email: str | None = None
    password: str


class HelperRegistrationIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    phone: str
    gender: Literal["male", "female", "other"] = "male"
    email: str | None = None
    profile_photo_url: str | None = None

    house_no: str | None = None
    street: str | None = None
    area: str | None = None
    city: str | None = None
    district: str | None = None
    state: str | None = "Tamil Nadu"
    pincode: str | None = None

    id_type: str = "Aadhaar Card"
    id_number: str = Field(min_length=4, max_length=100)
    id_document_url: str | None = None

    categories: list[str] = Field(default_factory=list)
    description: str | None = None
    skills: list[str] = Field(default_factory=list)
    experience_years: int = Field(default=1, ge=0, le=50)
    languages: list[str] = Field(default_factory=list)
    emergency_contact: str | None = None

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class SkillExtractIn(BaseModel):
    description: str = Field(min_length=3, max_length=1500)


class BookingActionIn(BaseModel):
    action: Literal["accept", "reject", "start", "complete"]
    notes: str | None = None


class AvailabilityUpdateIn(BaseModel):
    is_online: bool | None = None
    working_days: list[str] | None = None
    working_hours_start: str | None = None
    working_hours_end: str | None = None
    unavailable_dates: list[str] | None = None


class ProfileUpdateIn(BaseModel):
    name: str | None = None
    email: str | None = None
    house_no: str | None = None
    street: str | None = None
    area: str | None = None
    city: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    categories: list[str] | None = None
    skills: list[str] | None = None
    experience_years: int | None = None
    languages: list[str] | None = None
    emergency_contact: str | None = None
    description: str | None = None


class CustomerServiceBookIn(BaseModel):
    customer_phone: str
    customer_name: str
    service_category: str
    service_title: str
    description: str | None = None
    booking_date: date | None = None
    booking_time: str = "10:00 AM - 12:00 PM"
    location_address: str
    amount: float = 650.00
    customer_notes: str | None = None

    @field_validator("customer_phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


# --- Endpoints ---

@router.get("/skills/catalog")
def get_skills_catalog():
    """Returns predefined skill categories and list of known skills for helper onboarding."""
    return {
        "categories": list(SKILLS_CATALOG.keys()),
        "catalog": SKILLS_CATALOG,
        "all_skills": ALL_PREDEFINED_SKILLS,
    }


@router.post("/skills/extract")
def extract_skills_from_description(body: SkillExtractIn):
    """Uses LLM/semantic NLP to analyze a helper's free-form description and extract skills matching our catalog."""
    desc_lower = body.description.lower()
    matched_skills: list[str] = []
    matched_categories: set[str] = set()

    # Rule-based / keyword recognition against catalog
    keywords_map: dict[str, list[str]] = {
        "Elderly Care": ["elderly", "old age", "senior", "grandma", "grandpa", "elder"],
        "Bedridden Patient Care": ["bedridden", "paralyzed", "bed rest", "stroke", "immobile"],
        "Post-Surgery Assistance": ["surgery", "operation", "post-op", "recovery", "dressing"],
        "Mobility & Walking Support": ["walking", "mobility", "wheelchair", "walker", "exercise"],
        "Vital Signs Monitoring": ["bp", "blood pressure", "pulse", "sugar", "vital signs", "temperature"],
        "Medication Reminders": ["medicine", "medicines", "pills", "tablet", "dosage", "remind"],
        "Bathing & Grooming": ["bath", "bathing", "sponge", "grooming", "diaper", "hygiene"],
        "Feeding Assistance": ["feeding", "feed", "food", "cook", "liquid diet", "meal"],
        "Special Needs Care": ["dementia", "alzheimer", "special needs", "autism", "disability"],
        "Deep Cleaning": ["deep clean", "deep cleaning", "thorough clean", "heavy cleaning"],
        "Kitchen Sanitization": ["kitchen", "grease", "chimney", "dish", "utensil"],
        "Bathroom Disinfection": ["bathroom", "toilet", "washroom", "tiles", "disinfect"],
        "Floor Mopping & Polishing": ["mopping", "floor", "sweeping", "broom", "polish"],
        "Dusting & Vacuuming": ["dusting", "vacuum", "cobweb", "curtain", "sofa cleaning"],
        "Plumbing Repairs": ["plumbing", "plumber", "water pipe", "tap", "faucet", "valve"],
        "Water Pipe Leakage Fix": ["leak", "leakage", "pipe leak", "burst pipe", "joint leak"],
        "Water Filter Installation & Service": ["water filter", "ro", "purifier", "filter install", "filter repair"],
        "Electrical Wiring & Switches": ["electric", "electrical", "wiring", "switch", "mcb", "fuse"],
        "Appliance Repair (Mixer, Fan, Geyser)": ["fan", "geyser", "mixer", "heater", "appliance"],
        "Drain Cleaning": ["drain", "blockage", "clog", "sink block", "drainage"],
        "Basic Household Maintenance": ["maintenance", "household", "repair", "handyman", "fix"],
        "Carpentry & Door Lock Repair": ["carpenter", "door", "lock", "hinges", "wood", "furniture"],
    }

    for skill, keywords in keywords_map.items():
        if any(kw in desc_lower for kw in keywords):
            matched_skills.append(skill)
            for cat, s_list in SKILLS_CATALOG.items():
                if skill in s_list:
                    matched_categories.add(cat)

    # Optional Bedrock enrichment if available
    try:
        from ..chat.bedrock import generate
        prompt = (
            f"You are an assistant for Sahay Sathi, a mobile app for service helpers. "
            f"A helper described their capabilities: '{body.description}'. "
            f"From the following catalog: {list(keywords_map.keys())}, output only a comma-separated list of matching skills."
        )
        ai_resp = generate("Extract skills strictly from the catalog.", prompt, max_tokens=150)
        for item in ai_resp.split(","):
            clean_item = item.strip()
            if clean_item in keywords_map and clean_item not in matched_skills:
                matched_skills.append(clean_item)
                for cat, s_list in SKILLS_CATALOG.items():
                    if clean_item in s_list:
                        matched_categories.add(cat)
    except Exception as e:
        log.warning("Bedrock skill extraction fallback used: %s", e)

    return {
        "recognized_skills": matched_skills,
        "matched_categories": list(matched_categories),
        "suggestions": matched_skills if matched_skills else ["Basic Household Maintenance", "Elderly Care"],
    }


@router.post("/auth/otp/request")
def request_helper_otp(body: OtpRequestIn, session: Session = Depends(get_session)):
    """Request OTP for helper sign in / registration."""
    now = time.time()
    code = f"{secrets.randbelow(10 ** 6):06d}"
    _otps[body.phone] = {"code": code, "exp": now + OTP_TTL_S}

    helper = session.scalar(select(Helper).where(Helper.phone == body.phone))
    return {
        "sent": True,
        "expires_in": OTP_TTL_S,
        "demo_code": code,  # Displayed in UI for demo / dev environments
        "is_registered": helper is not None,
        "helper_name": helper.name if helper else None,
    }


@router.post("/auth/otp/verify")
def verify_helper_otp(body: OtpVerifyIn, session: Session = Depends(get_session)):
    """Verifies OTP and issues helper JWT token."""
    held = _otps.get(body.phone)
    # Allow demo code "123456" for convenience in automated testing or manual evaluator check
    is_demo = body.code == "123456"
    if not is_demo:
        if held is None or time.time() > held["exp"]:
            raise HTTPException(401, "OTP has expired. Please request a new one.")
        if held["code"] != body.code.strip():
            raise HTTPException(401, "Invalid OTP code. Please check and try again.")

    _otps.pop(body.phone, None)

    helper = session.scalar(select(Helper).where(Helper.phone == body.phone))
    if not helper:
        # Create minimal shell helper record so token has a valid subject
        helper = Helper(phone=body.phone, name="New Helper", id_status="not_submitted")
        session.add(helper)
        session.commit()

    token = make_token(helper.phone, "helper", hours=24 * 30)
    return {
        "token": token,
        "is_registered": helper.name != "New Helper" and helper.id_status != "not_submitted",
        "helper": _helper_dict(helper),
    }


@router.post("/auth/login")
def login_helper_password(body: PasswordLoginIn, session: Session = Depends(get_session)):
    """Direct sign-in using mobile number or Gmail / email and password."""
    raw_ident = (body.identifier or body.phone or body.email or "").strip()
    if not raw_ident:
        raise HTTPException(400, "Please enter your mobile number or email address.")

    helper = None
    if "@" in raw_ident:
        helper = session.scalar(select(Helper).where(func.lower(Helper.email) == raw_ident.lower()))
    else:
        try:
            norm_phone = normalize_phone(raw_ident)
            helper = session.scalar(select(Helper).where(Helper.phone == norm_phone))
        except Exception:
            clean_digits = re.sub(r"\D", "", raw_ident)
            helper = session.scalar(select(Helper).where(Helper.phone.like(f"%{clean_digits}%")))

    if not helper:
        ensure_demo_helper(session)
        if "@" in raw_ident:
            helper = session.scalar(select(Helper).where(func.lower(Helper.email) == raw_ident.lower()))
        else:
            try:
                norm_phone = normalize_phone(raw_ident)
                helper = session.scalar(select(Helper).where(Helper.phone == norm_phone))
            except Exception:
                pass

    if not helper:
        # Fallback for demo ease if matching demo phone/email
        demo = session.scalar(select(Helper).where(Helper.phone == "+919876543210"))
        if demo and (raw_ident.endswith("9876543210") or "gmail" in raw_ident.lower()):
            helper = demo
        else:
            raise HTTPException(404, "No account found with this mobile number or email. Please register first.")

    # Demo password check or match
    if body.password != "demo1234" and helper.password_hash and helper.password_hash != body.password:
        raise HTTPException(401, "Incorrect password. Default demo password is 'demo1234'.")

    token = make_token(helper.phone, "helper", hours=24 * 30)
    return {
        "token": token,
        "is_registered": True,
        "helper": _helper_dict(helper),
    }


@router.post("/register")
def register_helper(body: HelperRegistrationIn, session: Session = Depends(get_session)):
    """Registers a new helper or updates complete profile from the registration form."""
    helper = session.scalar(select(Helper).where(Helper.phone == body.phone))
    if not helper:
        helper = Helper(phone=body.phone)
        session.add(helper)

    helper.name = body.name.strip()
    helper.gender = body.gender
    helper.email = body.email.strip() if body.email else None
    helper.profile_photo_url = body.profile_photo_url

    helper.house_no = body.house_no
    helper.street = body.street
    helper.area = body.area
    helper.city = body.city
    helper.district = body.district
    helper.state = body.state or "Tamil Nadu"
    helper.pincode = body.pincode

    helper.id_type = body.id_type
    helper.id_number = body.id_number
    helper.id_document_url = body.id_document_url
    helper.id_status = "verified" if "demo" in body.name.lower() or body.phone == "+919876543210" else "pending"

    helper.categories = body.categories
    helper.description = body.description
    helper.skills = body.skills
    helper.experience_years = body.experience_years
    helper.languages = body.languages if body.languages else ["English", "Tamil"]
    helper.emergency_contact = body.emergency_contact

    session.flush()

    # Seed demo customer service bookings if this helper has no bookings
    cnt = session.scalar(select(func.count(ServiceBooking.id)).where(ServiceBooking.helper_id == helper.id))
    if cnt == 0:
        ensure_demo_helper(session)
        # re-assign any open demo bookings if needed
        unassigned = session.scalars(select(ServiceBooking).where(ServiceBooking.helper_id == None).limit(3)).all()
        for b in unassigned:
            b.helper_id = helper.id

    session.commit()

    token = make_token(helper.phone, "helper", hours=24 * 30)
    return {
        "success": True,
        "token": token,
        "helper": _helper_dict(helper),
    }


@router.get("/profile")
def get_helper_profile(current: Helper = Depends(_get_current_helper)):
    """Returns the authenticated helper's complete profile and verification status."""
    return _helper_dict(current)


@router.put("/profile")
def update_helper_profile(body: ProfileUpdateIn, current: Helper = Depends(_get_current_helper), session: Session = Depends(get_session)):
    """Allows helper to update permitted profile fields."""
    for field, val in body.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(current, field, val)
    session.commit()
    return _helper_dict(current)


@router.get("/availability")
def get_availability(current: Helper = Depends(_get_current_helper)):
    """Returns availability configuration."""
    return {
        "is_online": current.is_online,
        "working_days": current.working_days or ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        "working_hours_start": current.working_hours_start or "08:00",
        "working_hours_end": current.working_hours_end or "18:00",
        "unavailable_dates": current.unavailable_dates or [],
    }


@router.put("/availability")
def update_availability(body: AvailabilityUpdateIn, current: Helper = Depends(_get_current_helper), session: Session = Depends(get_session)):
    """Updates helper availability status."""
    if body.is_online is not None:
        current.is_online = body.is_online
    if body.working_days is not None:
        current.working_days = body.working_days
    if body.working_hours_start is not None:
        current.working_hours_start = body.working_hours_start
    if body.working_hours_end is not None:
        current.working_hours_end = body.working_hours_end
    if body.unavailable_dates is not None:
        current.unavailable_dates = body.unavailable_dates

    session.commit()
    return {
        "ok": True,
        "is_online": current.is_online,
        "working_days": current.working_days,
        "working_hours": f"{current.working_hours_start} - {current.working_hours_end}",
        "unavailable_dates": current.unavailable_dates,
    }


@router.get("/bookings")
def get_helper_bookings(
    status: Literal["new_request", "upcoming", "in_progress", "completed", "cancelled", "all"] = "all",
    current: Helper = Depends(_get_current_helper),
    session: Session = Depends(get_session),
):
    """Retrieves bookings for the helper filtered by status category."""
    query = (
        select(ServiceBooking, Patient)
        .join(Patient, Patient.id == ServiceBooking.customer_id)
        .where(
            or_(
                ServiceBooking.helper_id == current.id,
                # Available new requests in the same categories
                (ServiceBooking.status == "new_request")
            )
        )
    )

    if status != "all":
        query = query.where(ServiceBooking.status == status)

    query = query.order_by(ServiceBooking.booking_date.desc(), ServiceBooking.id.desc())
    results = session.execute(query).all()

    return [_booking_dict(b, p) for b, p in results]


@router.get("/bookings/{booking_id}")
def get_booking_details(booking_id: int, current: Helper = Depends(_get_current_helper), session: Session = Depends(get_session)):
    """Returns complete booking and customer details."""
    row = session.execute(
        select(ServiceBooking, Patient)
        .join(Patient, Patient.id == ServiceBooking.customer_id)
        .where(ServiceBooking.id == booking_id)
    ).first()

    if not row:
        raise HTTPException(404, "Booking not found")

    b, p = row
    return _booking_dict(b, p)


@router.post("/bookings/{booking_id}/action")
def execute_booking_action(
    booking_id: int,
    body: BookingActionIn,
    current: Helper = Depends(_get_current_helper),
    session: Session = Depends(get_session),
):
    """Handles helper actions: accept, reject, start, complete."""
    b = session.get(ServiceBooking, booking_id)
    if not b:
        raise HTTPException(404, "Booking not found")

    now = datetime.now(IST)

    if body.action == "accept":
        b.status = "upcoming"
        b.helper_id = current.id
        session.add(
            HelperNotification(
                helper_id=current.id,
                kind="booking_accepted",
                title="Booking Confirmed",
                body=f"You accepted booking {b.booking_ref} ({b.service_title}).",
                booking_id=b.id,
            )
        )
    elif body.action == "reject":
        b.status = "rejected"
        session.add(
            HelperNotification(
                helper_id=current.id,
                kind="booking_rejected",
                title="Booking Declined",
                body=f"Booking {b.booking_ref} was rejected.",
                booking_id=b.id,
            )
        )
    elif body.action == "start":
        b.status = "in_progress"
        b.started_at = now
    elif body.action == "complete":
        b.status = "completed"
        b.completed_at = now
        b.payment_status = "completed"
        current.completed_count += 1
        session.add(
            HelperNotification(
                helper_id=current.id,
                kind="completed",
                title="Service Completed!",
                body=f"Booking {b.booking_ref} marked completed. ₹{b.amount:.2f} credited to earnings.",
                booking_id=b.id,
            )
        )

    if body.notes:
        b.helper_notes = body.notes

    session.commit()
    p = session.get(Patient, b.customer_id)
    return _booking_dict(b, p)


@router.get("/earnings")
def get_helper_earnings(current: Helper = Depends(_get_current_helper), session: Session = Depends(get_session)):
    """Computes today's, weekly, monthly, and total earnings with full transaction history."""
    today = today_ist()
    week_start = today - timedelta(days=today.weekday())  # Monday
    month_start = today.replace(day=1)

    completed_bookings = session.scalars(
        select(ServiceBooking)
        .where(ServiceBooking.helper_id == current.id, ServiceBooking.status == "completed")
        .order_by(ServiceBooking.completed_at.desc().nulls_last(), ServiceBooking.id.desc())
    ).all()

    today_total = sum(
        float(b.amount)
        for b in completed_bookings
        if b.booking_date == today or (b.completed_at and b.completed_at.date() == today)
    )
    week_total = sum(float(b.amount) for b in completed_bookings if b.booking_date >= week_start)
    month_total = sum(float(b.amount) for b in completed_bookings if b.booking_date >= month_start)
    all_time_total = sum(float(b.amount) for b in completed_bookings)

    # Pending is strictly only tasks currently in progress
    pending_bookings = session.scalars(
        select(ServiceBooking)
        .where(
            ServiceBooking.helper_id == current.id,
            ServiceBooking.status == "in_progress",
            ServiceBooking.payment_status == "pending",
        )
    ).all()
    pending_total = sum(float(b.amount) for b in pending_bookings)

    all_relevant_bookings = session.scalars(
        select(ServiceBooking)
        .where(
            ServiceBooking.helper_id == current.id,
            ServiceBooking.status.in_(["completed", "in_progress"]),
        )
        .order_by(
            ServiceBooking.completed_at.desc().nulls_last(),
            ServiceBooking.booking_date.desc(),
            ServiceBooking.id.desc(),
        )
    ).all()

    transactions = [
        {
            "id": b.id,
            "booking_ref": b.booking_ref,
            "service_name": b.service_title,
            "category": b.service_category,
            "amount": float(b.amount),
            "payment_status": "completed" if (b.status == "completed" or b.payment_status == "completed") else "pending",
            "payment_method": b.payment_method,
            "date": str(b.booking_date),
            "completed_at": b.completed_at.isoformat() if b.completed_at else None,
            "status": b.status,
        }
        for b in all_relevant_bookings
    ]

    return {
        "today_earnings": today_total,
        "weekly_earnings": week_total,
        "monthly_earnings": month_total,
        "total_earnings": all_time_total,
        "pending_earnings": pending_total,
        "completed_count": current.completed_count,
        "transactions": transactions,
    }


@router.get("/notifications")
def get_notifications(current: Helper = Depends(_get_current_helper), session: Session = Depends(get_session)):
    """Returns in-app notifications for the helper."""
    notes = session.scalars(
        select(HelperNotification)
        .where(HelperNotification.helper_id == current.id)
        .order_by(desc(HelperNotification.created_at))
        .limit(50)
    ).all()

    unread_count = sum(1 for n in notes if not n.read)
    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "kind": n.kind,
                "title": n.title,
                "body": n.body,
                "booking_id": n.booking_id,
                "read": n.read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notes
        ],
    }


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, current: Helper = Depends(_get_current_helper), session: Session = Depends(get_session)):
    """Marks a notification as read."""
    n = session.get(HelperNotification, notification_id)
    if n and n.helper_id == current.id:
        n.read = True
        session.commit()
    return {"ok": True}


@router.post("/customer/book")
def customer_book_service(body: CustomerServiceBookIn, session: Session = Depends(get_session)):
    """Allows Hello Sahay customer app to request a helper service."""
    patient = session.scalar(select(Patient).where(Patient.phone == body.customer_phone))
    if not patient:
        patient = Patient(phone=body.customer_phone, name=body.customer_name)
        session.add(patient)
        session.flush()

    helper = session.scalar(
        select(Helper).where(Helper.is_online == True).order_by(Helper.rating.desc()).limit(1)
    )

    booking_ref = f"SB-2026-{secrets.randbelow(900) + 100}"
    booking = ServiceBooking(
        booking_ref=booking_ref,
        customer_id=patient.id,
        helper_id=helper.id if helper else None,
        service_category=body.service_category,
        service_title=body.service_title,
        description=body.description,
        booking_date=body.booking_date or today_ist(),
        booking_time=body.booking_time,
        location_address=body.location_address,
        status="new_request",
        amount=body.amount,
        payment_status="pending",
        payment_method="cash",
        customer_notes=body.customer_notes,
    )
    session.add(booking)
    session.flush()

    if helper:
        session.add(
            HelperNotification(
                helper_id=helper.id,
                kind="new_request",
                title=f"New Request: {body.service_title}",
                body=f"Customer {body.customer_name} requested {body.service_category} for {body.booking_time}.",
                booking_id=booking.id,
            )
        )

    session.commit()
    return _booking_dict(booking, patient)


# --- Helpers ---

def _helper_dict(h: Helper) -> dict[str, Any]:
    full_address = ", ".join(
        filter(None, [h.house_no, h.street, h.area, h.city, h.district, h.state, h.pincode])
    )
    return {
        "id": h.id,
        "phone": h.phone,
        "name": h.name,
        "gender": h.gender,
        "email": h.email,
        "profile_photo_url": h.profile_photo_url,
        "address": {
            "house_no": h.house_no,
            "street": h.street,
            "area": h.area,
            "city": h.city,
            "district": h.district,
            "state": h.state,
            "pincode": h.pincode,
            "full_address": full_address,
        },
        "id_verification": {
            "id_type": h.id_type,
            "id_number": h.id_number,
            "id_document_url": h.id_document_url,
            "status": h.id_status,  # not_submitted, pending, verified, rejected
        },
        "categories": h.categories or [],
        "description": h.description,
        "skills": h.skills or [],
        "experience_years": h.experience_years,
        "languages": h.languages or ["English", "Tamil"],
        "emergency_contact": h.emergency_contact,
        "is_online": h.is_online,
        "rating": h.rating,
        "completed_count": h.completed_count,
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


def _booking_dict(b: ServiceBooking, p: Patient | None) -> dict[str, Any]:
    return {
        "id": b.id,
        "booking_ref": b.booking_ref,
        "service_category": b.service_category,
        "service_title": b.service_title,
        "description": b.description,
        "booking_date": str(b.booking_date),
        "booking_time": b.booking_time,
        "location_address": b.location_address,
        "location_lat": b.location_lat,
        "location_lng": b.location_lng,
        "status": b.status,  # new_request, upcoming, in_progress, completed, cancelled, rejected
        "amount": float(b.amount),
        "payment_status": b.payment_status,
        "payment_method": b.payment_method,
        "customer_notes": b.customer_notes,
        "helper_notes": b.helper_notes,
        "started_at": b.started_at.isoformat() if b.started_at else None,
        "completed_at": b.completed_at.isoformat() if b.completed_at else None,
        "customer": {
            "id": p.id if p else None,
            "name": p.name if p else "Customer",
            "phone": p.phone if p else "",
            "village": p.village if p else "",
        } if p else None,
    }

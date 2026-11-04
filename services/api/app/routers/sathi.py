"""Sahay Sathi, the helper app: sign-in, registration, requests, earnings and notifications.

The patient side of the same bookings is routers/services.py.
"""
import hmac
import logging
import secrets
import time
from datetime import datetime, timedelta
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.orm import Session

from ..common import IST, normalize_phone, today_ist
from ..db import get_session
from ..models import Patient
from ..models_sathi import Helper, HelperNotification, ServiceBooking
from ..sathi_catalog import ALL_PREDEFINED_SKILLS, SKILLS_CATALOG, category_of, match_skills
from ..security import hash_password, make_token, optional_claims, verify_password
from .auth import OTP_RESEND_S, OTP_TRIES, OTP_TTL_S, SHOW_CODE
from .care import notify

log = logging.getLogger("sahay.sathi")
router = APIRouter(prefix="/sathi")

HELPER_TOKEN_HOURS = 30 * 24
# ponytail: in-memory, one API process; a second instance needs a shared store (same limit as the patient OTP)
_otps: dict[str, dict[str, Any]] = {}
_DUMMY_HASH = hash_password("not-a-real-password")


def current_helper(claims: dict | None = Depends(optional_claims), session: Session = Depends(get_session)) -> Helper:
    if claims is None or claims.get("role") != "helper":
        raise HTTPException(401, "helper login required")
    helper = session.scalar(select(Helper).where(Helper.phone == claims["sub"]))
    if helper is None:
        raise HTTPException(401, "helper not found")
    return helper


# --- schemas ---

class OtpRequestIn(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class OtpVerifyIn(OtpRequestIn):
    code: str


class PasswordLoginIn(BaseModel):
    identifier: str = Field(min_length=3, max_length=200)  # mobile number or email
    password: str = Field(min_length=1, max_length=200)


class HelperRegistrationIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    gender: Literal["male", "female", "other"] = "male"
    email: str | None = Field(default=None, max_length=200)
    profile_photo_url: str | None = Field(default=None, max_length=500)

    house_no: str | None = Field(default=None, max_length=100)
    street: str | None = Field(default=None, max_length=200)
    area: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default="Tamil Nadu", max_length=100)
    pincode: str | None = Field(default=None, max_length=20)

    id_type: str = Field(default="Aadhaar Card", max_length=50)
    id_number: str = Field(min_length=4, max_length=100)
    id_document_url: str | None = Field(default=None, max_length=500)

    categories: list[str] = Field(default_factory=list, max_length=len(SKILLS_CATALOG))
    description: str | None = Field(default=None, max_length=1500)
    skills: list[str] = Field(default_factory=list, max_length=40)
    experience_years: int = Field(default=1, ge=0, le=50)
    languages: list[str] = Field(default_factory=list, max_length=12)
    emergency_contact: str | None = Field(default=None, max_length=100)

    @field_validator("categories")
    @classmethod
    def _categories(cls, v: list[str]) -> list[str]:
        if any(c not in SKILLS_CATALOG for c in v):
            raise ValueError("unknown service category")
        return v


class SkillExtractIn(BaseModel):
    description: str = Field(min_length=3, max_length=1500)


class BookingActionIn(BaseModel):
    action: Literal["accept", "reject", "start", "complete"]
    notes: str | None = Field(default=None, max_length=1000)


class AvailabilityUpdateIn(BaseModel):
    is_online: bool | None = None
    working_days: list[str] | None = None
    working_hours_start: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    working_hours_end: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    unavailable_dates: list[str] | None = None


class ProfileUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    email: str | None = Field(default=None, max_length=200)
    house_no: str | None = Field(default=None, max_length=100)
    street: str | None = Field(default=None, max_length=200)
    area: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, max_length=20)
    categories: list[str] | None = None
    skills: list[str] | None = None
    experience_years: int | None = Field(default=None, ge=0, le=50)
    languages: list[str] | None = None
    emergency_contact: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=1500)


# --- skills ---

@router.get("/skills/catalog")
def skills_catalog():
    return {"categories": list(SKILLS_CATALOG), "catalog": SKILLS_CATALOG, "all_skills": ALL_PREDEFINED_SKILLS}


@router.post("/skills/extract")
def extract_skills(body: SkillExtractIn, _: Helper = Depends(current_helper)):
    """Catalog skills found in a helper's free-form description: keywords first, then the model on top."""
    skills = match_skills(body.description)
    try:
        from ..chat.bedrock import generate
        answer = generate(
            "Pick skills from the given list that the description mentions. Answer only with a comma-separated list "
            "of items copied exactly from the list, or nothing.",
            f"List: {[s['skill'] for s in ALL_PREDEFINED_SKILLS]}\nDescription: {body.description}", max_tokens=150)
        known = {s["skill"] for s in ALL_PREDEFINED_SKILLS}
        skills += [s for s in (x.strip() for x in answer.split(",")) if s in known and s not in skills]
    except Exception as e:
        log.warning("skill extraction used keywords only: %s", e)
    categories = sorted({c for c in map(category_of, skills) if c})
    return {"recognized_skills": skills, "matched_categories": categories,
            "suggestions": skills or ["Basic Household Maintenance", "Elderly Care"]}


# --- sign-in ---

@router.post("/auth/otp/request")
def request_otp(body: OtpRequestIn, session: Session = Depends(get_session)):
    now = time.time()
    held = _otps.get(body.phone)
    if held and now - held["sent_at"] < OTP_RESEND_S:
        raise HTTPException(429, f"Wait {int(OTP_RESEND_S - (now - held['sent_at'])) + 1} seconds before asking again.")
    code = f"{secrets.randbelow(10 ** 6):06d}"
    _otps[body.phone] = {"code": code, "exp": now + OTP_TTL_S, "tries": 0, "sent_at": now}
    helper = session.scalar(select(Helper).where(Helper.phone == body.phone))
    out: dict[str, Any] = {"sent": True, "expires_in": OTP_TTL_S, "delivery": "screen" if SHOW_CODE else "none",
                           "is_registered": helper is not None and helper.id_status != "not_submitted"}
    if SHOW_CODE:
        out["demo_code"] = code
    return out


@router.post("/auth/otp/verify")
def verify_otp(body: OtpVerifyIn, session: Session = Depends(get_session)):
    held = _otps.get(body.phone)
    if held is None or time.time() > held["exp"]:
        _otps.pop(body.phone, None)
        raise HTTPException(401, "That code has expired. Ask for a new one.")
    held["tries"] += 1
    if held["tries"] > OTP_TRIES:
        _otps.pop(body.phone, None)
        raise HTTPException(429, "Too many wrong codes. Ask for a new one.")
    if not hmac.compare_digest(body.code.strip().encode(), held["code"].encode()):
        raise HTTPException(401, "Wrong code. Check the 6 digits and try again.")
    _otps.pop(body.phone, None)
    helper = session.scalar(select(Helper).where(Helper.phone == body.phone))
    if helper is None:  # a verified number with no profile yet; registration fills it in
        helper = Helper(phone=body.phone, name="", id_status="not_submitted")
        session.add(helper)
        session.commit()
    return {"token": make_token(helper.phone, "helper", hours=HELPER_TOKEN_HOURS),
            "is_registered": helper.id_status != "not_submitted", "helper": _helper_dict(helper)}


@router.post("/auth/login")
def login(body: PasswordLoginIn, session: Session = Depends(get_session)):
    ident = body.identifier.strip()
    if "@" in ident:
        helper = session.scalar(select(Helper).where(func.lower(Helper.email) == ident.lower()))
    else:
        try:
            helper = session.scalar(select(Helper).where(Helper.phone == normalize_phone(ident)))
        except ValueError:
            helper = None
    stored = helper.password_hash if helper else None
    ok = verify_password(body.password, stored or _DUMMY_HASH) and stored is not None
    if not ok:
        raise HTTPException(401, "Wrong mobile number, email or password. New here? Sign in with an OTP.")
    return {"token": make_token(helper.phone, "helper", hours=HELPER_TOKEN_HOURS),
            "is_registered": helper.id_status != "not_submitted", "helper": _helper_dict(helper)}


@router.post("/register")
def register(body: HelperRegistrationIn, helper: Helper = Depends(current_helper), session: Session = Depends(get_session)):
    """Fills in the profile of the helper whose number was just verified. A new profile waits for an ID check."""
    data = body.model_dump()
    data["name"] = body.name.strip()
    data["email"] = body.email.strip() if body.email else None
    data["languages"] = body.languages or ["English", "Tamil"]
    data["state"] = body.state or "Tamil Nadu"
    # no file store yet: a document is only kept when it is a link, never an inline upload
    data["id_document_url"] = body.id_document_url if (body.id_document_url or "").startswith("https://") else None
    data["profile_photo_url"] = body.profile_photo_url if (body.profile_photo_url or "").startswith("https://") else None
    for field, value in data.items():
        setattr(helper, field, value)
    if helper.id_status in ("not_submitted", "rejected"):
        helper.id_status = "pending"
    session.commit()
    return {"success": True, "token": make_token(helper.phone, "helper", hours=HELPER_TOKEN_HOURS),
            "helper": _helper_dict(helper)}


# --- profile and availability ---

@router.get("/profile")
def get_profile(helper: Helper = Depends(current_helper)):
    return _helper_dict(helper)


@router.put("/profile")
def update_profile(body: ProfileUpdateIn, helper: Helper = Depends(current_helper), session: Session = Depends(get_session)):
    changes = body.model_dump(exclude_unset=True)
    if any(c not in SKILLS_CATALOG for c in changes.get("categories") or []):
        raise HTTPException(422, "unknown service category")
    for field, value in changes.items():
        if value is not None:
            setattr(helper, field, value)
    session.commit()
    return _helper_dict(helper)


def _availability(h: Helper) -> dict[str, Any]:
    return {"is_online": h.is_online, "working_days": h.working_days, "working_hours_start": h.working_hours_start,
            "working_hours_end": h.working_hours_end, "unavailable_dates": h.unavailable_dates or []}


@router.get("/availability")
def get_availability(helper: Helper = Depends(current_helper)):
    return _availability(helper)


@router.put("/availability")
def update_availability(body: AvailabilityUpdateIn, helper: Helper = Depends(current_helper),
                        session: Session = Depends(get_session)):
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(helper, field, value)
    session.commit()
    return _availability(helper)


# --- bookings ---

def _mine_or_open(helper: Helper):
    """Bookings assigned to this helper, plus requests no helper has been picked for yet."""
    return or_(ServiceBooking.helper_id == helper.id,
               and_(ServiceBooking.helper_id.is_(None), ServiceBooking.status == "new_request"))


@router.get("/bookings")
def list_bookings(status: Literal["new_request", "upcoming", "in_progress", "completed", "cancelled", "rejected", "all"] = "all",
                  helper: Helper = Depends(current_helper), session: Session = Depends(get_session)):
    q = (select(ServiceBooking, Patient).join(Patient, Patient.id == ServiceBooking.customer_id)
         .where(_mine_or_open(helper)).order_by(ServiceBooking.booking_date.desc(), ServiceBooking.id.desc()))
    if status != "all":
        q = q.where(ServiceBooking.status == status)
    return [_booking_dict(b, p, helper) for b, p in session.execute(q).all()]


def _visible_booking(session: Session, helper: Helper, booking_id: int, lock: bool = False) -> tuple[ServiceBooking, Patient]:
    q = (select(ServiceBooking, Patient).join(Patient, Patient.id == ServiceBooking.customer_id)
         .where(ServiceBooking.id == booking_id, _mine_or_open(helper)))
    row = session.execute(q.with_for_update(of=ServiceBooking) if lock else q).first()
    if row is None:
        raise HTTPException(404, "Booking not found")
    return row


@router.get("/bookings/{booking_id}")
def booking_details(booking_id: int, helper: Helper = Depends(current_helper), session: Session = Depends(get_session)):
    b, p = _visible_booking(session, helper, booking_id)
    return _booking_dict(b, p, helper)


# the status each action needs the booking to be in, and the status it leaves it in
TRANSITIONS = {"accept": ("new_request", "upcoming"), "reject": ("new_request", "rejected"),
               "start": ("upcoming", "in_progress"), "complete": ("in_progress", "completed")}
PATIENT_MESSAGE = {
    "accept": ("Helper confirmed", "{helper} will come for {title} on {date}."),
    "reject": ("Helper could not come", "{helper} cannot take {title}. Please book another helper."),
    "start": ("Helper has started", "{helper} has started {title}."),
    "complete": ("Service completed", "{title} is done. Amount: ₹{amount}."),
}


@router.post("/bookings/{booking_id}/action")
def booking_action(booking_id: int, body: BookingActionIn, helper: Helper = Depends(current_helper),
                   session: Session = Depends(get_session)):
    b, p = _visible_booking(session, helper, booking_id, lock=True)
    needs, becomes = TRANSITIONS[body.action]
    if b.status != needs:
        raise HTTPException(409, f"This booking is {b.status.replace('_', ' ')}, so you cannot {body.action} it.")
    if body.action == "reject" and b.helper_id is None:  # an open request is declined by simply leaving it
        return _booking_dict(b, p, helper)
    b.status = becomes
    b.helper_id = helper.id
    now = datetime.now(IST)
    if body.action == "start":
        b.started_at = now
    elif body.action == "complete":
        b.completed_at, b.payment_status = now, "completed"
        helper.completed_count += 1
    if body.notes:
        b.helper_notes = body.notes
    title, text = PATIENT_MESSAGE[body.action]
    notify(session, p.phone, "service", title,
           text.format(helper=helper.name, title=b.service_title, date=b.booking_date, amount=f"{b.amount:.0f}"))
    if body.action in ("accept", "reject", "complete"):
        session.add(HelperNotification(
            helper_id=helper.id, kind={"accept": "booking_accepted", "reject": "booking_rejected", "complete": "completed"}[body.action],
            title={"accept": "Booking confirmed", "reject": "Booking declined", "complete": "Service completed"}[body.action],
            body=f"{b.booking_ref}: {b.service_title}" + (f", ₹{b.amount:.0f} added to earnings" if body.action == "complete" else ""),
            booking_id=b.id))
    session.commit()
    return _booking_dict(b, p, helper)


# --- earnings and notifications ---

@router.get("/earnings")
def earnings(helper: Helper = Depends(current_helper), session: Session = Depends(get_session)):
    today = today_ist()
    week_start, month_start = today - timedelta(days=today.weekday()), today.replace(day=1)
    rows = session.scalars(
        select(ServiceBooking).where(ServiceBooking.helper_id == helper.id,
                                     ServiceBooking.status.in_(["completed", "in_progress"]))
        .order_by(ServiceBooking.completed_at.desc().nulls_last(), ServiceBooking.booking_date.desc(), ServiceBooking.id.desc())).all()
    done = [b for b in rows if b.status == "completed"]
    total = lambda items: sum(float(b.amount) for b in items)  # noqa: E731
    return {
        "today_earnings": total([b for b in done if b.booking_date == today or (b.completed_at and b.completed_at.astimezone(IST).date() == today)]),
        "weekly_earnings": total([b for b in done if b.booking_date >= week_start]),
        "monthly_earnings": total([b for b in done if b.booking_date >= month_start]),
        "total_earnings": total(done),
        "pending_earnings": total([b for b in rows if b.status == "in_progress"]),
        "completed_count": helper.completed_count,
        "transactions": [{
            "id": b.id, "booking_ref": b.booking_ref, "service_name": b.service_title, "category": b.service_category,
            "amount": float(b.amount), "payment_status": "completed" if b.status == "completed" else "pending",
            "payment_method": b.payment_method, "date": str(b.booking_date),
            "completed_at": b.completed_at.isoformat() if b.completed_at else None, "status": b.status,
        } for b in rows],
    }


@router.get("/notifications")
def notifications(helper: Helper = Depends(current_helper), session: Session = Depends(get_session)):
    notes = session.scalars(select(HelperNotification).where(HelperNotification.helper_id == helper.id)
                            .order_by(desc(HelperNotification.created_at), desc(HelperNotification.id)).limit(50)).all()
    return {"unread_count": sum(1 for n in notes if not n.read), "notifications": [{
        "id": n.id, "kind": n.kind, "title": n.title, "body": n.body, "booking_id": n.booking_id, "read": n.read,
        "created_at": n.created_at.isoformat() if n.created_at else None} for n in notes]}


@router.patch("/notifications/{notification_id}/read")
def mark_read(notification_id: int, helper: Helper = Depends(current_helper), session: Session = Depends(get_session)):
    n = session.get(HelperNotification, notification_id)
    if n and n.helper_id == helper.id:
        n.read = True
        session.commit()
    return {"ok": True}


# --- response shapes ---

def _mask_id(number: str | None) -> str | None:
    return None if not number else "X" * max(0, len(number) - 4) + number[-4:]


def _helper_dict(h: Helper) -> dict[str, Any]:
    full = ", ".join(filter(None, [h.house_no, h.street, h.area, h.city, h.district, h.state, h.pincode]))
    return {
        "id": h.id, "phone": h.phone, "name": h.name, "gender": h.gender, "email": h.email,
        "profile_photo_url": h.profile_photo_url, "is_demo": h.is_demo,
        "address": {"house_no": h.house_no, "street": h.street, "area": h.area, "city": h.city, "district": h.district,
                    "state": h.state, "pincode": h.pincode, "full_address": full},
        "id_verification": {"id_type": h.id_type, "id_number": _mask_id(h.id_number),
                            "id_document_url": h.id_document_url, "status": h.id_status},
        "categories": h.categories or [], "description": h.description, "skills": h.skills or [],
        "experience_years": h.experience_years, "languages": h.languages or ["English", "Tamil"],
        "emergency_contact": h.emergency_contact, "is_online": h.is_online, "rating": h.rating,
        "completed_count": h.completed_count, "created_at": h.created_at.isoformat() if h.created_at else None,
    }


def _booking_dict(b: ServiceBooking, p: Patient, viewer: Helper) -> dict[str, Any]:
    """A customer's number is only shared with the helper who has the booking."""
    mine = b.helper_id == viewer.id
    return {
        "id": b.id, "booking_ref": b.booking_ref, "service_category": b.service_category, "service_title": b.service_title,
        "description": b.description, "booking_date": str(b.booking_date), "booking_time": b.booking_time,
        "location_address": b.location_address, "location_lat": b.location_lat, "location_lng": b.location_lng,
        "status": b.status, "amount": float(b.amount), "payment_status": b.payment_status,
        "payment_method": b.payment_method, "customer_notes": b.customer_notes, "helper_notes": b.helper_notes,
        "started_at": b.started_at.isoformat() if b.started_at else None,
        "completed_at": b.completed_at.isoformat() if b.completed_at else None,
        "open_request": b.helper_id is None,
        "customer": {"id": p.id, "name": p.name or "Customer", "phone": p.phone if mine else "", "village": p.village or ""},
    }

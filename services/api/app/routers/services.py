"""Home care services in the patient app: pick a Sahay Sathi helper, book a visit, follow it, cancel it.

The helper's side of the same bookings is routers/sathi.py. A helper's phone number reaches the patient only once the
helper has accepted the booking; seeded demo helpers have no real number, so the app dials the helpline for them.
"""
from datetime import date, timedelta
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import today_ist
from ..db import get_session
from ..models import Patient
from ..models_sathi import Helper, HelperNotification, ServiceBooking
from ..sathi_catalog import CATEGORY_RATE
from ..sathi_seed import DEMO_HELPER_PHONE
from .care import me, notify

router = APIRouter(prefix="/services")

CUSTOM = "Custom request"  # the patient describes a need; any helper can take it
SLOTS = {"morning": "09:00 AM - 12:00 PM", "afternoon": "12:00 PM - 04:00 PM", "evening": "04:00 PM - 07:00 PM"}
WEEKDAYS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
ACTIVE = ("new_request", "upcoming", "in_progress")
MAX_ACTIVE, MAX_DAYS_AHEAD = 10, 60


class BookingIn(BaseModel):
    helper_id: int | None = None
    service_category: str = Field(max_length=100)
    service_title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=1500)
    booking_date: date
    slot: Literal["morning", "afternoon", "evening"] = "morning"
    location_address: str = Field(min_length=3, max_length=500)
    customer_notes: str | None = Field(default=None, max_length=500)


def _rate(h: Helper, category: str) -> tuple[float, str]:
    default_amount, default_label = CATEGORY_RATE.get(category, (0, "Price agreed with the helper"))
    return (float(h.rate_amount) if h.rate_amount is not None else default_amount, h.rate_label or default_label)


def _provider(h: Helper, category: str) -> dict[str, Any]:
    amount, label = _rate(h, category)
    return {"id": h.id, "name": h.name, "photo": h.profile_photo_url, "rating": h.rating,
            "jobs_done": h.completed_count, "experience_years": h.experience_years, "languages": h.languages or [],
            "description": h.description, "skills": h.skills or [], "rate_amount": amount, "rate_label": label,
            "online": h.is_online, "demo": h.is_demo}


@router.get("/providers")
def providers(category: str = Query(max_length=100), session: Session = Depends(get_session)):
    """Helpers whose ID has been checked and who offer this service, best rated first."""
    rows = session.scalars(select(Helper).where(Helper.id_status == "verified", Helper.phone != DEMO_HELPER_PHONE)  # the Sahay Sathi try-out login is not a listed helper
                           .order_by(Helper.rating.desc(), Helper.completed_count.desc())).all()
    return [_provider(h, category) for h in rows if category in (h.categories or [])]


def _booking_json(b: ServiceBooking, helper: Helper | None) -> dict[str, Any]:
    return {"id": b.id, "booking_ref": b.booking_ref, "service_category": b.service_category,
            "service_title": b.service_title, "description": b.description, "booking_date": str(b.booking_date),
            "booking_time": b.booking_time, "location_address": b.location_address, "status": b.status,
            "amount": float(b.amount), "payment_status": b.payment_status, "customer_notes": b.customer_notes,
            "helper": {"id": helper.id, "name": helper.name, "photo": helper.profile_photo_url, "demo": helper.is_demo,
                       # a helper's number is shared only once they have taken the booking
                       "phone": helper.phone if b.status in ("upcoming", "in_progress") else None} if helper else None,
            "created_at": b.created_at.isoformat() if b.created_at else None}


def _check_helper(session: Session, body: BookingIn) -> Helper:
    h = session.get(Helper, body.helper_id)
    if h is None or h.id_status != "verified":
        raise HTTPException(404, "That helper is not available.")
    if not h.is_online:
        raise HTTPException(409, f"{h.name} is not taking bookings right now.")
    if body.service_category not in (h.categories or []):
        raise HTTPException(422, f"{h.name} does not offer {body.service_category}.")
    if WEEKDAYS[body.booking_date.weekday()] not in (h.working_days or []) or str(body.booking_date) in (h.unavailable_dates or []):
        raise HTTPException(409, f"{h.name} does not work on {body.booking_date:%A %d %b}. Pick another day.")
    taken = session.scalar(select(func.count(ServiceBooking.id)).where(
        ServiceBooking.helper_id == h.id, ServiceBooking.booking_date == body.booking_date,
        ServiceBooking.booking_time == SLOTS[body.slot], ServiceBooking.status.in_(ACTIVE)))
    if taken:
        raise HTTPException(409, f"{h.name} already has a visit then. Pick another time.")
    return h


@router.post("/bookings", status_code=201)
def book(body: BookingIn, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    today = today_ist()
    if not today <= body.booking_date <= today + timedelta(days=MAX_DAYS_AHEAD):
        raise HTTPException(422, f"Pick a day between today and {MAX_DAYS_AHEAD} days from now.")
    if body.helper_id is None and body.service_category != CUSTOM:
        raise HTTPException(422, "Pick a helper.")
    if session.scalar(select(func.count(ServiceBooking.id)).where(
            ServiceBooking.customer_id == patient.id, ServiceBooking.status.in_(ACTIVE))) >= MAX_ACTIVE:
        raise HTTPException(409, "You have many open requests. Cancel one or wait for a helper to finish.")
    helper = _check_helper(session, body) if body.helper_id is not None else None
    amount = _rate(helper, body.service_category)[0] if helper else 0

    b = ServiceBooking(
        booking_ref=uuid4().hex[:30], customer_id=patient.id, helper_id=helper.id if helper else None,
        service_category=body.service_category, service_title=body.service_title.strip(), description=body.description,
        booking_date=body.booking_date, booking_time=SLOTS[body.slot], location_address=body.location_address.strip(),
        status="new_request", amount=amount, customer_notes=body.customer_notes)
    session.add(b)
    session.flush()
    b.booking_ref = f"SB-{today.year}-{b.id:05d}"
    who = patient.name or "A patient"
    if helper:
        session.add(HelperNotification(helper_id=helper.id, kind="new_request", title=f"New request: {b.service_title}",
                                       body=f"{who} asked for {b.service_category} on {b.booking_date}, {b.booking_time}.",
                                       booking_id=b.id))
    else:  # an open request goes to every online, checked helper
        for h in session.scalars(select(Helper).where(Helper.is_online.is_(True), Helper.id_status == "verified")):
            session.add(HelperNotification(helper_id=h.id, kind="new_request", title=f"Open request: {b.service_title}",
                                           body=f"{who} needs help on {b.booking_date}, {b.booking_time}.", booking_id=b.id))
    notify(session, patient.phone, "service", "Request sent",
           f"{helper.name if helper else 'Our helpers'} will confirm {b.service_title} for {b.booking_date}." )
    session.commit()
    return _booking_json(b, helper)


@router.get("/bookings")
def my_bookings(patient: Patient = Depends(me), session: Session = Depends(get_session)):
    rows = session.execute(
        select(ServiceBooking, Helper).outerjoin(Helper, Helper.id == ServiceBooking.helper_id)
        .where(ServiceBooking.customer_id == patient.id)
        .order_by(ServiceBooking.booking_date.desc(), ServiceBooking.id.desc()).limit(50)).all()
    return [_booking_json(b, h) for b, h in rows]


@router.post("/bookings/{booking_id}/cancel")
def cancel(booking_id: int, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    b = session.scalar(select(ServiceBooking).where(ServiceBooking.id == booking_id, ServiceBooking.customer_id == patient.id)
                       .with_for_update())
    if b is None:
        raise HTTPException(404, "Booking not found")
    if b.status not in ("new_request", "upcoming"):
        raise HTTPException(409, f"This booking is {b.status.replace('_', ' ')}, so it cannot be cancelled.")
    b.status = "cancelled"
    if b.helper_id:
        session.add(HelperNotification(helper_id=b.helper_id, kind="booking_cancelled", title="Booking cancelled",
                                       body=f"{b.booking_ref}: {patient.name or 'The patient'} cancelled {b.service_title}.",
                                       booking_id=b.id))
    session.commit()
    return _booking_json(b, session.get(Helper, b.helper_id) if b.helper_id else None)

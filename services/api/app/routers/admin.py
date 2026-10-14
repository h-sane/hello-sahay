"""Hello Sahay team console: platform-wide analytics, hospitals, payments and every call transcript.

Admin token only. Subscription and arrival-fee lines are derived from partner flags and
arrived appointments (₹2,999 a month, ₹40 per arrival); rows in the payment table are added on top.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import Appointment, Call, Doctor, Facility, Patient, Payment, Slot
from ..security import require_staff

SUBSCRIPTION_RS = 2999
ARRIVAL_FEE_RS = 40
IST = timezone(timedelta(hours=5, minutes=30))


def require_admin(claims: dict = Depends(require_staff)) -> dict:
    if claims["role"] != "admin":
        raise HTTPException(403, "admin only")
    return claims


router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


def _counts(session: Session, column, *where) -> dict:
    query = select(column, func.count()).group_by(column)
    for clause in where:
        query = query.where(clause)
    return {key or "unknown": n for key, n in session.execute(query)}


ARRIVED = ("arrived", "completed")


def _arrivals_by_facility(session: Session) -> dict[int, dict]:
    """Per facility: appointment counts by status, and 'billable' = patients Sahay sent who arrived.

    Walk-ins entered at the counter (source desk) were not brought by Sahay, so they carry no ₹40 fee.
    """
    rows = session.execute(
        select(Doctor.facility_id, Appointment.status, Appointment.source, func.count())
        .join(Slot, Slot.id == Appointment.slot_id).join(Doctor, Doctor.id == Slot.doctor_id)
        .group_by(Doctor.facility_id, Appointment.status, Appointment.source))
    out: dict[int, dict] = {}
    for facility_id, status, source, n in rows:
        stats = out.setdefault(facility_id, {})
        stats[status] = stats.get(status, 0) + n
        if status in ARRIVED and source != "desk":
            stats["billable"] = stats.get("billable", 0) + n
    return out


@router.get("/overview")
def overview(session: Session = Depends(get_session)):
    midnight = datetime.now(IST).replace(hour=0, minute=0, second=0, microsecond=0)
    appt = _counts(session, Appointment.status)
    arrived, no_show = sum(appt.get(k, 0) for k in ARRIVED), appt.get("no_show", 0)
    billable = sum(v.get("billable", 0) for v in _arrivals_by_facility(session).values())
    partners = session.scalar(select(func.count()).select_from(Facility).where(Facility.is_partner)) or 0
    call_total = session.scalar(select(func.count()).select_from(Call)) or 0
    care_rs = float(session.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).where(
        Payment.kind == "premium", Payment.status == "paid")) or 0)
    return {
        "calls_total": call_total,
        "calls_today": session.scalar(select(func.count()).select_from(Call).where(Call.started_at >= midnight)),
        "calls_by_language": _counts(session, Call.language),
        "calls_by_outcome": _counts(session, Call.outcome),
        "emergencies": session.scalar(select(func.count()).select_from(Call).where(Call.emergency)),
        "handoffs": session.scalar(select(func.count()).select_from(Call).where(Call.handoff)),
        "patients": session.scalar(select(func.count()).select_from(Patient)),
        "premium_patients": session.scalar(select(func.count()).select_from(Patient).where(Patient.is_premium)),
        "appointments_by_status": appt,
        "arrivals": arrived,
        "no_show_rate": round(no_show / (arrived + no_show), 3) if arrived + no_show else None,
        "partner_hospitals": partners,
        "care_plan_revenue_rs": care_rs,
        "revenue_rs": partners * SUBSCRIPTION_RS + billable * ARRIVAL_FEE_RS + care_rs,
    }


@router.get("/hospitals")
def hospitals(session: Session = Depends(get_session)):
    by_facility = _arrivals_by_facility(session)
    calls = _counts(session, Call.facility_id, Call.facility_id.is_not(None))
    out = []
    for f in session.scalars(select(Facility).order_by(Facility.is_partner.desc(), Facility.name)):
        stats = by_facility.get(f.id, {})
        arrived, billable = sum(stats.get(k, 0) for k in ARRIVED), stats.get("billable", 0)
        out.append({
            "id": f.id, "name": f.name, "type": f.type, "address": f.address, "phone": f.phone,
            "is_partner": f.is_partner, "plan": f.plan, "pmjay": f.pmjay, "cmchis": f.cmchis,
            "calls": calls.get(f.id, 0), "bookings": sum(v for k, v in stats.items() if k != "billable"), "arrivals": arrived,
            "no_shows": stats.get("no_show", 0),
            "amount_due_rs": (SUBSCRIPTION_RS if f.is_partner else 0) + billable * ARRIVAL_FEE_RS,
        })
    return out


@router.get("/payments")
def payments(session: Session = Depends(get_session)):
    names = {f.id: f.name for f in session.scalars(select(Facility))}
    lines = []
    for f_id, stats in _arrivals_by_facility(session).items():
        if stats.get("billable") and f_id in names:
            n = stats["billable"]
            lines.append({"payer": names[f_id], "kind": "arrival_fee", "detail": f"{n} arrivals × ₹{ARRIVAL_FEE_RS}",
                          "amount_rs": n * ARRIVAL_FEE_RS, "status": "due"})
    for f in session.scalars(select(Facility).where(Facility.is_partner)):
        lines.append({"payer": f.name, "kind": "subscription", "detail": f.plan or "monthly plan",
                      "amount_rs": SUBSCRIPTION_RS, "status": "due"})
    for p in session.scalars(select(Payment).order_by(Payment.id.desc())):
        if p.payer_type == "hospital":
            payer = names.get(p.payer_id)
        else:
            who = session.get(Patient, p.payer_id)
            payer = f"{who.name or 'Patient'} ({who.phone})" if who else f"Patient {p.payer_id}"
        lines.append({"payer": payer, "kind": p.kind, "detail": p.razorpay_ref or "",
                      "amount_rs": float(p.amount), "status": p.status})
    return lines


@router.get("/premium")
def premium(session: Session = Depends(get_session)):
    return [{"id": p.id, "name": p.name, "phone": p.phone, "language": p.language, "village": p.village,
             "family_phone": p.family_phone}
            for p in session.scalars(select(Patient).where(Patient.is_premium).order_by(Patient.id))]


@router.get("/calls")
def all_calls(limit: int = Query(100, ge=1, le=500), emergency: bool | None = None,
              session: Session = Depends(get_session)):
    """Every call on the platform, including the ones that belong to no hospital."""
    query = (select(Call, Patient.phone, Facility.name)
             .outerjoin(Patient, Patient.id == Call.patient_id)
             .outerjoin(Facility, Facility.id == Call.facility_id)
             .order_by(Call.started_at.desc()).limit(limit))
    if emergency is not None:
        query = query.where(Call.emergency.is_(emergency))
    return [{"id": c.id, "patient_phone": phone, "facility": facility, "language": c.language,
             "outcome": c.outcome, "emergency": c.emergency, "handoff": c.handoff, "callback_done": c.callback_done,
             "summary": c.summary,
             "transcript": c.transcript, "started_at": c.started_at, "duration_s": c.duration_s}
            for c, phone, facility in session.execute(query)]

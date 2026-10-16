"""Family members, the Care plan (a Razorpay test or demo payment that upgrades a parent) and in-app notifications."""
import os
from datetime import datetime
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import payments
from ..common import IST, normalize_phone, today_ist
from ..db import get_session
from ..models import Appointment, Patient, Payment, Reminder, Slot
from ..models_patient_app import CarePlan, FamilyMember, Notification, ReminderTaken
from ..security import optional_claims

router = APIRouter()
CARE_PLAN_RS = 149  # per month, docs/PATIENT_APP_SPEC.md 3.8


def me(session: Session = Depends(get_session), claims: dict | None = Depends(optional_claims)) -> Patient:
    if claims is None or claims.get("role") != "patient":
        raise HTTPException(401, "patient login required")
    p = session.scalar(select(Patient).where(Patient.phone == claims["sub"]))
    if p is None:
        raise HTTPException(404, "patient not found")
    return p


def _phone(raw: str) -> str:
    try:
        return normalize_phone(raw)
    except ValueError:
        raise HTTPException(422, "enter a valid 10 digit mobile number")


def notify(session: Session, phone: str, kind: str, title: str, body: str | None = None) -> None:
    session.add(Notification(phone=phone, kind=kind, title=title, body=body))


def _name(session: Session, phone: str) -> str | None:
    return session.scalar(select(Patient.name).where(Patient.phone == phone))


def _active_plan_for(session: Session, phone: str) -> CarePlan | None:
    return session.scalar(select(CarePlan).where(CarePlan.parent_phone == phone, CarePlan.active)
                          .order_by(CarePlan.paid_at.desc()))


def _plan_json(session: Session, plan: CarePlan) -> dict:
    return {"id": plan.id, "payer_phone": plan.payer_phone, "payer_name": _name(session, plan.payer_phone),
            "parent_phone": plan.parent_phone, "parent_name": _name(session, plan.parent_phone),
            "amount_rs": float(plan.amount), "paid_at": plan.paid_at.isoformat()}


@router.get("/care/me")
def care_me(patient: Patient = Depends(me), session: Session = Depends(get_session)):
    """What the app needs on open: am I on the Care plan, who watches over me, whom do I pay for, unread alerts."""
    mine = _active_plan_for(session, patient.phone)
    paying = session.scalars(select(CarePlan).where(CarePlan.payer_phone == patient.phone, CarePlan.active)
                             .order_by(CarePlan.paid_at.desc())).all()
    unread = session.scalar(select(func.count()).select_from(Notification)
                            .where(Notification.phone == patient.phone, ~Notification.read))
    return {"is_pro": bool(patient.is_premium), "monitored_by": _plan_json(session, mine) if mine else None,
            "paying_for": [_plan_json(session, p) for p in paying], "unread": unread, "plan_price_rs": CARE_PLAN_RS}


class FamilyIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    phone: str | None = Field(default=None, max_length=20)
    relation: Literal["mother", "father", "spouse", "son", "daughter", "other"] | None = None


def _family_json(m: FamilyMember) -> dict:
    return {"id": m.id, "name": m.name, "phone": m.phone, "relation": m.relation}


@router.get("/family")
def list_family(patient: Patient = Depends(me), session: Session = Depends(get_session)):
    rows = session.scalars(select(FamilyMember).where(FamilyMember.owner_phone == patient.phone)
                           .order_by(FamilyMember.id)).all()
    return [_family_json(m) for m in rows]


@router.post("/family", status_code=201)
def add_family(body: FamilyIn, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    m = FamilyMember(owner_phone=patient.phone, name=body.name.strip(), relation=body.relation,
                     phone=_phone(body.phone) if body.phone and body.phone.strip() else None)
    session.add(m)
    session.commit()
    return _family_json(m)


@router.put("/family/{member_id}")
def edit_family(member_id: int, body: FamilyIn, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    m = session.get(FamilyMember, member_id)
    if m is None or m.owner_phone != patient.phone:
        raise HTTPException(404, "family member not found")
    m.name, m.relation = body.name.strip(), body.relation
    m.phone = _phone(body.phone) if body.phone and body.phone.strip() else None
    session.commit()
    return _family_json(m)


@router.delete("/family/{member_id}", status_code=204)
def delete_family(member_id: int, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    m = session.get(FamilyMember, member_id)
    if m is None or m.owner_phone != patient.phone:
        raise HTTPException(404, "family member not found")
    session.delete(m)
    session.commit()


class PayIn(BaseModel):
    parent_phone: str = Field(min_length=10, max_length=20)
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None
    razorpay_signature: str | None = None


@router.post("/care/order")
def order(patient: Patient = Depends(me), session: Session = Depends(get_session)):
    """Starts a Razorpay checkout. mode 'demo' means no keys are configured and /care/pay takes no payment proof."""
    if not payments.enabled():
        return {"mode": "demo"}
    payment = Payment(payer_type="patient", payer_id=patient.id, kind="premium", amount=CARE_PLAN_RS, status="created")
    session.add(payment)
    session.flush()
    try:
        rzp = payments.create_order(CARE_PLAN_RS, f"care-{payment.id}")
    except httpx.HTTPError:
        raise HTTPException(502, "payment service is not reachable, try again")
    payment.razorpay_ref = rzp["id"]
    session.commit()
    return {"mode": "razorpay", "key_id": os.environ["RAZORPAY_KEY_ID"], "order_id": rzp["id"],
            "amount": rzp["amount"], "currency": "INR"}


def _paid_payment(session: Session, patient: Patient, body: PayIn) -> Payment:
    """Demo: a new paid row. Razorpay: the order's row, once the checkout signature checks out."""
    if not payments.enabled():
        payment = Payment(payer_type="patient", payer_id=patient.id, kind="premium", amount=CARE_PLAN_RS, status="paid")
        session.add(payment)
        session.flush()
        payment.razorpay_ref = f"DEMO-PAY-{payment.id}"
        return payment
    if not (body.razorpay_order_id and body.razorpay_payment_id and body.razorpay_signature
            and payments.signature_ok(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)):
        raise HTTPException(402, "payment could not be verified")
    payment = session.scalar(select(Payment).where(Payment.razorpay_ref == body.razorpay_order_id,
                                                   Payment.payer_id == patient.id, Payment.status == "created"))
    if payment is None:
        raise HTTPException(402, "this payment was already used or is not yours")
    payment.status, payment.razorpay_ref = "paid", body.razorpay_payment_id
    return payment


@router.post("/care/pay")
def pay(body: PayIn, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    """Adds the parent's number to the Care plan (pro) once paid, and keeps it so for a number with no account yet
    until that person signs in. Without Razorpay keys, pressing Pay is the (demo) payment."""
    parent_phone = _phone(body.parent_phone)
    existing = session.scalar(select(CarePlan).where(CarePlan.payer_phone == patient.phone,
                                                     CarePlan.parent_phone == parent_phone, CarePlan.active))
    if existing:
        return {"already_active": True, "plan": _plan_json(session, existing)}
    payment = _paid_payment(session, patient, body)
    plan = CarePlan(payer_phone=patient.phone, parent_phone=parent_phone, amount=CARE_PLAN_RS, payment_id=payment.id)
    session.add(plan)
    parent = session.scalar(select(Patient).where(Patient.phone == parent_phone))
    if parent is None:
        parent = Patient(phone=parent_phone)
        session.add(parent)
    parent.is_premium = True
    parent.family_phone = parent.family_phone or patient.phone
    who = patient.name or "A family member"
    notify(session, parent_phone, "care_plan", f"{who} added you to the Care plan",
           "They can now see your medicine reminders and appointments, and help you stay on track.")
    session.commit()
    session.refresh(plan)
    return {"already_active": False, "plan": _plan_json(session, plan)}


@router.delete("/care/plans/{plan_id}", status_code=204)
def stop_plan(plan_id: int, patient: Patient = Depends(me), session: Session = Depends(get_session)):
    plan = session.get(CarePlan, plan_id)
    if plan is None or plan.payer_phone != patient.phone:
        raise HTTPException(404, "plan not found")
    plan.active = False
    session.flush()
    if _active_plan_for(session, plan.parent_phone) is None:
        parent = session.scalar(select(Patient).where(Patient.phone == plan.parent_phone))
        if parent:
            parent.is_premium = False
    session.commit()


@router.get("/care/parents")
def parents(patient: Patient = Depends(me), session: Session = Depends(get_session)):
    """For the person who pays: how each parent is doing today."""
    out = []
    now, today = datetime.now(IST), today_ist()
    for plan in session.scalars(select(CarePlan).where(CarePlan.payer_phone == patient.phone, CarePlan.active)):
        parent = session.scalar(select(Patient).where(Patient.phone == plan.parent_phone))
        reminders, due, taken, nxt = [], 0, 0, None
        if parent:
            reminders = session.scalars(select(Reminder).where(Reminder.patient_id == parent.id, Reminder.active)).all()
            due = sum(len(r.times or []) for r in reminders)
            ids = [r.id for r in reminders]
            if ids:
                taken = session.scalar(select(func.count()).select_from(ReminderTaken)
                                       .where(ReminderTaken.reminder_id.in_(ids), ReminderTaken.day == today))
            appt = session.execute(
                select(Appointment, Slot.start).join(Slot, Slot.id == Appointment.slot_id)
                .where(Appointment.patient_id == parent.id, Appointment.status == "booked", Slot.start >= now)
                .order_by(Slot.start).limit(1)).first()
            if appt:
                nxt = {"start": appt[1].isoformat(), "hospital": appt[0].hospital_label}
        out.append({"plan_id": plan.id, "phone": plan.parent_phone, "name": parent.name if parent else None,
                    "signed_in": bool(parent and parent.name), "medicines": len(reminders),
                    "doses_today": due, "taken_today": taken, "next_appointment": nxt})
    return out


@router.get("/notifications")
def notifications(patient: Patient = Depends(me), session: Session = Depends(get_session)):
    rows = session.scalars(select(Notification).where(Notification.phone == patient.phone)
                           .order_by(Notification.id.desc()).limit(30)).all()
    return [{"id": n.id, "kind": n.kind, "title": n.title, "body": n.body, "read": n.read,
             "created_at": n.created_at.isoformat()} for n in rows]


@router.post("/notifications/read", status_code=204)
def mark_read(patient: Patient = Depends(me), session: Session = Depends(get_session)):
    for n in session.scalars(select(Notification).where(Notification.phone == patient.phone, ~Notification.read)):
        n.read = True
    session.commit()

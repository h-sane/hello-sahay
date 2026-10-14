"""Care plan, family, reminders and notifications against the dev database. Uses two throwaway numbers and removes them."""
import random

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db import SessionLocal
from app.main import app
from app.models import Patient, Payment, Reminder
from app.models_patient_app import CarePlan, FamilyMember, Notification, ReminderTaken


@pytest.fixture()
def people():
    suffix = random.randint(10_000_000, 99_999_999)
    child, parent = f"98{suffix}", f"97{suffix}"
    with TestClient(app) as client:
        def login(phone: str) -> dict:
            code = client.post("/api/v1/auth/otp/request", json={"phone": phone}).json()["demo_code"]
            token = client.post("/api/v1/auth/otp/verify", json={"phone": phone, "code": code}).json()["token"]
            return {"Authorization": f"Bearer {token}"}

        yield client, login(child), login(parent), f"+91{child}", f"+91{parent}"
    with SessionLocal() as s:
        phones = [f"+91{child}", f"+91{parent}"]
        ids = list(s.scalars(select(Patient.id).where(Patient.phone.in_(phones))))
        rem = list(s.scalars(select(Reminder.id).where(Reminder.patient_id.in_(ids))))
        s.execute(delete(ReminderTaken).where(ReminderTaken.reminder_id.in_(rem)))
        s.execute(delete(Reminder).where(Reminder.patient_id.in_(ids)))
        s.execute(delete(Notification).where(Notification.phone.in_(phones)))
        s.execute(delete(FamilyMember).where(FamilyMember.owner_phone.in_(phones)))
        s.execute(delete(CarePlan).where(CarePlan.payer_phone.in_(phones)))
        s.execute(delete(Payment).where(Payment.payer_id.in_(ids), Payment.payer_type == "patient"))
        s.execute(delete(Patient).where(Patient.id.in_(ids)))
        s.commit()


def test_paying_upgrades_the_parent_and_the_family_sees_medicines_taken(people):
    client, child, parent, child_phone, parent_phone = people
    assert client.get("/api/v1/care/me", headers=parent).json()["is_pro"] is False

    paid = client.post("/api/v1/care/pay", json={"parent_phone": parent_phone[3:]}, headers=child).json()
    assert paid["already_active"] is False and paid["plan"]["amount_rs"] == 149
    assert client.post("/api/v1/care/pay", json={"parent_phone": parent_phone}, headers=child).json()["already_active"] is True

    mine = client.get("/api/v1/care/me", headers=parent).json()
    assert mine["is_pro"] is True and mine["monitored_by"]["payer_phone"] == child_phone and mine["unread"] == 1
    assert [p["parent_phone"] for p in client.get("/api/v1/care/me", headers=child).json()["paying_for"]] == [parent_phone]

    rem = client.post("/api/v1/reminders", json={"medicine_name": "Metformin 500 mg", "times": ["20:00", "08:00"]}, headers=parent).json()
    assert rem["times"] == ["08:00", "20:00"]
    client.post(f"/api/v1/reminders/{rem['id']}/taken", json={"at_time": "08:00"}, headers=parent)
    client.post(f"/api/v1/reminders/{rem['id']}/taken", json={"at_time": "08:00"}, headers=parent)  # twice counts once

    status = client.get("/api/v1/care/parents", headers=child).json()[0]
    assert (status["doses_today"], status["taken_today"]) == (2, 1)
    assert any("Metformin" in n["title"] for n in client.get("/api/v1/notifications", headers=child).json())

    plan_id = mine["monitored_by"]["id"]
    assert client.delete(f"/api/v1/care/plans/{plan_id}", headers=child).status_code == 204
    assert client.get("/api/v1/care/me", headers=parent).json()["is_pro"] is False


def test_family_members_are_private_to_their_owner_and_phones_are_checked(people):
    client, child, parent, _, _ = people
    assert client.post("/api/v1/family", json={"name": "Amma", "phone": "12345"}, headers=child).status_code == 422
    made = client.post("/api/v1/family", json={"name": "Amma", "relation": "mother"}, headers=child).json()
    assert client.get("/api/v1/family", headers=parent).json() == []
    assert client.delete(f"/api/v1/family/{made['id']}", headers=parent).status_code == 404
    assert client.delete(f"/api/v1/family/{made['id']}", headers=child).status_code == 204


def test_signed_out_requests_are_refused(people):
    client = people[0]
    for path in ("/api/v1/care/me", "/api/v1/family", "/api/v1/reminders", "/api/v1/notifications"):
        assert client.get(path).status_code == 401

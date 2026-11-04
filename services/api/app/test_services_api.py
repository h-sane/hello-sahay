"""Home care services end to end: a patient books a Sahay Sathi helper, the helper works the booking, the patient sees it.

Needs the seeded demo database (python scripts/load_seed.py, which also loads the demo helpers) and skips itself
without it. Everything these tests create is removed again.
"""
import uuid
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from .common import today_ist
from .db import SessionLocal, init_db
from .main import app
from .models import Patient
from .models_sathi import Helper, HelperNotification, ServiceBooking
from .models_patient_app import Notification
from .sathi_seed import DEMO_HELPER_PASSWORD, DEMO_HELPER_PHONE


def _seeded():
    try:
        init_db()
        with SessionLocal() as s:
            return s.scalar(select(Helper.id).where(Helper.phone == DEMO_HELPER_PHONE)) is not None
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _seeded(), reason="needs the seeded demo database")
API = "/api/v1"
CARE = "Personal Caretaker"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _bearer(token):
    return {"Authorization": f"Bearer {token}"}


def _phone():
    return "+9199" + str(uuid.uuid4().int)[:8]


@pytest.fixture(scope="module")
def patient(client):
    phone = _phone()
    code = client.post(f"{API}/auth/otp/request", json={"phone": phone}).json()["demo_code"]
    token = client.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": code}).json()["token"]
    yield phone, _bearer(token)
    with SessionLocal() as s:
        p = s.scalar(select(Patient).where(Patient.phone == phone))
        if p:
            ids = s.scalars(select(ServiceBooking.id).where(ServiceBooking.customer_id == p.id)).all()
            s.execute(delete(HelperNotification).where(HelperNotification.booking_id.in_(ids)))
            s.execute(delete(ServiceBooking).where(ServiceBooking.customer_id == p.id))
            s.execute(delete(Notification).where(Notification.phone == phone))
            s.delete(p)
        s.commit()


@pytest.fixture(scope="module")
def ramesh(client):
    r = client.post(f"{API}/sathi/auth/login", json={"identifier": "98765 43210", "password": DEMO_HELPER_PASSWORD})
    assert r.status_code == 200, r.text
    return _bearer(r.json()["token"]), r.json()["helper"]["id"]


def _workday(offset):
    d = today_ist() + timedelta(days=offset)
    while d.weekday() == 6:  # the demo helpers do not work Sundays
        d += timedelta(days=1)
    return d


def _book(client, patient, helper_id, day, slot="morning", category=CARE):
    return client.post(f"{API}/services/bookings", headers=patient[1], json={
        "helper_id": helper_id, "service_category": category, "service_title": "Test visit", "booking_date": str(day),
        "slot": slot, "location_address": "12 Test Street, Chennai"})


def test_providers_are_verified_and_never_carry_a_phone(client):
    rows = client.get(f"{API}/services/providers", params={"category": CARE}).json()
    assert len(rows) >= 4
    assert all("phone" not in r for r in rows)
    assert all(r["rate_label"] for r in rows)
    assert client.get(f"{API}/services/providers", params={"category": "Nonsense"}).json() == []


def test_helper_endpoints_need_a_helper_login(client, patient):
    for headers in ({}, patient[1]):
        assert client.get(f"{API}/sathi/bookings", headers=headers).status_code == 401
        assert client.get(f"{API}/sathi/profile", headers=headers).status_code == 401
    assert client.post(f"{API}/sathi/register", json={"name": "Mallory", "id_number": "1234"}).status_code == 401


def test_no_universal_codes(client):
    wrong = client.post(f"{API}/sathi/auth/login", json={"identifier": "98765 43210", "password": "nope"})
    assert wrong.status_code == 401
    unknown = client.post(f"{API}/sathi/auth/login", json={"identifier": "x@gmail.com", "password": DEMO_HELPER_PASSWORD})
    assert unknown.status_code == 401
    phone = _phone()
    code = client.post(f"{API}/sathi/auth/otp/request", json={"phone": phone}).json()["demo_code"]
    wrong = "111111" if code != "111111" else "222222"
    assert client.post(f"{API}/sathi/auth/otp/verify", json={"phone": phone, "code": wrong}).status_code == 401
    other = _phone()  # no code was ever requested for this number
    assert client.post(f"{API}/sathi/auth/otp/verify", json={"phone": other, "code": "123456"}).status_code == 401


def test_new_helper_registers_and_waits_for_the_id_check(client):
    phone = _phone()
    code = client.post(f"{API}/sathi/auth/otp/request", json={"phone": phone}).json()["demo_code"]
    token = client.post(f"{API}/sathi/auth/otp/verify", json={"phone": phone, "code": code}).json()["token"]
    r = client.post(f"{API}/sathi/register", headers=_bearer(token), json={
        "name": "Test Helper", "id_number": "123456789012", "categories": [CARE], "id_document_url": "data:image/png;base64,AAAA"})
    assert r.status_code == 200, r.text
    h = r.json()["helper"]
    assert h["id_verification"]["status"] == "pending"
    assert h["id_verification"]["id_number"] == "XXXXXXXX9012"
    assert h["id_verification"]["id_document_url"] is None
    assert all(p["id"] != h["id"] for p in client.get(f"{API}/services/providers", params={"category": CARE}).json())
    with SessionLocal() as s:
        s.execute(delete(Helper).where(Helper.phone == phone))
        s.commit()


def test_booking_runs_from_request_to_completion(client, patient, ramesh):
    headers, helper_id = ramesh
    day = _workday(4)
    r = _book(client, patient, helper_id, day)
    assert r.status_code == 201, r.text
    b = r.json()
    assert b["status"] == "new_request" and b["amount"] == 750 and b["booking_ref"].startswith("SB-")
    assert b["helper"]["id"] == helper_id

    mine = {x["id"]: x for x in client.get(f"{API}/sathi/bookings", headers=headers).json()}
    assert mine[b["id"]]["customer"]["phone"] == patient[0]
    assert any(n["booking_id"] == b["id"] for n in client.get(f"{API}/sathi/notifications", headers=headers).json()["notifications"])

    # the same helper at the same time is taken
    assert _book(client, patient, helper_id, day).status_code == 409
    # a booking cannot skip steps
    assert client.post(f"{API}/sathi/bookings/{b['id']}/action", headers=headers, json={"action": "complete"}).status_code == 409

    for action, status in (("accept", "upcoming"), ("start", "in_progress"), ("complete", "completed")):
        r = client.post(f"{API}/sathi/bookings/{b['id']}/action", headers=headers, json={"action": action})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == status

    seen = [x for x in client.get(f"{API}/services/bookings", headers=patient[1]).json() if x["id"] == b["id"]]
    assert seen and seen[0]["status"] == "completed"
    titles = [n["title"] for n in client.get(f"{API}/notifications", headers=patient[1]).json()]
    assert {"Helper confirmed", "Helper has started", "Service completed"} <= set(titles)
    assert client.get(f"{API}/sathi/earnings", headers=headers).json()["total_earnings"] >= 750


def test_cancel_and_decline(client, patient, ramesh):
    headers, helper_id = ramesh
    b = _book(client, patient, helper_id, _workday(5), "afternoon").json()
    assert client.post(f"{API}/services/bookings/{b['id']}/cancel", headers=patient[1]).json()["status"] == "cancelled"
    assert client.post(f"{API}/services/bookings/{b['id']}/cancel", headers=patient[1]).status_code == 409
    assert client.post(f"{API}/sathi/bookings/{b['id']}/action", headers=headers, json={"action": "accept"}).status_code == 409

    b2 = _book(client, patient, helper_id, _workday(5), "afternoon").json()
    r = client.post(f"{API}/sathi/bookings/{b2['id']}/action", headers=headers, json={"action": "reject"})
    assert r.json()["status"] == "rejected"
    assert client.post(f"{API}/services/bookings/{b2['id']}/cancel", headers=patient[1]).status_code == 409


def test_booking_rules(client, patient, ramesh):
    helper_id = ramesh[1]
    assert _book(client, patient, helper_id, today_ist() - timedelta(days=1)).status_code == 422
    assert _book(client, patient, helper_id, today_ist() + timedelta(days=400)).status_code == 422
    assert _book(client, patient, helper_id, _workday(6), category="House Cleaning").status_code == 422
    assert _book(client, patient, 999999, _workday(6)).status_code == 404
    sunday = next(d for d in (today_ist() + timedelta(days=i) for i in range(1, 8)) if d.weekday() == 6)
    assert _book(client, patient, helper_id, sunday).status_code == 409
    client.put(f"{API}/sathi/availability", headers=ramesh[0], json={"is_online": False})
    try:
        assert _book(client, patient, helper_id, _workday(6)).status_code == 409
    finally:
        client.put(f"{API}/sathi/availability", headers=ramesh[0], json={"is_online": True})
    no_helper = client.post(f"{API}/services/bookings", headers=patient[1], json={
        "service_category": CARE, "service_title": "Test", "booking_date": str(_workday(6)), "location_address": "Somewhere"})
    assert no_helper.status_code == 422
    assert client.post(f"{API}/services/bookings", json={}).status_code == 401


def test_open_request_goes_to_the_first_helper_who_accepts(client, patient, ramesh):
    headers, _ = ramesh
    r = client.post(f"{API}/services/bookings", headers=patient[1], json={
        "service_category": "Custom request", "service_title": "Escort to hospital", "description": "Needs a wheelchair",
        "booking_date": str(_workday(7)), "location_address": "Door 5, Test Nagar"})
    assert r.status_code == 201, r.text
    b = r.json()
    assert b["helper"] is None and b["amount"] == 0
    seen = {x["id"]: x for x in client.get(f"{API}/sathi/bookings", headers=headers).json()}
    assert seen[b["id"]]["open_request"] and seen[b["id"]]["customer"]["phone"] == ""  # not shared before accepting
    assert client.post(f"{API}/sathi/bookings/{b['id']}/action", headers=headers, json={"action": "accept"}).status_code == 200

    other = client.post(f"{API}/sathi/auth/otp/request", json={"phone": "+919000000101"}).json()["demo_code"]
    token = client.post(f"{API}/sathi/auth/otp/verify", json={"phone": "+919000000101", "code": other}).json()["token"]
    assert client.post(f"{API}/sathi/bookings/{b['id']}/action", headers=_bearer(token), json={"action": "accept"}).status_code == 404
    assert client.get(f"{API}/sathi/bookings/{b['id']}", headers=_bearer(token)).status_code == 404

"""Sahay Desk API against the real database: roles, users, doctors, walk-ins, calls and the live socket.

Needs the seeded demo hospital (python scripts/load_seed.py) and skips itself when the database is not there.
Everything these tests create is removed again.
"""
import uuid
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select, text
from starlette.websockets import WebSocketDisconnect

from .common import IST, today_ist
from .db import SessionLocal, init_db
from .main import app
from .models import Appointment, Call, DeskUser, Doctor, Facility, Patient, Slot
from .routers.auth import DEMO_PASSWORD

PASSWORD = "testpass123"


def _demo_facility_id():
    try:
        init_db()
        with SessionLocal() as s:
            return s.scalars(select(Facility.id).where(Facility.is_partner.is_(True)).order_by(Facility.id)).first()
    except Exception:
        return None


FACILITY = _demo_facility_id()
pytestmark = pytest.mark.skipif(FACILITY is None, reason="needs the seeded demo database")


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def login(client, email, password=DEMO_PASSWORD):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}, r.json()


@pytest.fixture(scope="module")
def admin(client):
    return login(client, "admin@sahay.demo")[0]


@pytest.fixture(scope="module")
def hospital_admin(client):
    return login(client, f"desk{FACILITY}@sahay.demo")[0]


@pytest.fixture(scope="module")
def made():
    """Collects what a test creates so the module cleans up afterwards."""
    ids = {"users": [], "doctors": [], "patients": [], "calls": [], "facilities": []}
    yield ids
    with SessionLocal() as s:
        s.execute(delete(Appointment).where(Appointment.patient_id.in_(ids["patients"])))
        s.execute(delete(Call).where(Call.id.in_(ids["calls"])))
        s.execute(delete(Patient).where(Patient.id.in_(ids["patients"])))
        s.execute(delete(DeskUser).where(DeskUser.id.in_(ids["users"])))
        s.execute(delete(Slot).where(Slot.doctor_id.in_(ids["doctors"])))
        s.execute(delete(Doctor).where(Doctor.id.in_(ids["doctors"])))
        s.execute(delete(Facility).where(Facility.id.in_(ids["facilities"])))
        s.commit()


def tag():
    return uuid.uuid4().hex[:8]


def create_user(client, headers, made, role, **extra):
    email = f"t{tag()}@test.demo"
    body = {"email": email, "password": PASSWORD, "name": "Test Person", "role": role, **extra}
    r = client.post("/api/v1/users", json=body, headers=headers)
    if r.status_code == 201:
        made["users"].append(r.json()["id"])
        if r.json()["doctor_id"]:
            made["doctors"].append(r.json()["doctor_id"])
    return r, email


def tomorrow_doctors(department):
    """Doctor ids with open slots tomorrow (tomorrow, so the answer never depends on the time of day)."""
    c = TestClient(app)
    day = (today_ist() + timedelta(days=1)).isoformat()
    rows = c.get(f"/api/v1/facilities/{FACILITY}/slots", params={"date": day, "department": department}).json()
    return {s["doctor_id"] for s in rows}


def test_login_returns_role_and_name(client):
    _, data = login(client, f"desk{FACILITY}@sahay.demo")
    assert data["role"] == "hospital_admin" and data["facility_id"] == FACILITY and data["name"]
    _, data = login(client, "reception@sunrise.demo")
    assert data["role"] == "receptionist"
    _, data = login(client, "harini@sunrise.demo")
    assert data["role"] == "doctor" and data["doctor_id"]


def test_wrong_password_and_switched_off_login(client, hospital_admin, made):
    assert client.post("/api/v1/auth/login", json={"email": "nobody@x.demo", "password": "whatever1"}).status_code == 401
    r, email = create_user(client, hospital_admin, made, "nurse")
    assert r.status_code == 201
    off = client.patch(f"/api/v1/users/{r.json()['id']}", json={"active": False}, headers=hospital_admin)
    assert off.status_code == 200 and off.json()["active"] is False
    assert client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD}).status_code == 403


def test_only_the_hospital_admin_manages_users(client, hospital_admin, made):
    for email in ("reception@sunrise.demo", "nurse@sunrise.demo", "harini@sunrise.demo"):
        h, _ = login(client, email)
        assert client.get("/api/v1/users", headers=h).status_code == 403
        body = {"email": f"x{tag()}@test.demo", "password": PASSWORD, "name": "X", "role": "nurse"}
        assert client.post("/api/v1/users", json=body, headers=h).status_code == 403
    listed = client.get("/api/v1/users", headers=hospital_admin).json()
    assert {u["role"] for u in listed} >= {"hospital_admin", "receptionist", "nurse", "doctor"}
    assert all(u["facility_id"] == FACILITY for u in listed)


def test_create_receptionist_nurse_and_doctor_who_can_log_in(client, hospital_admin, made):
    for role in ("receptionist", "nurse"):
        r, email = create_user(client, hospital_admin, made, role)
        assert r.status_code == 201 and r.json()["role"] == role
        assert login(client, email, PASSWORD)[1]["role"] == role
    r, email = create_user(client, hospital_admin, made, "doctor", doctor={"department": "Dental", "languages": ["ta"]})
    assert r.status_code == 201 and r.json()["doctor_id"] and r.json()["department"] == "Dental"
    token, data = login(client, email, PASSWORD)
    assert data["role"] == "doctor" and data["doctor_id"] == r.json()["doctor_id"]
    # the new doctor is bookable straight away
    assert r.json()["doctor_id"] in tomorrow_doctors("Dental")


def test_user_rules(client, hospital_admin, admin, made):
    r, email = create_user(client, hospital_admin, made, "nurse")
    dup = client.post("/api/v1/users", json={"email": email, "password": PASSWORD, "name": "Again", "role": "nurse"},
                      headers=hospital_admin)
    assert dup.status_code == 409
    weak = client.post("/api/v1/users", json={"email": f"w{tag()}@test.demo", "password": "short", "name": "W", "role": "nurse"},
                       headers=hospital_admin)
    assert weak.status_code == 422
    assert create_user(client, hospital_admin, made, "hospital_admin")[0].status_code == 403
    assert create_user(client, hospital_admin, made, "doctor")[0].status_code == 422  # no doctor record given
    # the Hello Sahay team creates the hospital admin and must name the hospital
    assert create_user(client, admin, made, "hospital_admin")[0].status_code == 422
    r, email = create_user(client, admin, made, "hospital_admin", facility_id=FACILITY)
    assert r.status_code == 201 and login(client, email, PASSWORD)[1]["facility_id"] == FACILITY


def test_another_hospitals_admin_cannot_touch_this_hospitals_users(client, hospital_admin, made):
    with SessionLocal() as s:
        other = Facility(name=f"Test Hospital {tag()}", type="private", is_partner=True)
        s.add(other)
        s.flush()
        made["facilities"].append(other.id)
        from .security import hash_password
        user = DeskUser(email=f"o{tag()}@test.demo", password_hash=hash_password(PASSWORD), role="hospital_admin",
                        facility_id=other.id, name="Other admin")
        s.add(user)
        s.commit()
        made["users"].append(user.id)
        email = user.email
    h, _ = login(client, email, PASSWORD)
    mine = client.get("/api/v1/users", headers=hospital_admin).json()[0]
    assert client.patch(f"/api/v1/users/{mine['id']}", json={"active": False}, headers=h).status_code == 403
    assert all(u["facility_id"] != FACILITY for u in client.get("/api/v1/users", headers=h).json())
    assert client.get("/api/v1/appointments", headers=h).json() == []
    assert client.get("/api/v1/calls", headers=h).json() == []


def test_doctor_sees_only_own_patients_and_history(client):
    h, data = login(client, "harini@sunrise.demo")
    today = client.get("/api/v1/appointments", params={"date": today_ist().isoformat()}, headers=h).json()
    assert today and all(a["doctor"]["id"] == data["doctor_id"] for a in today)
    past = client.get("/api/v1/appointments", params={"history": "true"}, headers=h).json()
    assert past and all(a["doctor"]["id"] == data["doctor_id"] for a in past)
    assert all(datetime.fromisoformat(a["slot"]["start"]) < datetime.combine(today_ist(), datetime.min.time(), IST) for a in past)
    assert [d["id"] for d in client.get("/api/v1/doctors", headers=h).json()] == [data["doctor_id"]]
    assert client.get("/api/v1/calls", headers=h).status_code == 403
    assert client.get("/api/v1/handoffs", headers=h).status_code == 403


def test_front_desk_sees_every_doctor(client):
    h, _ = login(client, "reception@sunrise.demo")
    docs = client.get("/api/v1/doctors", headers=h).json()
    assert len(docs) >= 9 and {"General Medicine", "Dental", "Ophthalmology", "Obstetrics", "Paediatrics",
                               "Orthopaedics"} <= {d["department"] for d in docs}
    appts = client.get("/api/v1/appointments", params={"date": today_ist().isoformat()}, headers=h).json()
    assert len({a["doctor"]["id"] for a in appts}) > 1


def test_arrive_complete_and_who_may(client, hospital_admin, made):
    reception, _ = login(client, "reception@sunrise.demo")
    doc_h, doc = login(client, "harini@sunrise.demo")
    other_h, _ = login(client, "karthik@sunrise.demo")
    walk = client.post("/api/v1/appointments/walk-in", headers=reception, json={
        "patient": {"name": "Walk Test", "phone": "9000011111"}, "doctor_id": doc["doctor_id"]})
    assert walk.status_code == 201, walk.text
    a = walk.json()
    with SessionLocal() as s:
        made["patients"].append(a["patient"]["id"])
    assert a["status"] == "arrived" and a["source"] == "desk" and a["arrived_at"]
    # a doctor cannot complete another doctor's patient, nor mark arrivals
    assert client.patch(f"/api/v1/appointments/{a['id']}", json={"action": "complete"}, headers=other_h).status_code == 403
    assert client.patch(f"/api/v1/appointments/{a['id']}", json={"action": "no_show"}, headers=doc_h).status_code in (403, 409)
    done = client.patch(f"/api/v1/appointments/{a['id']}", json={"action": "complete"}, headers=doc_h)
    assert done.status_code == 200 and done.json()["status"] == "completed"
    assert client.patch(f"/api/v1/appointments/{a['id']}", json={"action": "complete"}, headers=doc_h).status_code == 409
    # no login at all cannot mark arrival
    assert client.patch(f"/api/v1/appointments/{a['id']}", json={"action": "arrived"}).status_code in (401, 409)


def test_walk_in_works_when_the_day_is_full_and_pays_no_fee(client, hospital_admin, made):
    r, _ = create_user(client, hospital_admin, made, "doctor", doctor={"department": "General Medicine"})
    doctor_id = r.json()["doctor_id"]
    with SessionLocal() as s:  # every slot used up
        s.execute(text("UPDATE slot SET status='blocked' WHERE doctor_id=:d"), {"d": doctor_id})
        s.commit()
    admin_h = login(client, "admin@sahay.demo")[0]
    before = next(f for f in client.get("/api/v1/admin/hospitals", headers=admin_h).json() if f["id"] == FACILITY)
    reception, _ = login(client, "reception@sunrise.demo")
    w = client.post("/api/v1/appointments/walk-in", headers=reception, json={
        "patient": {"name": "Late Walk", "phone": "9000022222"}, "doctor_id": doctor_id, "reason_text": "evening"})
    assert w.status_code == 201, w.text
    made["patients"].append(w.json()["patient"]["id"])
    after = next(f for f in client.get("/api/v1/admin/hospitals", headers=admin_h).json() if f["id"] == FACILITY)
    assert after["arrivals"] == before["arrivals"] + 1
    assert after["amount_due_rs"] == before["amount_due_rs"]  # counter walk-ins are not billed


def test_off_duty_doctor_takes_no_bookings(client, hospital_admin, made):
    r, _ = create_user(client, hospital_admin, made, "doctor", doctor={"department": "Ophthalmology"})
    did = r.json()["doctor_id"]
    assert did in tomorrow_doctors("Ophthalmology")
    assert client.patch(f"/api/v1/doctors/{did}", json={"on_duty": False}, headers=hospital_admin).json()["on_duty"] is False
    assert did not in tomorrow_doctors("Ophthalmology")
    reception, _ = login(client, "reception@sunrise.demo")
    off = client.post("/api/v1/appointments/walk-in", headers=reception, json={
        "patient": {"name": "Off Duty", "phone": "9000033333"}, "doctor_id": did})
    assert off.status_code == 409
    client.patch(f"/api/v1/doctors/{did}", json={"on_duty": True}, headers=hospital_admin)
    assert did in tomorrow_doctors("Ophthalmology")
    # doctors cannot flip someone else's switch
    h, _ = login(client, "harini@sunrise.demo")
    assert client.patch(f"/api/v1/doctors/{did}", json={"on_duty": False}, headers=h).status_code == 403


def test_calls_default_to_the_demo_hospital_and_callbacks_persist(client, made):
    r = client.post("/api/v1/calls", json={"patient_phone": "9000044444", "language": "ta", "outcome": "handed_off",
                                           "handoff": True, "summary": f"test {tag()}"})
    assert r.status_code == 201 and r.json()["facility_id"] == FACILITY
    made["calls"].append(r.json()["id"])
    with SessionLocal() as s:
        made["patients"].append(s.scalar(select(Patient.id).where(Patient.phone == "+919000044444")))
    reception, _ = login(client, "reception@sunrise.demo")
    listed = client.get("/api/v1/handoffs", headers=reception).json()
    assert any(c["id"] == r.json()["id"] and c["callback_done"] is False for c in listed)
    done = client.patch(f"/api/v1/calls/{r.json()['id']}", json={"callback_done": True}, headers=reception)
    assert done.status_code == 200 and done.json()["callback_done"] is True


def test_live_socket_needs_a_token_for_this_hospital(client):
    for url in (f"/api/v1/live/desk/{FACILITY}", f"/api/v1/live/desk/{FACILITY}?token=junk"):
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(url):
                pass
    h, data = login(client, "reception@sunrise.demo")
    token = h["Authorization"].split()[1]
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/v1/live/desk/{FACILITY + 99}?token={token}"):
            pass
    with client.websocket_connect(f"/api/v1/live/desk/{FACILITY}?token={token}"):
        pass


def test_booking_keeps_the_hospital_the_patient_chose_but_sits_at_the_demo_desk(client, made):
    day = (today_ist() + timedelta(days=1)).isoformat()
    slot = client.get(f"/api/v1/facilities/{FACILITY}/slots", params={"date": day}).json()[-1]
    r = client.post("/api/v1/appointments", json={
        "patient": {"name": "Label Test", "phone": "9000077001"}, "slot_id": slot["slot_id"], "source": "app",
        "hospital_name": "Some Real Hospital"})
    assert r.status_code == 201, r.text
    made["patients"].append(r.json()["patient"]["id"])
    assert r.json()["hospital_label"] == "Some Real Hospital" and r.json()["facility"]["id"] == FACILITY
    client.patch(f"/api/v1/appointments/{r.json()['id']}", json={"action": "cancel"})


def test_real_nearby_hospitals_all_book_into_the_demo_hospital(client, monkeypatch):
    from .routers import places
    places._cache.clear()
    monkeypatch.setattr(places, "_search", lambda lat, lng, span: [
        {"type": "hospital", "name": "Real One", "lat": str(lat), "lon": str(lng), "display_name": "Real One, A, B, C", "extratags": {}},
        {"type": "hospital", "name": "Real Two", "lat": str(lat + 0.01), "lon": str(lng), "display_name": "Real Two, A, B, C", "extratags": {}}])
    rows = client.get("/api/v1/places/nearby-hospitals", params={"lat": 11.11, "lng": 77.77}).json()
    places._cache.clear()
    assert [r["name"] for r in rows] == ["Real One", "Real Two"] and {r["book_facility_id"] for r in rows} == {FACILITY}

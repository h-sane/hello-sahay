"""Doctor timetables and the walk-in queue against the real database (needs the seeded demo hospital)."""
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from .common import IST, today_ist
from .db import SessionLocal
from .models import Doctor, Slot, WalkIn
from .test_desk_api import FACILITY, create_user, login, made  # noqa: F401  (made is a fixture)

pytestmark = pytest.mark.skipif(FACILITY is None, reason="needs the seeded demo database")

PARTIAL = {"mode": "partial", "slot_minutes": 20, "run": 3, "break_minutes": 20,
           "windows": [["09:00", "13:00"], ["16:00", "18:00"]], "days_off": []}
TOMORROW = today_ist() + timedelta(days=1)


@pytest.fixture(scope="module")
def client():
    from .main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def front_desk(client):
    return login(client, "reception@sunrise.demo")[0]


@pytest.fixture
def doctor(client, made):  # noqa: F811
    admin_h = login(client, f"desk{FACILITY}@sahay.demo")[0]
    r, _ = create_user(client, admin_h, made, "doctor", doctor={"department": "Dental"})
    return r.json()["doctor_id"]


def tomorrow_slots(doctor_id):
    start = datetime.combine(TOMORROW, datetime.min.time(), IST)
    with SessionLocal() as s:
        rows = s.scalars(select(Slot).where(Slot.doctor_id == doctor_id, Slot.start >= start,
                                            Slot.start < start + timedelta(days=1)).order_by(Slot.start))
        return [(r.start.astimezone(IST).strftime("%H:%M"), r.end.astimezone(IST).strftime("%H:%M"), r.status)
                for r in rows]


def test_saving_a_partial_timetable_relays_the_slots_and_the_helpline_never_sees_the_break(client, front_desk, doctor):
    r = client.put(f"/api/v1/doctors/{doctor}/schedule", headers=front_desk, json=PARTIAL)
    assert r.status_code == 200, r.text
    slots = tomorrow_slots(doctor)
    assert slots[:4] == [("09:00", "09:20", "open"), ("09:20", "09:40", "open"), ("09:40", "10:00", "open"),
                         ("10:20", "10:40", "open")]
    assert all(s[2] == "open" for s in slots)  # a configured doctor has no demo "already taken" slots
    offered = client.get(f"/api/v1/facilities/{FACILITY}/slots",
                         params={"date": TOMORROW.isoformat(), "department": "Dental"}).json()
    starts = {datetime.fromisoformat(s["start"]).astimezone(IST).strftime("%H:%M")
              for s in offered if s["doctor_id"] == doctor}
    assert "10:00" not in starts and "10:20" in starts


def test_switching_back_to_appointments_only_fills_the_breaks(client, front_desk, doctor):
    client.put(f"/api/v1/doctors/{doctor}/schedule", headers=front_desk, json=PARTIAL)
    full = {**PARTIAL, "mode": "appointments"}
    assert client.put(f"/api/v1/doctors/{doctor}/schedule", headers=front_desk, json=full).status_code == 200
    assert [s[0] for s in tomorrow_slots(doctor)][:5] == ["09:00", "09:20", "09:40", "10:00", "10:20"]


def test_a_booked_slot_survives_a_new_timetable_and_nothing_overlaps_it(client, front_desk, doctor, made):  # noqa: F811
    client.put(f"/api/v1/doctors/{doctor}/schedule", headers=front_desk, json={**PARTIAL, "mode": "appointments"})
    offered = client.get(f"/api/v1/facilities/{FACILITY}/slots",
                         params={"date": TOMORROW.isoformat(), "department": "Dental"}).json()
    slot = next(s for s in offered if s["doctor_id"] == doctor and s["start"][11:16] != "09:00")
    booked = client.post("/api/v1/appointments", json={"patient": {"name": "Kept", "phone": "9000055555"},
                                                       "slot_id": slot["slot_id"], "source": "app"})
    assert booked.status_code == 201
    made["patients"].append(booked.json()["patient"]["id"])
    r = client.put(f"/api/v1/doctors/{doctor}/schedule", headers=front_desk,
                   json={**PARTIAL, "slot_minutes": 30, "run": 2, "break_minutes": 30})
    assert r.status_code == 200
    rows = tomorrow_slots(doctor)
    assert sum(s[2] == "booked" for s in rows) == 1
    spans = sorted((s[0], s[1]) for s in rows)
    assert all(a[1] <= b[0] for a, b in zip(spans, spans[1:])), spans  # no overlapping slots


def test_timetable_rules(client, front_desk):
    bad = [{**PARTIAL, "break_minutes": 0}, {**PARTIAL, "slot_minutes": 7},
           {**PARTIAL, "windows": [["13:00", "09:00"]]}, {**PARTIAL, "windows": [["09:00", "09:10"]]},
           {**PARTIAL, "days_off": list(range(7))}, {**PARTIAL, "windows": [["9:00", "13:00"]]}]
    for body in bad:
        assert client.put("/api/v1/doctors/1/schedule", headers=front_desk, json=body).status_code == 422, body
    assert client.put("/api/v1/doctors/1/schedule", json=PARTIAL).status_code == 401


def test_only_front_desk_of_the_same_hospital_edits_timetables(client, doctor):
    doc_h = login(client, "harini@sunrise.demo")[0]
    assert client.put(f"/api/v1/doctors/{doctor}/schedule", headers=doc_h, json=PARTIAL).status_code == 403
    with SessionLocal() as s:
        other = s.scalar(select(Doctor.id).where(Doctor.facility_id != FACILITY))
    if other:
        assert client.put(f"/api/v1/doctors/{other}/schedule", headers=login(client, "reception@sunrise.demo")[0],
                          json=PARTIAL).status_code == 403


def test_preview_shows_slots_and_walk_in_minutes(client, front_desk):
    r = client.post("/api/v1/schedule/preview", headers=front_desk, json=PARTIAL).json()
    assert r["appointment_slots"] > 0 and r["walk_in_minutes"] > 0
    assert {p["kind"] for p in r["pieces"]} == {"appointment", "walk_in"}


def test_doctor_list_carries_the_timetable(client, front_desk, doctor):
    client.put(f"/api/v1/doctors/{doctor}/schedule", headers=front_desk, json=PARTIAL)
    listed = client.get("/api/v1/doctors", headers=front_desk).json()
    mine = next(d for d in listed if d["id"] == doctor)
    assert mine["schedule_custom"] is True and mine["schedule"]["break_minutes"] == 20
    seeded = next(d for d in listed if not d["schedule_custom"])
    assert seeded["schedule"]["mode"] == "appointments"


def test_walk_ins_are_numbered_per_day_move_through_the_queue_and_use_no_slot(client, front_desk, doctor):
    slots_before = len(tomorrow_slots(doctor))
    a = client.post("/api/v1/walk-ins", headers=front_desk, json={"name": "Ravi", "doctor_id": doctor, "phone": "98765 43210"})
    b = client.post("/api/v1/walk-ins", headers=front_desk, json={"name": "Meena", "doctor_id": doctor})
    assert a.status_code == b.status_code == 201
    assert b.json()["number"] == a.json()["number"] + 1 and b.json()["label"] == f"W{b.json()['number']}"
    assert a.json()["phone"] == "+919876543210" and b.json()["phone"] is None
    assert len(tomorrow_slots(doctor)) == slots_before
    url = f"/api/v1/walk-ins/{a.json()['id']}"
    assert client.patch(url, headers=front_desk, json={"action": "done"}).status_code == 409
    assert client.patch(url, headers=front_desk, json={"action": "start"}).json()["status"] == "in_consult"
    assert client.patch(url, headers=front_desk, json={"action": "left"}).status_code == 409
    assert client.patch(url, headers=front_desk, json={"action": "done"}).json()["status"] == "done"
    left = client.patch(f"/api/v1/walk-ins/{b.json()['id']}", headers=front_desk, json={"action": "left"})
    assert left.json()["status"] == "left"
    listed = client.get("/api/v1/walk-ins", headers=front_desk).json()
    assert [w["label"] for w in listed if w["id"] in (a.json()["id"], b.json()["id"])] == [a.json()["label"], b.json()["label"]]
    with SessionLocal() as s:
        s.execute(delete(WalkIn).where(WalkIn.doctor_id == doctor))
        s.commit()


def test_walk_in_rules(client, front_desk, doctor):
    assert client.post("/api/v1/walk-ins", json={"name": "x", "doctor_id": doctor}).status_code == 401
    doc_h, me = login(client, "harini@sunrise.demo")
    assert client.post("/api/v1/walk-ins", headers=doc_h, json={"name": "x", "doctor_id": me["doctor_id"]}).status_code == 403
    w = client.post("/api/v1/walk-ins", headers=front_desk, json={"name": "Mine", "doctor_id": me["doctor_id"]}).json()
    other = client.post("/api/v1/walk-ins", headers=front_desk, json={"name": "Not mine", "doctor_id": doctor}).json()
    assert [x["id"] for x in client.get("/api/v1/walk-ins", headers=doc_h).json()] == [w["id"]]
    assert client.patch(f"/api/v1/walk-ins/{other['id']}", headers=doc_h, json={"action": "start"}).status_code == 403
    assert client.patch(f"/api/v1/walk-ins/{w['id']}", headers=doc_h, json={"action": "start"}).json()["status"] == "in_consult"
    assert client.patch(f"/api/v1/walk-ins/{w['id']}", headers=doc_h, json={"action": "done"}).json()["status"] == "done"
    with SessionLocal() as s:
        s.execute(delete(WalkIn).where(WalkIn.id.in_([w["id"], other["id"]])))
        s.commit()

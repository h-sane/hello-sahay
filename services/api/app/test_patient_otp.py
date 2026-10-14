"""Patient sign-in code and profile: random code, one use, wrong code refused, profile saved for the token's phone."""
import random

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from .db import SessionLocal, init_db
from .main import app
from .models import Patient
from .routers import auth

PHONE = f"+9190000{random.randint(10000, 99999)}"


@pytest.fixture()
def client():
    init_db()
    auth._otps.clear()
    with TestClient(app) as c:
        yield c
    with SessionLocal() as s:
        s.execute(delete(Patient).where(Patient.phone == PHONE))
        s.commit()


def test_otp_then_profile(client):
    sent = client.post("/api/v1/auth/otp/request", json={"phone": PHONE}).json()
    code = sent["demo_code"]
    assert len(code) == 6 and code.isdigit()
    assert client.post("/api/v1/auth/otp/request", json={"phone": PHONE}).status_code == 429  # resend too soon

    wrong = "000000" if code != "000000" else "111111"
    assert client.post("/api/v1/auth/otp/verify", json={"phone": PHONE, "code": wrong}).status_code == 401
    ok = client.post("/api/v1/auth/otp/verify", json={"phone": PHONE, "code": code})
    assert ok.status_code == 200
    assert client.post("/api/v1/auth/otp/verify", json={"phone": PHONE, "code": code}).status_code == 401  # one use

    profile = {"name": "Test Patient", "age": 40, "gender": "male", "village": "Paranur"}
    assert client.put("/api/v1/patients/me", json=profile).status_code == 401
    saved = client.put("/api/v1/patients/me", json=profile,
                       headers={"Authorization": f"Bearer {ok.json()['token']}"})
    assert saved.status_code == 200 and saved.json()["phone"] == PHONE and saved.json()["age"] == 40

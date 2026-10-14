"""Numbers the patient app dials. They live in the server's .env and are never typed into the app or shown on screen."""
import os

from fastapi import APIRouter

router = APIRouter()


@router.get("/config/contacts")
def contacts():
    emergency = os.environ.get("DEMO_EMERGENCY_NUMBER", "").strip()
    return {
        "helpline": os.environ.get("HELPLINE_NUMBER", "04448136970").strip(),
        "emergency": emergency,
        "hospital_call": os.environ.get("DEMO_CALL_NUMBER", "").strip() or emergency,
        "ambulance": "108",
        "national_emergency": "112",
    }

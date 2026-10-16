from datetime import datetime, timezone

from . import notify

APPT = {"patient": {"language": "hi", "phone": "+919876543210"}, "slot": {"start": datetime(2026, 10, 17, 5, 0, tzinfo=timezone.utc)},
        "doctor": {"name": "Dr. Meena"}, "hospital_label": None, "facility": {"name": "Sunrise Nursing Home"}}


def test_text_follows_patient_language_and_names_the_visit():
    text = notify.appointment_text("booking_confirmed", APPT)
    assert "Dr. Meena" in text and "Sunrise Nursing Home" in text and "17 Oct, 10:30 AM" in text
    assert "हेलो सहाय" in text
    assert notify.appointment_text("unknown", APPT) is None


def test_send_goes_to_graph_api_only_when_configured(monkeypatch):
    sent = []
    monkeypatch.setattr(notify.threading, "Thread", lambda target, args, daemon: type("T", (), {"start": lambda s: target(*args)})())
    monkeypatch.setattr(notify.httpx, "post", lambda url, **kw: sent.append((url, kw["json"])) or type("R", (), {"is_success": True})())
    monkeypatch.delenv("WHATSAPP_TOKEN", raising=False)
    notify.send_whatsapp("+919876543210", "booking_confirmed", "hi")
    assert sent == []
    monkeypatch.setenv("WHATSAPP_TOKEN", "t")
    monkeypatch.setenv("WHATSAPP_PHONE_NUMBER_ID", "123")
    notify.send_whatsapp("+919876543210", "booking_confirmed", "hi")
    assert sent == [("https://graph.facebook.com/v21.0/123/messages",
                     {"messaging_product": "whatsapp", "to": "919876543210", "type": "text", "text": {"body": "hi"}})]

import logging
import os
import threading

import httpx

from .common import IST

log = logging.getLogger("sahay.notify")

GRAPH_URL = "https://graph.facebook.com/v21.0/{}/messages"

_TEXT = {
    "booking_confirmed": {
        "en": "Hello Sahay: your visit is booked. {doctor}, {hospital}, {when}. Please arrive 10 minutes early.",
        "hi": "हेलो सहाय: आपकी अपॉइंटमेंट बुक हो गई। {doctor}, {hospital}, {when}। कृपया 10 मिनट पहले पहुँचें।",
        "ta": "ஹலோ சஹாய்: உங்கள் சந்திப்பு பதிவாகிவிட்டது. {doctor}, {hospital}, {when}. 10 நிமிடம் முன்பே வாருங்கள்.",
    },
    "appointment_reschedule": {
        "en": "Hello Sahay: your visit is moved. {doctor}, {hospital}, {when}.",
        "hi": "हेलो सहाय: आपकी अपॉइंटमेंट बदल गई। {doctor}, {hospital}, {when}।",
        "ta": "ஹலோ சஹாய்: உங்கள் சந்திப்பு மாற்றப்பட்டது. {doctor}, {hospital}, {when}.",
    },
    "appointment_cancel": {
        "en": "Hello Sahay: your visit with {doctor}, {when} is cancelled.",
        "hi": "हेलो सहाय: {doctor} के साथ {when} की अपॉइंटमेंट रद्द हो गई।",
        "ta": "ஹலோ சஹாய்: {doctor} உடன் {when} சந்திப்பு ரத்தாகிவிட்டது.",
    },
}


def appointment_text(template: str, appt: dict) -> str | None:
    """The patient-language message for a booking, reschedule or cancel; None for a template with no text."""
    texts = _TEXT.get(template)
    if texts is None:
        return None
    start = appt["slot"]["start"].astimezone(IST)
    return texts.get(appt["patient"]["language"] or "en", texts["en"]).format(
        doctor=appt["doctor"]["name"], hospital=appt["hospital_label"] or appt["facility"]["name"],
        when=f"{start:%d %b, %I:%M %p}")


def _send(phone: str, text: str, token: str, phone_number_id: str) -> None:
    try:
        res = httpx.post(GRAPH_URL.format(phone_number_id), timeout=10, headers={"Authorization": f"Bearer {token}"},
                         json={"messaging_product": "whatsapp", "to": phone.lstrip("+"), "type": "text",
                               "text": {"body": text}})
        if res.is_success:
            log.info("whatsapp sent -> ***%s", phone[-4:])
        else:
            log.warning("whatsapp failed -> ***%s: %s", phone[-4:], res.text[:300])
    except httpx.HTTPError as e:
        log.warning("whatsapp failed -> ***%s: %s", phone[-4:], e)


def send_whatsapp(phone: str, template: str, text: str | None = None, **params) -> None:
    """WhatsApp Cloud API text message, sent on a background thread so a booking never waits on Meta.

    Free on the Meta test number to the (up to 5) verified recipients who messaged it in the last 24 hours;
    with no token configured it only logs.
    """
    token, phone_number_id = os.getenv("WHATSAPP_TOKEN"), os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    if not (token and phone_number_id and text):
        log.info("whatsapp skipped -> ***%s [%s] %s", phone[-4:], template, params)
        return
    threading.Thread(target=_send, args=(phone, text, token, phone_number_id), daemon=True).start()

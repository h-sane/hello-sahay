import logging

log = logging.getLogger("sahay.notify")


def send_whatsapp(phone: str, template: str, **params) -> None:
    """Stub: P1-8 replaces the body with the WhatsApp Cloud API call."""
    log.info("whatsapp stub -> ***%s [%s] %s", phone[-4:], template, params)

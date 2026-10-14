"""Timeline of one call. Saved with the call record (call.trace, GET /calls/{id}/trace) and echoed to the service log."""
import json
import logging
import time

log = logging.getLogger("sahay.trace")
MAX_EVENTS = 3000  # a long call stays well under this; the cap only stops a runaway loop filling the database
MAX_TEXT = 400


def _clip(v):
    if isinstance(v, str) and len(v) > MAX_TEXT:
        return v[:MAX_TEXT] + "…"
    return v


class Trace:
    def __init__(self, call_id: str):
        self.call_id = call_id
        self._t0 = time.monotonic()
        self.events: list[dict] = []

    def add(self, ev: str, **data) -> None:
        if len(self.events) >= MAX_EVENTS:
            return
        event = {"t": round(time.monotonic() - self._t0, 3), "ev": ev, **{k: _clip(v) for k, v in data.items()}}
        self.events.append(event)
        log.info("call %s %s", self.call_id, json.dumps(event, ensure_ascii=False, default=str))

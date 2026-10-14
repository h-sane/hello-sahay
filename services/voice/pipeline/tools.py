"""Bedrock tools. Each one calls the backend API over HTTP; the model never sees anything else.

The department comes from the fixed keyword table (data/seed/department_keywords.csv), not from the model.
"""
import csv
import difflib
import json
import logging
import time
from datetime import datetime, timedelta, timezone

import httpx

from . import config
from .gate import REPLIES, check

log = logging.getLogger("sahay.tools")
IST = timezone(timedelta(hours=5, minutes=30))
DEFAULT_DEPARTMENT = "General Medicine"
DEFAULT_PLACE = (12.6830, 79.9770)  # Chengalpattu town centre


def _rows(path):
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(line for line in f if not line.startswith("#")))


_KEYWORDS = sorted(
    ((r["keyword"].strip().lower(), r["department"].strip())
     for r in _rows(config.ROOT / "data" / "seed" / "department_keywords.csv")),
    key=lambda kd: len(kd[0]), reverse=True)
_PLACES = [(r["name"].lower(), float(r["lat"]), float(r["lng"]))
           for r in _rows(config.ROOT / "services" / "voice" / "pipeline" / "villages.csv")]


def department_for(reason: str) -> str:
    text = reason.lower()
    return next((dept for kw, dept in _KEYWORDS if kw in text), DEFAULT_DEPARTMENT)


def place_for(village: str) -> tuple[float, float]:
    """Speech-to-text mangles village names ("Singa Pumalcoil"), so match on letters only and allow near misses."""
    squash = lambda s: "".join(c for c in s.lower() if c.isalpha())
    v = squash(village)
    names = {squash(name): (lat, lng) for name, lat, lng in _PLACES}
    for name, coords in names.items():
        if v and (name in v or v in name):
            return coords
    close = difflib.get_close_matches(v, names, n=1, cutoff=0.7)
    return names[close[0]] if close else DEFAULT_PLACE


def when(iso: str) -> str:
    return datetime.fromisoformat(iso).astimezone(IST).strftime("%A %d %B, %I:%M %p")


def _obj(props: dict, required: list[str]) -> dict:
    return {"json": {"type": "object", "properties": props, "required": required}}


_S = {"type": "string"}
TOOL_SPECS = [
    {"toolSpec": {
        "name": "find_facilities",
        "description": "Find nearby hospitals for the caller's village and reason. Government facilities come first.",
        "inputSchema": _obj({"village": {**_S, "description": "Village or town the caller is in"},
                             "reason": {**_S, "description": "Reason for the visit in the caller's own words"},
                             "scheme": {"type": "string", "enum": ["pmjay", "cmchis"],
                                        "description": "Only if the caller has this scheme card"}},
                            ["village", "reason"])}},
    {"toolSpec": {
        "name": "get_slots",
        "description": "Open appointment slots. Only partner facilities (is_partner true) have slots.",
        "inputSchema": _obj({"facility_id": {"type": "integer"},
                             "department": {**_S, "description": "The department returned by find_facilities"},
                             "date": {**_S, "description": "YYYY-MM-DD; leave out for the next available days"}},
                            ["facility_id", "department"])}},
    {"toolSpec": {
        "name": "book_appointment",
        "description": "Book a slot after the caller confirmed the details.",
        "inputSchema": _obj({"slot_id": {"type": "integer"}, "name": _S,
                             "phone": {**_S, "description": "10-digit mobile number"},
                             "village": _S, "reason_text": {**_S, "description": "Caller's own words"}},
                            ["slot_id", "name", "phone", "village", "reason_text"])}},
    {"toolSpec": {
        "name": "check_scheme_coverage",
        "description": "Whether a facility accepts PM-JAY and CMCHIS.",
        "inputSchema": _obj({"facility_id": {"type": "integer"}}, ["facility_id"])}},
    {"toolSpec": {
        "name": "handoff_to_human",
        "description": "Put the call in the human queue when you cannot help or the caller asks for a person.",
        "inputSchema": _obj({"reason": _S}, ["reason"])}},
    {"toolSpec": {
        "name": "emergency_redirect",
        "description": "Call this if the caller describes a medical emergency. Then say the returned text exactly.",
        "inputSchema": _obj({}, [])}},
]


class Tools:
    def __init__(self, http: httpx.AsyncClient, lang: str, state: dict):
        self.http, self.lang, self.state = http, lang, state
        self.facts: list[str] = []  # every tool result, so replies can be checked against them

    async def call(self, name: str, args: dict) -> dict:
        fn = getattr(self, "t_" + name, None)
        if fn is None:
            return {"error": f"unknown tool {name}"}
        t0 = time.perf_counter()
        try:
            out = await fn(**args)
        except httpx.HTTPStatusError as e:
            out = {"error": f"api_{e.response.status_code}", "detail": e.response.text[:200]}
        except TypeError as e:
            out = {"error": f"bad arguments: {e}"}
        log.info("tool %s took %d ms", name, (time.perf_counter() - t0) * 1000)
        self.facts.append(json.dumps(out, ensure_ascii=False))
        return out

    async def t_find_facilities(self, village: str, reason: str, scheme: str | None = None) -> dict:
        lat, lng = place_for(village)
        department = department_for(reason)
        params = {"lat": lat, "lng": lng, "department": department, "limit": 30}
        if scheme:
            params["scheme"] = scheme
        r = await self.http.get("/facilities", params=params)
        r.raise_for_status()
        self.state.update(village=village, reason=reason, department=department)
        rows = r.json()
        # Nearest two government options (free) plus the nearest two partners, the only ones with bookable slots.
        picked = [f for f in rows if f["is_government"]][:2] + [f for f in rows if f["is_partner"]][:2]
        keep = ("id", "name", "type", "address", "phone", "hours", "distance_km",
                "is_government", "is_partner", "pmjay", "cmchis")
        found = [{**{k: f[k] for k in keep}, "can_book": f["is_partner"]} for f in picked]
        if found:
            self.state.setdefault("facility_id", found[0]["id"])
        return {"department": department, "facilities": found}

    async def t_get_slots(self, facility_id: int, department: str, date: str | None = None) -> dict:
        today = datetime.now(IST).date()
        days = [date] if date else [(today + timedelta(days=i)).isoformat() for i in range(3)]
        for day in days:
            r = await self.http.get(f"/facilities/{facility_id}/slots", params={"date": day, "department": department})
            if r.status_code == 404:
                return {"slots": [], "note": "This facility has no bookable slots; give its address and phone instead."}
            r.raise_for_status()
            if r.json():
                self.state["facility_id"] = facility_id
                return {"slots": [{"slot_id": s["slot_id"], "when": when(s["start"]), "doctor": s["doctor_name"]}
                                  for s in r.json()[:4]]}
        return {"slots": []}

    async def t_book_appointment(self, slot_id: int, name: str, phone: str, village: str, reason_text: str) -> dict:
        body = {"patient": {"name": name, "phone": phone, "language": self.lang, "village": village},
                "slot_id": slot_id, "source": "helpline", "reason_text": reason_text}
        r = await self.http.post("/appointments", json=body)
        if r.status_code == 409:
            return {"error": "slot_taken", "say": "That slot was just taken; offer another slot."}
        if r.status_code == 422:
            return {"error": "invalid_details", "say": "The phone number or name was not valid; ask again."}
        r.raise_for_status()
        a = r.json()
        self.state.update(appointment_id=a["id"], phone=a["patient"]["phone"], name=name, facility_id=a["facility"]["id"])
        return {"appointment_id": a["id"], "facility": a["facility"]["name"], "address": a["facility"]["address"],
                "doctor": a["doctor"]["name"], "when": when(a["slot"]["start"])}

    async def t_check_scheme_coverage(self, facility_id: int) -> dict:
        r = await self.http.get("/facilities", params={"limit": 100})
        r.raise_for_status()
        f = next((f for f in r.json() if f["id"] == facility_id), None)
        return {"error": "not_found"} if f is None else {"name": f["name"], "pmjay": f["pmjay"], "cmchis": f["cmchis"]}

    async def t_handoff_to_human(self, reason: str) -> dict:
        self.state.update(handoff=True, handoff_reason=reason)
        return {"status": "queued", "say": "Tell the caller a person from the team will call them back."}

    async def t_emergency_redirect(self) -> dict:
        # the deterministic gate decides emergencies; a model judgement alone must not end a call
        text = self.state.get("last_text", "")
        if not any(check(text, lang).flag == "emergency" for lang in REPLIES["emergency"]):
            return {"status": "not_an_emergency", "say": "The safety check found no emergency. Do not mention one; continue the booking steps."}
        self.state["emergency"] = True
        return {"say_exactly": REPLIES["emergency"][self.lang]}

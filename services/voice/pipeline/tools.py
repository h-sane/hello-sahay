"""Bedrock tools. Each one calls the backend API over HTTP; the model never sees anything else.

The department comes from the fixed keyword table (data/seed/department_keywords.csv), not from the model.
"""
import asyncio
import csv
import difflib
import json
import logging
import math
import time
from datetime import datetime, timedelta, timezone

import httpx

from . import config
from .gate import REPLIES, check

log = logging.getLogger("sahay.tools")
IST = timezone(timedelta(hours=5, minutes=30))
DEFAULT_DEPARTMENT = "General Medicine"
DEFAULT_PLACE = (12.6830, 79.9770)  # Chengalpattu town centre
SLOT_DAYS = 7  # how far ahead a caller's doctor or time wish is searched
TIME_WINDOW_MIN = 45  # a slot this close to the preferred time counts as that time


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


def _squash(s: str) -> str:
    return "".join(c for c in s.lower() if c.isalpha())


def best_match(query: str, names: list[str], cutoff: float = 0.6) -> str | None:
    """Speech-to-text mangles names ("Singa Pumalcoil"), so compare letters only and allow near misses."""
    q = _squash(query)
    by_key = {_squash(n): n for n in names}
    hit = next((n for k, n in by_key.items() if q and (q in k or k in q)), None)
    if hit:
        return hit
    close = difflib.get_close_matches(q, by_key, n=1, cutoff=cutoff)
    return by_key[close[0]] if close else None


def place_for(village: str) -> tuple[float, float]:
    names = {_squash(name): (lat, lng) for name, lat, lng in _PLACES}
    v = _squash(village)
    for name, coords in names.items():
        if v and (name in v or v in name):
            return coords
    close = difflib.get_close_matches(v, names, n=1, cutoff=0.7)
    return names[close[0]] if close else DEFAULT_PLACE


def nearest_place(lat: float, lng: float, within_km: float = 25.0) -> str | None:
    """Closest known village or town, used to confirm a live location out loud."""
    def km(p):
        return math.hypot((p[1] - lat) * 111, (p[2] - lng) * 111 * math.cos(math.radians(lat)))
    best = min(_PLACES, key=km, default=None)
    return best[0].title() if best and km(best) <= within_km else None


def when(iso: str) -> str:
    return datetime.fromisoformat(iso).astimezone(IST).strftime("%A %d %B, %I:%M %p")


def _obj(props: dict, required: list[str]) -> dict:
    return {"json": {"type": "object", "properties": props, "required": required}}


_S = {"type": "string"}
TOOL_SPECS = [
    {"toolSpec": {
        "name": "find_facilities",
        "description": "Find the nearest hospital for the caller's location and reason. Returns one recommended "
                       "bookable hospital and, if different, the nearest free government facility.",
        "inputSchema": _obj({"village": {**_S, "description": "Village or town the caller said; leave out when use_live_location is true"},
                             "use_live_location": {"type": "boolean",
                                                   "description": "True once the caller confirmed the live location from the app"},
                             "reason": {**_S, "description": "Reason for the visit in the caller's own words"},
                             "hospital_name": {**_S, "description": "Only if the caller asked for a specific hospital"},
                             "scheme": {"type": "string", "enum": ["pmjay", "cmchis"],
                                        "description": "Only if the caller has this scheme card"}},
                            ["reason"])}},
    {"toolSpec": {
        "name": "get_slots",
        "description": "Open appointment slots at a partner facility, honouring a preferred doctor and time. "
                       "The result field says how well the request matched.",
        "inputSchema": _obj({"facility_id": {"type": "integer"},
                             "department": {**_S, "description": "The department returned by find_facilities"},
                             "doctor_name": {**_S, "description": "Preferred doctor, only if the caller named one"},
                             "preferred_time": {**_S, "description": "Preferred time as 24-hour HH:MM, only if the caller gave one"},
                             "date": {**_S, "description": "YYYY-MM-DD, only if the caller asked for a particular day"}},
                            ["facility_id", "department"])}},
    {"toolSpec": {
        "name": "book_appointment",
        "description": "Book a slot after the caller confirmed it. The phone number is taken from the call when known.",
        "inputSchema": _obj({"slot_id": {"type": "integer"}, "name": _S,
                             "phone": {**_S, "description": "10-digit mobile number; only when the call did not provide it"},
                             "village": _S, "reason_text": {**_S, "description": "Caller's own words"}},
                            ["slot_id", "name", "village", "reason_text"])}},
    {"toolSpec": {
        "name": "check_scheme_coverage",
        "description": "Whether a facility accepts PM-JAY and CMCHIS.",
        "inputSchema": _obj({"facility_id": {"type": "integer"}}, ["facility_id"])}},
    {"toolSpec": {
        "name": "set_language",
        "description": "Switch the rest of the call to the language the caller asked for.",
        "inputSchema": _obj({"language": {"type": "string", "enum": ["en", "hi", "ta"]}}, ["language"])}},
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
    def __init__(self, http: httpx.AsyncClient, lang: str, state: dict, on_language=None):
        self.http, self.lang, self.state = http, lang, state
        self.on_language = on_language  # set only when the call detects its language and may switch it
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

    async def t_find_facilities(self, reason: str, village: str | None = None, use_live_location: bool = False,
                                hospital_name: str | None = None, scheme: str | None = None) -> dict:
        profile = self.state.get("profile") or {}
        if use_live_location and profile.get("live"):
            lat, lng, village = profile["lat"], profile["lng"], profile.get("place") or "your location"
        else:
            village = village or ""
            if not village.strip():
                return {"error": "location_needed", "say": "Ask the caller for their village or town first."}
            lat, lng = place_for(village)
        department = department_for(reason)
        params = {"lat": lat, "lng": lng, "limit": 100}
        if scheme:
            params["scheme"] = scheme
        r = await self.http.get("/facilities", params=params)
        r.raise_for_status()
        rows = r.json()
        self.state.update(village=village, reason=reason, department=department)
        keep = ("id", "name", "type", "address", "phone", "hours", "distance_km",
                "is_government", "is_partner", "pmjay", "cmchis")
        view = lambda f: {**{k: f[k] for k in keep}, "can_book": f["is_partner"]}
        if hospital_name:
            name = best_match(hospital_name, [f["name"] for f in rows])
            chosen = next((f for f in rows if f["name"] == name), None)
            if chosen is None:
                return {"department": department, "error": "no hospital with that name; offer the recommended one"}
            self.state["facility_id"] = chosen["id"]
            return {"department": department, "recommended": view(chosen)}
        in_dept = [f for f in rows if department.lower() in {d.lower() for d in f["departments"]}] or rows
        far = float("inf")
        # Free government options first (safety rule), then nearest.
        best = min((f for f in in_dept if f["is_partner"]),
                   key=lambda f: (not f["is_government"], f["distance_km"] if f["distance_km"] is not None else far),
                   default=None)
        free = next((f for f in in_dept if f["is_government"]), None)
        out: dict = {"department": department}
        if best:
            out["recommended"] = view(best)
            self.state["facility_id"] = best["id"]
        if free and (best is None or free["id"] != best["id"]):
            out["free_government_option"] = view(free)
        return out

    async def t_get_slots(self, facility_id: int, department: str, doctor_name: str | None = None,
                          preferred_time: str | None = None, date: str | None = None) -> dict:
        today = datetime.now(IST).date()
        days = [date] if date else [(today + timedelta(days=i)).isoformat() for i in range(SLOT_DAYS)]

        async def one(day: str) -> list[dict]:
            r = await self.http.get(f"/facilities/{facility_id}/slots", params={"date": day, "department": department})
            if r.status_code == 404:
                return []
            r.raise_for_status()
            return r.json()

        slots = sorted((s for day in await asyncio.gather(*(one(d) for d in days)) for s in day),
                       key=lambda s: s["start"])
        if not slots:
            return {"result": "none", "slots": [],
                    "note": "No open slots in the next days; give the facility's address and phone instead."}
        self.state["facility_id"] = facility_id
        local = lambda s: datetime.fromisoformat(s["start"]).astimezone(IST)
        pool, result, doctor = slots, "any", None
        if doctor_name:
            name = doctor_name.replace("Dr.", "").replace("Dr ", "")
            doctor = best_match(name, sorted({s["doctor_name"] for s in slots}))
            pool = [s for s in slots if s["doctor_name"] == doctor] if doctor else slots
            result = "next_for_doctor" if doctor else "other_doctor"
        if preferred_time:
            try:
                h, m = (int(x) for x in preferred_time.split(":")[:2])
            except ValueError:
                h = m = None
            if h is not None:
                want = h * 60 + m
                mins = lambda s: local(s).hour * 60 + local(s).minute
                first_day = local(pool[0]).date()
                near = [s for s in pool if local(s).date() == first_day and abs(mins(s) - want) <= TIME_WINDOW_MIN]
                if near:  # the wish is free
                    pool = sorted(near, key=lambda s: abs(mins(s) - want))
                    result = "exact" if doctor or not doctor_name else "other_doctor"
                else:  # nothing near that time: the next slots at or after it, else the earliest
                    later = [s for s in pool if (local(s).date(), mins(s)) >= (first_day, want)]
                    pool = later or pool
        elif result == "next_for_doctor":
            result = "exact"  # a doctor was asked for with no time wish: their earliest slots are the answer
        out = {"result": result,
               "slots": [{"slot_id": s["slot_id"], "when": when(s["start"]), "doctor": s["doctor_name"]}
                         for s in pool[:2]]}
        if doctor_name and not doctor:
            out["note"] = f"{doctor_name} has no open slot; these are other doctors' slots."
        return out

    async def t_book_appointment(self, slot_id: int, name: str, village: str, reason_text: str,
                                 phone: str | None = None) -> dict:
        phone = self.state.get("phone") or phone  # the number the call came from beats a dictated one
        if not phone:
            return {"error": "invalid_details", "say": "The phone number is missing; ask for it."}
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

    async def t_set_language(self, language: str) -> dict:
        if self.on_language is None or language not in ("en", "hi", "ta"):
            return {"error": "language cannot be changed on this call"}
        self.on_language(language)
        return {"language": language, "say": "Answer from now on in the new language."}

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

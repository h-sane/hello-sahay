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
NEARBY_TIMEOUT_S = 25  # the first real-hospital lookup for an area goes to OpenStreetMap; later ones are cached
GOVERNMENT_KINDS = ("government", "phc")


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
        "description": "Find the nearest real hospital for the caller's location and reason. Returns the recommended "
                       "hospital and, if different, the nearest free government hospital. Every hospital it returns "
                       "can be booked.",
        "inputSchema": _obj({"village": {**_S, "description": "Village or town the caller said; leave out when use_live_location is true"},
                             "use_live_location": {"type": "boolean",
                                                   "description": "True once the caller confirmed the live location from the app"},
                             "reason": {**_S, "description": "Reason for the visit in the caller's own words"},
                             "hospital_name": {**_S, "description": "Only if the caller asked for a specific hospital, exactly as they said it"},
                             "scheme": {"type": "string", "enum": ["pmjay", "cmchis"],
                                        "description": "Only if the caller has this scheme card"}},
                            ["reason"])}},
    {"toolSpec": {
        "name": "get_slots",
        "description": "Open appointment slots at a partner facility, honouring a preferred doctor and time. "
                       "The result field says how well the request matched.",
        "inputSchema": _obj({"facility_id": {"type": "integer"},
                             "department": {**_S, "description": "The department returned by find_facilities"},
                             "doctor_name": {**_S, "description": "Preferred doctor, only if the caller named one; it is a preference, not a requirement"},
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

    async def _nearby(self, lat: float, lng: float) -> list[dict]:
        """Real hospitals around a point (OpenStreetMap through the API), nearest first; [] when the lookup fails."""
        try:
            r = await self.http.get("/places/nearby-hospitals", params={"lat": lat, "lng": lng, "limit": 6},
                                    timeout=NEARBY_TIMEOUT_S)
            r.raise_for_status()
            return r.json()
        except (httpx.HTTPError, ValueError):
            log.warning("nearby hospital lookup failed", exc_info=True)
            return []

    async def t_find_facilities(self, reason: str, village: str | None = None, use_live_location: bool = False,
                                hospital_name: str | None = None, scheme: str | None = None) -> dict:
        """Name the real nearest hospital; the booking behind it goes to the one demo hospital (Sahay Desk).

        Demo wiring: whichever hospital the caller hears or asks for, every slot, doctor and booking is the demo
        hospital's, so the demo Desk shows all of it. Real data stops at the hospital's name, distance and address.
        """
        profile = self.state.get("profile") or {}
        if use_live_location and profile.get("live"):
            lat, lng, village = profile["lat"], profile["lng"], profile.get("place") or "your location"
        else:
            village = village or ""
            if not village.strip():
                return {"error": "location_needed", "say": "Ask the caller for their village or town first."}
            lat, lng = place_for(village)
        department = department_for(reason)
        hospitals = await self._nearby(lat, lng)
        demo_id = next((h["book_facility_id"] for h in hospitals if h.get("book_facility_id")), None)
        if demo_id is None:  # lookup down or empty: fall back to the demo hospital under its own name
            r = await self.http.get("/facilities", params={"limit": 100})
            r.raise_for_status()
            demo = min((f for f in r.json() if f["is_partner"]), key=lambda f: f["id"], default=None)
            if demo is None:
                return {"department": department, "error": "no hospital can take bookings right now; offer a callback"}
            demo_id = demo["id"]
            hospitals = [{"name": demo["name"], "address": demo["address"], "kind": "private", "distance_km": None}]
        self.state.update(village=village, reason=reason, department=department, facility_id=demo_id)

        def view(h: dict) -> dict:
            return {"id": demo_id, "name": h["name"], "address": h.get("address") or "", "distance_km": h.get("distance_km"),
                    "is_government": h.get("kind") in GOVERNMENT_KINDS, "can_book": True,
                    "pmjay": bool(h.get("pmjay")), "cmchis": bool(h.get("cmchis"))}

        if hospital_name:  # a hospital the caller named is accepted as said, even if it is not on the list
            name = best_match(hospital_name, [h["name"] for h in hospitals])
            chosen = next((h for h in hospitals if h["name"] == name),
                          {"name": hospital_name.strip(), "address": "", "distance_km": None, "kind": "hospital"})
            self.state.update(hospital=chosen["name"], hospital_address=chosen.get("address") or "")
            return {"department": department, "recommended": view(chosen)}
        best = hospitals[0]
        self.state.update(hospital=best["name"], hospital_address=best.get("address") or "")
        out: dict = {"department": department, "recommended": view(best)}
        free = next((h for h in hospitals if h.get("kind") in GOVERNMENT_KINDS), None)
        if free and free["name"] != best["name"]:  # free government options are shown before private ones
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
            # A doctor the caller names is a preference. If that doctor is not here the caller is never told so:
            # the slots of whoever is free are offered instead.
            name = doctor_name.replace("Dr.", "").replace("Dr ", "")
            doctor = best_match(name, sorted({s["doctor_name"] for s in slots}))
            if doctor:
                pool, result = [s for s in slots if s["doctor_name"] == doctor], "next_for_doctor"
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
                    result = "exact"
                else:  # nothing near that time: the next slots at or after it, else the earliest
                    later = [s for s in pool if (local(s).date(), mins(s)) >= (first_day, want)]
                    pool = later or pool
        elif result == "next_for_doctor":
            result = "exact"  # a doctor was asked for with no time wish: their earliest slots are the answer
        out = {"result": result,
               "slots": [{"slot_id": s["slot_id"], "when": when(s["start"]), "doctor": s["doctor_name"]}
                         for s in pool[:2]]}
        return out

    async def t_book_appointment(self, slot_id: int, name: str, village: str, reason_text: str,
                                 phone: str | None = None) -> dict:
        phone = self.state.get("phone") or phone  # the number the call came from beats a dictated one
        if not phone:
            return {"error": "invalid_details", "say": "The phone number is missing; ask for it."}
        body = {"patient": {"name": name, "phone": phone, "language": self.lang, "village": village},
                "slot_id": slot_id, "source": "helpline", "reason_text": reason_text,
                "hospital_name": self.state.get("hospital")}
        r = await self.http.post("/appointments", json=body)
        if r.status_code == 409:
            return {"error": "slot_taken", "say": "That slot was just taken; offer another slot."}
        if r.status_code == 422:
            return {"error": "invalid_details", "say": "The phone number or name was not valid; ask again."}
        r.raise_for_status()
        a = r.json()
        self.state.update(appointment_id=a["id"], phone=a["patient"]["phone"], name=name, facility_id=a["facility"]["id"])
        # The caller was told the real hospital's name; the booking itself sits at the demo hospital's Desk.
        return {"appointment_id": a["id"], "facility": self.state.get("hospital") or a["facility"]["name"],
                "address": self.state.get("hospital_address") or a["facility"]["address"],
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

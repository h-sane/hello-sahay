"""Bedrock tools. Each one calls the backend API over HTTP; the model never sees anything else.

The department comes from the fixed keyword table (data/seed/department_keywords.csv), not from the model.
The model only reads the caller's severity; what is offered for it (clinics, hospitals, information only) is fixed here.
"""
import asyncio
import csv
import difflib
import json
import logging
import math
import re
import time
from datetime import datetime, timedelta, timezone

import httpx

from . import config

log = logging.getLogger("sahay.tools")
IST = timezone(timedelta(hours=5, minutes=30))
DEFAULT_DEPARTMENT = "General Medicine"
NEARBY_KM = 3  # prototype: the clinics (their demo distances) and the hospitals offered are the ones this close
OFFERED = 3  # how many clinics or hospitals are named in one answer
SHOW_FOR = {"mild": "clinics", "moderate": "hospitals", "serious": "hospitals"}  # what each severity is offered first
SHOWS = ("clinics", "hospitals", "free_government")
NOT_NAMES = {"", "anonymous", "unknown", "patient", "caller", "user", "na", "none", "name", "notgiven"}
# A whole city or state is no place to find a hospital near; the caller must name an area in it.
GENERIC_AREAS = {"chennai", "madras", "tamilnadu", "kerala", "karnataka", "andhrapradesh", "telangana", "india",
                 "bangalore", "bengaluru", "hyderabad", "coimbatore", "madurai"}
SLOTS_OFFERED = 3  # slots read out in one answer
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


def place_for(village: str, cutoff: float = 0.7) -> tuple[float, float] | None:
    """Coordinates of a place in the local table, or None: the caller's area is then looked up on OpenStreetMap."""
    names = {_squash(name): (lat, lng) for name, lat, lng in _PLACES}
    v = _squash(village)
    for name, coords in names.items():
        if v and (name in v or v in name):
            return coords
    close = difflib.get_close_matches(v, names, n=1, cutoff=cutoff)
    return names[close[0]] if close else None


def nearest_place(lat: float, lng: float, within_km: float = 25.0) -> str | None:
    """Closest known village or town, used to confirm a live location out loud."""
    def km(p):
        return math.hypot((p[1] - lat) * 111, (p[2] - lng) * 111 * math.cos(math.radians(lat)))
    best = min(_PLACES, key=km, default=None)
    return best[0].title() if best and km(best) <= within_km else None


def when(iso: str) -> str:
    return datetime.fromisoformat(iso).astimezone(IST).strftime("%A %d %B, %I:%M %p")


def calendar() -> tuple[str, str]:
    """Today and the next week with their dates, so the model can turn "Friday" into a date for get_slots."""
    today = datetime.now(IST).date()
    days = [today + timedelta(days=i) for i in range(1, 8)]
    return today.strftime("%A %Y-%m-%d"), ", ".join(d.strftime("%A %Y-%m-%d") for d in days)


_ADDRESS_NOISE = re.compile(r"^(india|tamil nadu|kerala|karnataka|telangana|andhra pradesh|\d{6}|.*metropolitan area|.*district)$", re.I)


def short_address(address: str, parts: int = 3) -> str:
    """The first few meaningful parts of an OpenStreetMap address: no pincode, district, state or country."""
    kept: list[str] = []
    for part in (p.strip() for p in (address or "").split(",")):
        if part and not _ADDRESS_NOISE.match(part) and part.lower() not in (k.lower() for k in kept):
            kept.append(part)
    return ", ".join(kept[:parts])


def distance_text(km) -> str | None:
    """"800 metres" under a kilometre, otherwise "2.4 km": said as written, so the reply stays checkable against the tool."""
    if km is None:
        return None
    return f"{round(km * 20) * 50} metres" if km < 1 else f"{km:g} km"


def _obj(props: dict, required: list[str]) -> dict:
    return {"json": {"type": "object", "properties": props, "required": required}}


_S = {"type": "string"}
TOOL_SPECS = [
    {"toolSpec": {
        "name": "find_facilities",
        "description": "Places for the caller's reason and location. mild: partner clinics (bookable); moderate: the nearest "
                       "hospitals; serious: the nearest hospital to go to now (information only). Government hospitals are "
                       "never bookable. Use show to switch lists when the caller asks, and hospital_name when they pick a place.",
        "inputSchema": _obj({"reason": {**_S, "description": "Reason for the visit in English, in the caller's meaning (translate it), e.g. \"mild fever and headache\""},
                             "severity": {"type": "string", "enum": ["mild", "moderate", "serious"],
                                          "description": "Your reading of how urgent the caller's words are; not a diagnosis"},
                             "village": {**_S, "description": "Specific area, village or landmark the caller said, written in English letters, exactly the place the caller said (never guess one); leave out when use_live_location is true"},
                             "use_live_location": {"type": "boolean",
                                                   "description": "True once the caller confirmed the live location from the app"},
                             "show": {"type": "string", "enum": list(SHOWS),
                                      "description": "Only when the caller asks for clinics, hospitals or only the free government hospitals"},
                             "hospital_name": {**_S, "description": "Only when the caller picked or asked for a specific hospital or clinic: the name as listed by this tool (English letters), or as the caller said it if it was never listed"}},
                            ["reason", "severity"])}},
    {"toolSpec": {
        "name": "get_slots",
        "description": "Open appointment slots at a bookable place from find_facilities, honouring a preferred doctor and time. "
                       "The result field says how well the request matched.",
        "inputSchema": _obj({"facility_id": {"type": "integer"},
                             "department": {**_S, "description": "The department in the chosen place's entry from find_facilities"},
                             "doctor_name": {**_S, "description": "Preferred doctor, only if the caller named one; it is a preference, not a requirement"},
                             "preferred_time": {**_S, "description": "Preferred time as 24-hour HH:MM, only if the caller gave one"},
                             "date": {**_S, "description": "YYYY-MM-DD, only if the caller asked for a particular day"},
                             "avoid_dates": {"type": "array", "items": _S,
                                             "description": "YYYY-MM-DD days the caller ruled out (\"not Thursday\"); they stay ruled out"}},
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
        "inputSchema": _obj({"language": {"type": "string", "enum": ["en", "hi", "ta", "ml", "kn", "te"]}}, ["language"])}},
    {"toolSpec": {
        "name": "handoff_to_human",
        "description": "Put the call in the human queue when you cannot help or the caller asks for a person.",
        "inputSchema": _obj({"reason": _S}, ["reason"])}},
]


def _spread(pool: list[dict], local, even: bool, n: int = SLOTS_OFFERED) -> list[dict]:
    """The slots to read out: when nothing narrows the choice, the earliest on each of the first days, so the caller
    hears more than one day; otherwise simply the first few."""
    if not even:
        return pool[:n]
    first_each = list({local(s).date(): s for s in reversed(pool)}.values())[::-1][:n]
    rest = [s for s in pool if s not in first_each]
    return sorted((first_each + rest)[:n], key=lambda s: s["start"])


class Tools:
    def __init__(self, http: httpx.AsyncClient, lang: str, state: dict, on_language=None):
        self.http, self.lang, self.state = http, lang, state
        self.on_language = on_language  # set only when the call detects its language and may switch it
        self.facts: list[str] = []  # every tool result, so replies can be checked against them
        self._listed: dict[str, dict] = {}  # places named to the caller so far, by name
        self._clinic_by_id: dict[int, dict] = {}
        self._told: set[tuple] = set()  # (list kind, area) already read to the caller

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

    async def _nearby(self, lat: float, lng: float, limit: int = 6) -> list[dict]:
        """Real hospitals around a point (OpenStreetMap through the API), nearest first; [] when the lookup fails."""
        try:
            r = await self.http.get("/places/nearby-hospitals", params={"lat": lat, "lng": lng, "limit": limit},
                                    timeout=NEARBY_TIMEOUT_S)
            r.raise_for_status()
            return r.json()
        except (httpx.HTTPError, ValueError):
            log.warning("nearby hospital lookup failed", exc_info=True)
            return []

    async def _clinics(self, lat: float, lng: float, department: str) -> list[dict]:
        """The partner clinics within NEARBY_KM, nearest first; clinics that run the department come first.

        Prototype wiring: each seeded clinic has a fixed distance from any caller (facility.demo_distance_km), so the
        same few clinics are near wherever the call comes from, and their seeded street address is not spoken.
        """
        try:
            r = await self.http.get("/facilities", params={"lat": lat, "lng": lng, "kind": "clinic", "partner_only": "true",
                                                           "max_km": NEARBY_KM, "nearest_first": "true", "use_demo_distance": "true", "limit": 10})
            r.raise_for_status()
            rows = sorted(r.json(), key=lambda f: department not in f["departments"])
        except (httpx.HTTPError, ValueError):
            log.warning("clinic lookup failed", exc_info=True)
            return []
        out = []
        for f in rows[:OFFERED]:
            v = {"id": f["id"], "name": f["name"], "address": "", "distance_km": f["distance_km"],
                 "distance_text": distance_text(f["distance_km"]),
                 "is_government": False, "can_book": True,
                 "department": department if department in f["departments"] else DEFAULT_DEPARTMENT}
            self._listed[f["name"]] = self._clinic_by_id[f["id"]] = v
            out.append(v)
        return out

    def _view(self, h: dict, bookable_id: int | None, department: str) -> dict:
        """A real hospital as the model sees it. Government ones, and every one in an emergency, are information only."""
        gov = h.get("kind") in GOVERNMENT_KINDS
        v = {"name": h["name"], "address": short_address(h.get("address") or ""), "distance_km": h.get("distance_km"),
             "distance_text": distance_text(h.get("distance_km")),
             "is_government": gov, "pmjay": bool(h.get("pmjay")), "cmchis": bool(h.get("cmchis"))}
        if gov or bookable_id is None:
            v.update(can_book=False, note="information only: cannot be booked")
        else:
            v.update(id=bookable_id, can_book=True, department=department)
        self._listed[h["name"]] = v
        return v

    async def _locate(self, village: str | None, use_live_location: bool) -> tuple[tuple | None, dict | None]:
        """((lat, lng, label), None) for the caller's area, or (None, an error for the model to act on)."""
        profile = self.state.get("profile") or {}
        if use_live_location and profile.get("live"):
            return (profile["lat"], profile["lng"], profile.get("place") or "your location"), None
        if not (village or "").strip():
            if "lat" in self.state:  # found on an earlier call of this tool
                return (self.state["lat"], self.state["lng"], self.state.get("village") or "your area"), None
            return None, {"error": "location_needed", "say": "Ask the caller for their specific area, village or landmark first."}
        too_general = {"error": "area_too_general",
                       "say": "That is a whole city or district. Ask for the specific area in it, such as a locality or landmark."}
        if _squash(village) in GENERIC_AREAS:
            return None, too_general
        if not self._said_by_caller(village, profile):
            return None, {"error": "location_needed",
                          "say": "The caller has not told you that place. Ask for their specific area and use only what they say."}
        coords = place_for(village)
        if coords is None:
            try:
                r = await self.http.get("/places/geocode", params={"q": village}, timeout=NEARBY_TIMEOUT_S)
                r.raise_for_status()
                g = r.json()
            except (httpx.HTTPError, ValueError):
                log.warning("area lookup failed", exc_info=True)
                return None, {"error": "area_lookup_failed", "say": "Say sorry, then ask for a nearby well known area."}
            if not g.get("found") and g.get("reason") != "too_general":
                coords = place_for(village, cutoff=0.6)  # last resort: speech-to-text heard "Sambran" for Tambaram
                g = {"found": True, "lat": coords[0], "lng": coords[1]} if coords else g
            if not g.get("found"):
                return None, too_general if g.get("reason") == "too_general" else {
                    "error": "area_not_found", "say": "That area was not found. Ask for a nearby well known area or landmark."}
            coords = (g["lat"], g["lng"])
        return (*coords, village.strip()), None

    def _said_by_caller(self, place: str, profile: dict) -> bool:
        """The model once picked an area it had read in its own instructions. In an all-Latin call the place must be
        one the caller said (near misses count: speech-to-text spells names its own way). An area found earlier counts, and
        so does the app profile's saved village when the caller's last words are a short answer ("yes") to being asked
        about it. A call in a native script is not checked: the model transliterates there."""
        heard = self.state.get("heard") or []
        if not heard or not all(t.isascii() for t in heard):
            return True
        short_answer = len(heard[-1].split()) <= 3
        known = {_squash(x) for x in (self.state.get("village"), profile.get("village") if short_answer else None) if x}
        key = _squash(place)
        if key in known:
            return True
        words = [_squash(w) for w in " ".join(heard).split()]
        heard_text = "".join(words)
        return bool(key) and (key in heard_text or any(
            difflib.SequenceMatcher(None, key, "".join(words[i:i + n])).ratio() >= 0.8
            for n in (1, 2, 3) for i in range(len(words) - n + 1)))

    async def _demo_id(self, hospitals: list[dict]) -> int | None:
        """Demo wiring: every private hospital the caller hears books into the one demo hospital's Desk."""
        demo_id = next((h["book_facility_id"] for h in hospitals if h.get("book_facility_id")), None)
        if demo_id is None:
            r = await self.http.get("/facilities", params={"limit": 100})
            r.raise_for_status()
            demo = min((f for f in r.json() if f["is_partner"] and f["type"] != "clinic"), key=lambda f: f["id"], default=None)
            demo_id = demo["id"] if demo else None
        return demo_id

    async def t_find_facilities(self, reason: str, severity: str, village: str | None = None,
                                use_live_location: bool = False, show: str | None = None,
                                hospital_name: str | None = None) -> dict:
        out = await self._find_facilities(reason, severity, village, use_live_location, show, hospital_name)
        key = (out.get("show"), self.state.get("village"))
        if hospital_name or "say" not in out or out.get("show") == "hospitals" and severity == "serious":
            return out
        if key in self._told:  # the same list again means the model lost the thread: steer it, keep the ids it needs
            out["say"] = ("You already read this list to the caller. Do NOT read it again unless they asked to hear it again. Use what the caller just said: "
                          "if they said any place is fine or named a rule, choose for them and call get_slots; "
                          "otherwise ask only the one thing still missing.")
            out["already_listed"] = True
        self._told.add(key)
        return out

    async def _find_facilities(self, reason: str, severity: str, village: str | None, use_live_location: bool,
                               show: str | None, hospital_name: str | None) -> dict:
        """What to offer this caller: partner clinics (mild), nearest hospitals (moderate), 108 and the nearest hospital (serious).

        Demo wiring: whichever private hospital the caller hears or asks for, every slot, doctor and booking is the demo
        hospital's, so the demo Desk shows all of it. Partner clinics are real Desk facilities with their own doctors.
        """
        if severity not in SHOW_FOR:
            return {"error": "severity must be mild, moderate or serious"}
        where, error = await self._locate(village, use_live_location)
        if error:
            return error
        lat, lng, place = where
        department = department_for(reason)
        self.state.update(severity=severity, reason=reason, department=department, village=place, lat=lat, lng=lng)
        show = "hospitals" if severity == "serious" else show if show in SHOWS else SHOW_FOR[severity]
        out: dict = {"severity": severity, "show": show}
        if show == "clinics" and not hospital_name:
            clinics = await self._clinics(lat, lng, department)
            if clinics:
                return {**out, "clinics": clinics,
                        "say": "Name them (at most three) with their distance. Then end with this one question, in the caller's language: "
                               "\"Shall I book one of these, or would you like to hear about hospitals too?\""}
            out.update(show="hospitals", note="No partner clinic is near this area. Say so, then offer the hospitals below.")
        hospitals = await self._nearby(lat, lng, 10)
        if hospital_name:
            return await self._pick(hospital_name, hospitals, department)
        if severity == "serious":
            self.state.update(emergency=True, handoff=True, emergency_shown=True,
                              handoff_reason="serious: told to call 108 and given the nearest hospital")
            return {**out, "hospitals": [self._view(h, None, department) for h in hospitals[:2]],
                    "say": "Tell the caller to call 108 now or go to the first hospital, with its name, distance and address. "
                           "Say a person from the team will call back. Nothing else."}
        if show == "free_government":
            free = [h for h in hospitals if h.get("kind") in GOVERNMENT_KINDS][:2]
            return {**out, "free_government_hospitals": [self._view(h, None, department) for h in free],
                    "say": "Name each with its distance and address. Say it cannot be booked and the caller can walk in.",
                    **({} if free else {"note": "No government hospital was found nearby."})}
        demo_id = await self._demo_id(hospitals)
        if not hospitals:  # lookup down or empty: the demo hospital is named under its own name
            r = await self.http.get("/facilities", params={"limit": 100})
            r.raise_for_status()
            demo = next((f for f in r.json() if f["id"] == demo_id), None)
            if demo is None:
                return {**out, "error": "no hospital can take bookings right now; offer a callback"}
            hospitals = [{"name": demo["name"], "address": demo["address"], "kind": "private", "distance_km": None}]
        near = [h for h in hospitals if (h.get("distance_km") or 0) <= NEARBY_KM]
        shown = near[:OFFERED] or hospitals[:2]  # none within NEARBY_KM: the two nearest, so the caller still gets somewhere
        return {**out, "hospitals": [self._view(h, demo_id, department) for h in shown],
                **({} if near else {"note": f"None is within {NEARBY_KM} km; say these are the nearest."}),
                "say": "Name them with distance and say which is government (free) and which is private. Then end with this one "
                       "question, in the caller's language: \"Shall I book one of these, or would you like to hear about the "
                       "nearest free government hospitals?\""}

    async def _pick(self, hospital_name: str, hospitals: list[dict], department: str) -> dict:
        """The caller chose a place. A listed clinic or hospital is taken as listed; any other name is accepted as said."""
        known = best_match(hospital_name, list(self._listed))
        if known:
            v = self._listed[known]
        else:
            name = best_match(hospital_name, [h["name"] for h in hospitals])
            h = next((h for h in hospitals if h["name"] == name),
                     {"name": hospital_name.strip(), "address": "", "distance_km": None, "kind": "hospital"})
            v = self._view(h, await self._demo_id(hospitals), department)
        if v["can_book"]:
            self.state.update(hospital=v["name"], hospital_address=v["address"], facility_id=v["id"])
        return {"selected": v}

    async def t_get_slots(self, facility_id: int, department: str, doctor_name: str | None = None,
                          preferred_time: str | None = None, date: str | None = None,
                          avoid_dates: list[str] | None = None) -> dict:
        today = datetime.now(IST).date()
        days = [(today + timedelta(days=i)).isoformat() for i in range(SLOT_DAYS)]
        if date and date not in days:
            days.append(date)
        avoid = self.state.setdefault("avoid_dates", [])  # a day the caller ruled out stays ruled out for the call
        avoid.extend(d for d in (avoid_dates or []) if d not in avoid)

        async def one(day: str) -> list[dict]:
            r = await self.http.get(f"/facilities/{facility_id}/slots", params={"date": day, "department": department})
            if r.status_code == 404:
                return []
            r.raise_for_status()
            return r.json()

        local = lambda s: datetime.fromisoformat(s["start"]).astimezone(IST)
        slots = sorted((s for day in await asyncio.gather(*(one(d) for d in days)) for s in day
                        if local(s).date().isoformat() not in avoid), key=lambda s: s["start"])
        if not slots:
            return {"result": "none", "slots": [], "avoided_dates": avoid,
                    "note": "No open slot here on the days that suit. Say so, then try another place the caller can accept, "
                            "or offer a callback."}
        self.state["facility_id"] = facility_id
        if clinic := self._clinic_by_id.get(facility_id):  # a partner clinic is booked under its own name
            self.state.update(hospital=clinic["name"], hospital_address=clinic["address"])
        free_days = list(dict.fromkeys(local(s).strftime("%A %d %B") for s in slots))
        if date:
            slots = [s for s in slots if local(s).date().isoformat() == date]
            if not slots:
                return {"result": "none_that_day", "slots": [], "days_with_slots": free_days,
                        "note": "Nothing is free that day. Say which days are free and ask which one the caller wants."}
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
                         for s in _spread(pool, local, even=result == "any" and not date)],
               "days_with_slots": free_days}
        return out

    async def t_book_appointment(self, slot_id: int, name: str, village: str, reason_text: str,
                                 phone: str | None = None) -> dict:
        if _squash(name) in NOT_NAMES:  # the model must ask; a made-up name would sit on a real Desk
            return {"error": "name_needed", "say": "You do not have the caller's name yet. Ask for it, then book."}
        phone = self.state.get("phone") or phone  # the number the call came from beats a dictated one
        if not phone:
            return {"error": "invalid_details", "say": "The phone number is missing; ask for it."}
        body = {"patient": {"name": name, "phone": phone, "language": self.lang, "village": village},
                "slot_id": slot_id, "source": "helpline", "reason_text": reason_text,
                "hospital_name": self.state.get("hospital")}
        if self.state.get("appointment_id"):  # this call already booked: a second choice moves that booking
            r = await self.http.patch(f"/appointments/{self.state['appointment_id']}",
                                      json={"action": "reschedule", "new_slot_id": slot_id})
        else:
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
        if self.on_language is None or language not in ("en", "hi", "ta", "ml", "kn", "te"):
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

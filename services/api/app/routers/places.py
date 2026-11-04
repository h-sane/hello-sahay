"""Real hospitals near a point, from OpenStreetMap (Nominatim search).

Names, locations, kinds and CMCHIS / PM-JAY cover (checked against Tamil Nadu's own empanelment list) are real.
Everything a patient could act on is the demo wiring Hussain chose: calls go to DEMO_CALL_NUMBER and bookings
go to one partner facility, so every real hospital connects to the same Sahay Desk.
"""
import json
import os
import time
import urllib.parse
import urllib.request

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import get_session
from ..demo import demo_facility
from ..schemes import cmchis_match
from .facilities import _km

router = APIRouter()

SEARCH_URL = "https://nominatim.openstreetmap.org/search"
HALF_SPANS_DEG = [0.12, 0.4, 1.0]
SOUTH_INDIA_BOX = "74.0,19.9,84.8,8.0"  # left,top,right,bottom: the five states the helpline serves
TOO_GENERAL = {"city", "state", "state_district", "county", "region", "province", "country"}  # "Chennai" is not a place to walk to
_geocoded: dict[str, dict] = {}
CACHE_TTL_S = 3600
_cache: dict[tuple[float, float], tuple[float, list[dict]]] = {}

GOVERNMENT_HINTS = ("government", "govt", "gh ", "taluk", "district headquarters", "esi", "municipal")
PHC_HINTS = ("primary health", "phc", "health centre", "health center", "urban health")


def _search(lat: float, lng: float, span: float) -> list[dict]:
    query = urllib.parse.urlencode({
        "q": "hospital", "format": "jsonv2", "limit": 40, "bounded": 1, "extratags": 1,
        "viewbox": f"{lng - span},{lat + span},{lng + span},{lat - span}",
    })
    req = urllib.request.Request(f"{SEARCH_URL}?{query}", headers={"User-Agent": "HelloSahay/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.load(r)
    except Exception:
        raise HTTPException(503, "hospital lookup is busy, try again")


def _kind(tags: dict) -> str:
    text = f'{tags.get("name", "")} {tags.get("operator", "")}'.lower()
    optype = (tags.get("operator:type") or "").lower()
    if optype == "private" or tags.get("operator:type") == "private":
        return "private"
    if any(h in text for h in PHC_HINTS):
        return "phc"
    if optype in ("government", "public") or any(h in text for h in GOVERNMENT_HINTS):
        return "government"
    return "private" if optype else "hospital"


def _speciality(tags: dict, name: str) -> str | None:
    raw = tags.get("healthcare:speciality")
    if raw:
        return ", ".join(x.replace("_", " ").title() for x in raw.split(";"))
    lowered = name.lower()
    if "multi" in lowered and "speciality" in lowered or "multispeciality" in lowered:
        return "Multispeciality"
    if "speciality" in lowered or "specialty" in lowered:
        return "Speciality hospital"
    return None


@router.get("/places/nearby-hospitals")
def nearby_hospitals(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    limit: int = Query(5, ge=1, le=10),
    session: Session = Depends(get_session),
):
    key = (round(lat, 2), round(lng, 2))
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL_S:
        found = hit[1]
    else:
        found, seen = [], set()
        for span in HALF_SPANS_DEG:
            for r in _search(lat, lng, span):
                if r.get("type") != "hospital" or not r.get("name") or r["name"] in seen:
                    continue
                seen.add(r["name"])
                tags = r.get("extratags") or {}
                parts = r["display_name"].split(", ")
                found.append({
                    "name": r["name"], "lat": float(r["lat"]), "lng": float(r["lon"]),
                    "kind": _kind({**tags, "name": r["name"]}), "speciality": _speciality(tags, r["name"]),
                    "address": ", ".join(parts[1:4]) or None, "emergency": tags.get("emergency") == "yes",
                    "district_text": ", ".join(parts[1:]),
                })
            if found:
                break
            time.sleep(1.1)  # Nominatim allows one request per second
        _cache[key] = (time.time(), found)

    partner = demo_facility(session)
    phone = os.environ.get("DEMO_CALL_NUMBER") or os.environ.get("DEMO_EMERGENCY_NUMBER") or None
    out = []
    for h in found:
        row = {k: v for k, v in h.items() if k != "district_text"}
        listed = cmchis_match(h["name"], h["district_text"])
        # Tamil Nadu runs CMCHIS and PM-JAY together on this one empanelment list; a hospital that is not clearly on
        # it gets no scheme tag ("ask the hospital") rather than a guess.
        if listed and listed["government"] and row["kind"] != "phc":
            row["kind"] = "government"
        elif listed and row["kind"] in ("hospital", "government"):
            row["kind"] = "private"
        out.append({**row, "distance_km": round(_km(lat, lng, h["lat"], h["lng"]), 1),
                    "cmchis": listed is not None, "pmjay": listed is not None, "scheme_checked": True,
                    "phone": phone, "book_facility_id": partner.id if partner else None})
    out.sort(key=lambda h: h["distance_km"])
    return out[:limit]


@router.get("/places/geocode")
def geocode(q: str = Query(..., min_length=2, max_length=120)):
    """Coordinates of an area a caller named. A whole city or district is refused: the nearest hospital to "Chennai" is a guess."""
    key = q.strip().lower()
    if key not in _geocoded:
        query = urllib.parse.urlencode({"q": q, "format": "jsonv2", "limit": 1, "countrycodes": "in",
                                        "viewbox": SOUTH_INDIA_BOX, "bounded": 1})
        req = urllib.request.Request(f"{SEARCH_URL}?{query}", headers={"User-Agent": "HelloSahay/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                hits = json.load(r)
        except Exception:
            raise HTTPException(503, "area lookup is busy, try again")
        if not hits:
            _geocoded[key] = {"found": False, "reason": "not_found"}
        elif hits[0].get("addresstype") in TOO_GENERAL:
            _geocoded[key] = {"found": False, "reason": "too_general", "name": hits[0].get("name")}
        else:
            h = hits[0]
            _geocoded[key] = {"found": True, "name": h.get("name") or q, "lat": float(h["lat"]), "lng": float(h["lon"])}
    return _geocoded[key]

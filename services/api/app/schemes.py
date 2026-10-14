"""Which real hospitals are on the Tamil Nadu CMCHIS empanelment list.

The list is the state's own (data/schemes/cmchis_hospitals.json, refreshed by scripts/fetch_cmchis_hospitals.py).
OpenStreetMap names and the list's names are written differently ("Govt. Hosp" vs "Government Hospital"), so a
hospital is only called empanelled when its distinctive words match; anything doubtful stays "unknown".
"""
import json
import re
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path

DATA = Path(__file__).resolve().parents[3] / "data" / "schemes" / "cmchis_hospitals.json"

WORDS = {
    "govt": "government", "gov": "government", "gh": "government", "hosp": "hospital", "hosptial": "hospital",
    "hospitals": "hospital", "med": "medical", "coll": "college", "specialty": "speciality",
    "specialities": "speciality", "shri": "sri", "sree": "sri", "mutli": "multi",
}
DROP = {"tn", "hospital", "pvt", "private", "ltd", "limited", "the", "and", "of", "p", "dr", "inc", "centre", "center"}
GENERIC = {"government", "medical", "college", "general", "district", "taluk", "head", "quarters", "hq", "health",
           "community", "primary", "urban", "multi", "speciality", "super", "nursing", "home", "care", "clinic"}
# One OpenStreetMap place name can sit in a different district on the list (Chengalpattu was split from
# Kancheepuram), so neighbours form one group and districts are only compared when both are known.
REGION = {"chengalpet": "chennai", "chengalpattu": "chennai", "kancheepuram": "chennai", "kanchipuram": "chennai",
          "tiruvallur": "chennai", "chennai": "chennai", "thoothukudi": "tuticorin", "tuticorin": "tuticorin",
          "tuitcorin": "tuticorin", "tiruchirappalli": "tiruchirapalli", "trichy": "tiruchirapalli",
          "pudukkottai": "pudukottai", "sivaganga": "sivagangai", "tirupur": "tiruppur", "kanniyakumari": "kanyakumari",
          "nilgiris": "the nilgiris"}


def _tokens(text: str) -> set[str]:
    words = re.sub(r"[^a-z0-9]+", " ", text.lower()).split()
    return {WORDS.get(w, w) for w in words} - DROP


def _same(a: str, b: str) -> bool:
    if a == b:
        return True
    return len(a) >= 6 and len(b) >= 6 and SequenceMatcher(None, a, b).ratio() >= 0.8


def _covered(small: set[str], big: set[str]) -> bool:
    return all(any(_same(s, b) for b in big) for s in small)


def _region(text: str) -> str | None:
    lowered = re.sub(r"[^a-z]+", " ", text.lower())
    for word in _districts():
        if f" {word} " in f" {lowered} ":
            return REGION.get(word, word)
    return None


@lru_cache(maxsize=1)
def _rows() -> list[dict]:
    if not DATA.exists():
        return []
    return json.loads(DATA.read_text(encoding="utf-8"))["hospitals"]


@lru_cache(maxsize=1)
def _list() -> list[dict]:
    out = []
    for r in _rows():
        if r["type"].lower().startswith(("dc", "ddwo")):
            continue
        district = r["district"].lower()
        out.append({**r, "tokens": _tokens(r["name"]) - {district}, "region": REGION.get(district, district)})
    return out


@lru_cache(maxsize=1)
def _districts() -> list[str]:
    names = {r["district"].lower() for r in _rows()} | set(REGION)
    return sorted(names, key=len, reverse=True)


def is_government(row: dict) -> bool:
    return row["type"].lower().startswith(("gov", "deic"))


def cmchis_match(name: str, place: str = "") -> dict | None:
    """The CMCHIS list entry for this hospital, or None when it is not clearly on the list."""
    query = _tokens(name)
    if not query:
        return None
    region = _region(place)
    best, best_gap = None, 99
    for row in _list():
        if region and row["region"] != region:
            continue
        cand = row["tokens"]
        small, big = (query, cand) if len(query) <= len(cand) else (cand, query)
        gap = len(big) - len(small)
        if gap > 2 or gap >= best_gap or not _covered(small, big):
            continue
        if len(small) == 1 and (gap > 0 or small <= GENERIC):
            continue
        best, best_gap = row, gap
    if best is None:
        return None
    return {"name": best["name"], "district": best["district"], "type": best["type"], "government": is_government(best)}

"""Spelling-tolerant medicine name lookup: type-ahead suggestions and closest-name matching.

Names are the first word of every brand in the loaded dataset plus every salt name, loaded once per process.
"""
import re
from bisect import bisect_left

from rapidfuzz import fuzz, process
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models_patient_app import BrandMedicine, JanAushadhiItem

WORD = re.compile(r"[A-Za-z][A-Za-z']+")
MIN_SCORE = 72


_cache: tuple[list[str], dict[str, str]] | None = None


def _names(session: Session) -> tuple[list[str], dict[str, str]]:
    """Sorted lower-case names, and lower -> how to display it."""
    global _cache
    if _cache:
        return _cache
    shown: dict[str, str] = {}
    for (brand,) in session.execute(select(func.distinct(BrandMedicine.brand))):
        first = WORD.match(brand or "")
        if first and len(first.group()) >= 3:
            shown.setdefault(first.group().lower(), first.group())
    for (name,) in session.execute(select(func.distinct(JanAushadhiItem.generic_name))):
        first = WORD.match(name or "")
        if first and len(first.group()) >= 3:
            shown.setdefault(first.group().lower(), first.group().capitalize())
    _cache = (sorted(shown), shown)
    return _cache


def suggest(session: Session, q: str, limit: int = 8) -> list[str]:
    """Names starting with q first, then names containing it, then the closest spellings."""
    term = q.strip().lower()
    names, shown = _names(session)
    start = bisect_left(names, term)
    out = []
    for n in names[start:]:
        if not n.startswith(term) or len(out) >= limit:
            break
        out.append(n)
    if len(out) < limit:
        out += [n for n in names if term in n and n not in out][: limit - len(out)]
    if len(out) < limit:
        close = process.extract(term, names, scorer=fuzz.ratio, score_cutoff=MIN_SCORE, limit=limit)
        out += [n for n, _, _ in close if n not in out][: limit - len(out)]
    return [shown[n] for n in out]

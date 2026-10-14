"""Turns a medicine's composition into a comparable key so a brand and a Jan Aushadhi generic can be matched.

A key is a sorted list of "salt strength" strings, e.g. ["amoxicillin 500mg", "clavulanic acid 125mg"].
Two products are the same medicine only when keys, form and release type (plain or modified) are equal.
"""
import re

UNIT = r"(mg|mcg|µg|ug|gm|g|iu|ml|%)"
STRENGTH = re.compile(rf"(\d+(?:\.\d+)?)\s*{UNIT}\b", re.I)
FORM_WORDS = {
    "tablet": "tablet", "tablets": "tablet", "capsule": "capsule", "capsules": "capsule",
    "syrup": "liquid", "suspension": "liquid", "solution": "liquid", "drops": "drops",
    "injection": "injection", "infusion": "injection", "cream": "topical", "ointment": "topical",
    "gel": "topical", "lotion": "topical", "powder": "powder", "sachet": "powder", "granules": "powder",
    "inhaler": "inhaler", "rotacaps": "inhaler", "respules": "inhaler", "spray": "spray",
}
FORM_RE = re.compile(r"\b(" + "|".join(FORM_WORDS) + r")\b", re.I)
MODIFIED = re.compile(r"\b(sr|er|xr|cr|mr|la|xl|retard|sustained|extended|prolonged|controlled|modified)\b", re.I)
SALT_FORMS = {"hydrochloride", "hcl", "sodium", "potassium", "calcium", "maleate", "besylate", "besilate",
              "sulphate", "sulfate", "phosphate", "tartrate", "succinate", "citrate", "acetate", "mesylate",
              "medoxomil", "axetil", "bromide", "fumarate", "dihydrate", "monohydrate", "trihydrate", "anhydrous",
              "ip", "bp", "usp", "gastro-resistant", "film", "coated", "enteric", "dispersible", "chewable",
              "tablets", "tablet", "capsules", "capsule", "per", "as", "w/v", "w/w", "v/v"}
SYNONYMS = {"amoxycillin": "amoxicillin", "acetaminophen": "paracetamol", "cholecalciferol": "vitamin d3",
            "vitamin d": "vitamin d3", "cetrizine": "cetirizine", "atorvastatin": "atorvastatin",
            "levocetrizine": "levocetirizine", "rabeprazol": "rabeprazole", "metformine": "metformin"}
SPLIT = re.compile(r"\s+and\s+|\s*\+\s*|\s*&\s*|\s*,\s*(?![^()]*\))", re.I)


def _strength(value: str, unit: str) -> str:
    n, u = float(value), unit.lower()
    if u in ("mcg", "µg", "ug"):
        n, u = n / 1000, "mg"
    elif u in ("g", "gm"):
        n, u = n * 1000, "mg"
    return f"{n:g}{u}"


def clean_salt(raw: str) -> str:
    text = re.sub(r"\([^)]*\)", " ", raw.lower().replace("\xa0", " "))
    words = [SYNONYMS.get(w, w) for w in re.findall(r"[a-z][a-z0-9\-]*", text)]
    kept = [w for w in words if w not in SALT_FORMS] or words
    name = " ".join(dict.fromkeys(kept))  # "paracetamol / acetaminophen" collapses to one word
    return SYNONYMS.get(name, name)


def parse_composition(name: str) -> list[str]:
    """Jan Aushadhi style names: 'Aceclofenac 100mg and Paracetamol 325mg Tablets', 'Aspirin Tablets IP 150 mg',
    'Telmisartan + Rosuvastatin Tablet (40/10 Mg)'."""
    text = name.replace("\xa0", " ")
    bracket = re.search(r"\(\s*(\d+(?:\.\d+)?(?:\s*/\s*\d+(?:\.\d+)?)+)\s*(mg|mcg|g|gm)?\s*\)", text, re.I)
    slash_strengths = None
    if bracket:
        slash_strengths = [_strength(v, bracket.group(2) or "mg") for v in re.split(r"\s*/\s*", bracket.group(1))]
        text = text.replace(bracket.group(0), " ")
    form = FORM_RE.search(text)
    head = text[: form.start()] if form else text
    parts = [p for p in SPLIT.split(head) if p.strip()]
    pairs = []
    for part in parts:
        s = STRENGTH.search(part)
        salt = clean_salt(STRENGTH.sub(" ", part))
        pairs.append((salt, _strength(s.group(1), s.group(2)) if s else None))
    tail = [_strength(v, u) for v, u in STRENGTH.findall(text[form.end():])] if form else []
    if slash_strengths and len(slash_strengths) == len(pairs):
        pairs = [(salt, st) for (salt, _), st in zip(pairs, slash_strengths)]
    elif len(tail) == len(pairs):
        pairs = [(salt, st or tail[i]) for i, (salt, st) in enumerate(pairs)]
    if any(st is None for _, st in pairs) or not pairs:
        return []
    return sorted(f"{salt} {st}" for salt, st in pairs if salt)


def brand_composition(*parts: str | None) -> list[str]:
    """The brand dataset's 'Amoxycillin (500mg)' columns."""
    out = []
    for part in parts:
        if not part or not part.strip():
            continue
        s = STRENGTH.search(part)
        salt = clean_salt(STRENGTH.sub(" ", part))
        if not s or not salt:
            return []
        out.append(f"{salt} {_strength(s.group(1), s.group(2))}")
    return sorted(out)


def form_of(*texts: str | None) -> str | None:
    """'tablet', 'capsule', 'liquid'... with '-modified' appended for SR/ER/XR products."""
    joined = " ".join(t for t in texts if t)
    found = FORM_RE.search(joined)
    if not found:
        return None
    form = FORM_WORDS[found.group(1).lower()]
    return form + "-modified" if MODIFIED.search(joined) else form


def unit_count(pack: str | None) -> tuple[float, str] | None:
    """(quantity, 'unit' | 'ml') from '10's', 'strip of 15 tablets', '200 ml', 'bottle of 100 ml syrup'."""
    if not pack:
        return None
    text = pack.lower().replace("\xa0", " ")
    ml = re.search(r"(\d+(?:\.\d+)?)\s*(?:ml|ltr|l)\b", text)
    if ml and "tablet" not in text and "capsule" not in text:
        return float(ml.group(1)), "ml"
    n = re.search(r"(\d+)\s*(?:'s|s\b|tablets?|capsules?|strips?|caps?|pills?|nos)", text) or re.search(r"of\s+(\d+)", text)
    return (float(n.group(1)), "unit") if n else None

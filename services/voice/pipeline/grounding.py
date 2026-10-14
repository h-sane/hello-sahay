"""Code-level check that the model only states facts a tool returned (ARCHITECTURE section 3).

Two things are verified in every reply before it is spoken: any number of 3+ digits (phones, pin codes,
street numbers) and any hospital-like name must appear in a tool result or in what the caller said.
"""
import re

_WORDS = {"zero": "0", "oh": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
          "six": "6", "seven": "7", "eight": "8", "nine": "9"}
ALLOWED = {"108", "112", "104"}  # the helpline numbers our fixed replies give
_NAME = re.compile(r"\b((?:[A-Z][\w'’-]*\s+)+(?:Hospital|Clinic|Nursing Home|PHC|CHC|Centre|Center))\b")


def _digits(text: str) -> str:
    spoken = re.sub(r"[A-Za-z]+", lambda m: _WORDS.get(m.group(0).lower(), " "), text)
    return re.sub(r"\D", "", spoken)


def ungrounded(reply: str, known: list[str]) -> list[str]:
    """What in `reply` no source backs up (empty list = fine)."""
    pool = " ".join(known)
    pool_digits, pool_lower = _digits(pool), pool.lower()
    bad = [n for n in re.findall(r"\d+", reply)
           if len(n) >= 3 and n not in ALLOWED and n not in pool_digits]
    bad += [m.group(1) for m in _NAME.finditer(reply) if m.group(1).lower() not in pool_lower]
    return bad

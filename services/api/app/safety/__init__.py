"""Deterministic safety gate: runs before the LLM on every utterance (voice and /chat)."""
import re
import unicodedata
from dataclasses import dataclass
from typing import Literal

from .keywords import EMERGENCY, SYMPTOM

REPLIES = {
    "emergency": {
        "en": "This sounds like an emergency. Please call 108 now (or 112). I can also connect you to a person.",
        "hi": "यह एक आपात स्थिति लगती है। कृपया अभी 108 (या 112) पर कॉल करें। मैं आपको किसी व्यक्ति से भी जोड़ सकती हूँ।",
        "ta": "இது அவசர நிலை போல் தெரிகிறது. உடனே 108 (அல்லது 112) எண்ணை அழைக்கவும். நான் உங்களை ஒரு நபருடனும் இணைக்க முடியும்.",
    },
    "symptom": {
        "en": "I can't give medical advice. Please visit your nearest PHC or call 104. I can book a visit for you.",
        "hi": "मैं चिकित्सा सलाह नहीं दे सकती। कृपया अपने नज़दीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाएँ या 104 पर कॉल करें। मैं आपके लिए मुलाकात बुक कर सकती हूँ।",
        "ta": "என்னால் மருத்துவ ஆலோசனை வழங்க முடியாது. உங்களுக்கு அருகிலுள்ள ஆரம்ப சுகாதார நிலையத்திற்குச் செல்லுங்கள் அல்லது 104 எண்ணை அழைக்கவும். உங்களுக்காக ஒரு வருகையை நான் முன்பதிவு செய்யலாம்.",
    },
}


@dataclass(frozen=True)
class SafetyResult:
    flag: Literal["emergency", "symptom", "ok"]
    matched: str | None = None
    reply: str | None = None


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFC", text).lower()
    text = re.sub(r"['’`]", "", text)
    # Cf (zero-width joiners) is dropped; anything that is not letter/mark/digit becomes a space.
    text = "".join(
        c if unicodedata.category(c)[0] in "LMN" else " "
        for c in text
        if unicodedata.category(c) != "Cf"
    )
    return " ".join(text.split())


def _compile(table: dict[str, list[str]]) -> re.Pattern:
    # Longest first so the reported match is the most specific phrase.
    parts = sorted({unicodedata.normalize("NFC", p).lower() for ps in table.values() for p in ps},
                   key=len, reverse=True)
    return re.compile("(?<![a-z0-9])(?:" + "|".join(parts) + ")")


_EMERGENCY = _compile(EMERGENCY)
_SYMPTOM = _compile(SYMPTOM)


def check(text: str, lang: str = "en") -> SafetyResult:
    """Emergency beats symptom. Every language's list is checked whatever `lang` is;
    `lang` only picks the reply language."""
    lang = lang if lang in ("en", "hi", "ta") else "en"
    norm = normalize(text)
    for flag, rx in (("emergency", _EMERGENCY), ("symptom", _SYMPTOM)):
        m = rx.search(norm)
        if m:
            return SafetyResult(flag, m.group(0), REPLIES[flag][lang])
    return SafetyResult("ok")


__all__ = ["check", "SafetyResult", "REPLIES", "normalize"]

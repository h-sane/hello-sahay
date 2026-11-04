"""The caller's answer to "which language?": the language's name in any script the speech-to-text may produce."""
import unicodedata

NAMES = {
    "en": ["english", "angrezi", "इंग्लिश", "अंग्रेजी", "अंग्रेज़ी", "இங்கிலீஷ்", "ஆங்கிலம்", "ഇംഗ്ലീഷ്", "ഇംഗ്ലിഷ്", "ಇಂಗ್ಲಿಷ್", "ఇంగ్లీష్"],
    "hi": ["hindi", "हिंदी", "हिन्दी", "ஹிந்தி", "ഹിന്ദി", "ಹಿಂದಿ", "హిందీ"],
    "ta": ["tamil", "tamizh", "thamizh", "तमिल", "தமிழ்", "தமிழ", "തമിഴ്", "ತಮಿಳು", "తమిళం"],
    "ml": ["malayalam", "मलयालम", "மலையாளம்", "മലയാളം", "ಮಲಯಾಳಂ", "మలయాళం"],
    "kn": ["kannada", "कन्नड", "கன்னடம்", "കന്നഡ", "ಕನ್ನಡ", "కన్నడ"],
    "te": ["telugu", "तेलुगु", "தெலுங்கு", "തെലുങ്ക്", "ತೆಲುಗು", "తెలుగు"],
}


def language_named(text: str) -> str | None:
    """The language the caller named first in `text`, or None when they named none."""
    t = unicodedata.normalize("NFC", text).lower()
    hits = [(t.find(w), code) for code, words in NAMES.items() for w in words if w in t]
    return min(hits)[1] if hits else None

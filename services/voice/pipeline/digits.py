"""Spoken digit words (English, Hindi, Tamil, romanised Hindi) to digits, so a dictated number reaches the model as digits."""
import re

_WORDS = {
    "0": "zero oh shunya sunya जीरो ज़ीरो शून्य பூஜ்ஜியம்", "1": "one ek एक ஒன்று", "2": "two do दो இரண்டு",
    "3": "three teen तीन மூன்று", "4": "four char chaar चार நான்கு", "5": "five paanch panch पाँच पांच ஐந்து",
    "6": "six chhe che chhah छह छः छे ஆறு", "7": "seven saat सात ஏழு", "8": "eight aath आठ எட்டு",
    "9": "nine nau नौ ஒன்பது",
}
_DIGIT = {w: d for d, ws in _WORDS.items() for w in ws.split()}
MIN_RUN = 4  # shorter runs are ordinary speech ("one or two days")


def digits_from_words(text: str) -> str:
    out, run = [], []  # run holds consecutive digit words with their separating spaces

    def flush():
        if len([t for t in run if t.strip()]) >= MIN_RUN:
            out.append("".join(_DIGIT.get(t.lower(), t) for t in run if t.strip()) + (run[-1] if run[-1].isspace() else ""))
        else:
            out.extend(run)  # too short: ordinary speech
        run.clear()

    for tok in re.split(r"(\s+|[.,।?!])", text):
        if tok and (tok.lower() in _DIGIT or tok.isdigit()):
            run.append(tok)
        elif tok.isspace() and run:
            run.append(tok)
        else:
            flush()
            out.append(tok)
    flush()
    return "".join(out)

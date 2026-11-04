"""Spoken digit words (English, Hindi, Tamil, Malayalam, Kannada, Telugu, romanised Hindi) to digits, so a dictated number reaches the model as digits."""
import re

_WORDS = {
    "0": "zero oh shunya sunya जीरो ज़ीरो शून्य பூஜ்ஜியம் പൂജ്യം സീറോ ಸೊನ್ನೆ ಶೂನ್ಯ సున్నా జీరో", "1": "one ek एक ஒன்று ഒന്ന് ഒന്നു ಒಂದು ఒకటి", "2": "two do दो இரண்டு രണ്ട് രണ്ടു ಎರಡು రెండు",
    "3": "three teen तीन மூன்று മൂന്ന് മൂന്നു ಮೂರು మూడు", "4": "four char chaar चार நான்கு നാല് നാലു ನಾಲ್ಕು నాలుగు", "5": "five paanch panch पाँच पांच ஐந்து അഞ്ച് ಐದು ఐదు",
    "6": "six chhe che chhah छह छः छे ஆறு ആറ് ആറു ಆರು ఆరు", "7": "seven saat सात ஏழு ഏഴ് ഏഴു ಏಳು ఏడు", "8": "eight aath आठ எட்டு എട്ട് എട്ടു ಎಂಟು ఎనిమిది",
    "9": "nine nau नौ ஒன்பது ഒമ്പത് ഒൻപത് ഒമ്പതു ಒಂಬತ್ತು తొమ్మిది",
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

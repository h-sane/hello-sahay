import pytest

from app.safety import REPLIES, check

EMERGENCY_CASES = [
    # English
    ("en", "I have chest pain"),
    ("en", "My father can't breathe!"),
    ("en", "she is unconscious and not responding"),
    ("en", "my mother fainted just now"),
    ("en", "a snake bit my son in the field"),
    ("en", "there is heavy bleeding, it won't stop"),
    ("en", "he drank pesticide"),
    ("en", "my wife is in labour, her water broke"),
    ("en", "I want to die"),
    ("en", "my child is having a seizure"),
    ("en", "he gets fits"),
    ("en", "he has a severe burn on his arm"),
    ("en", "there was an accident, he hit his head"),
    ("en", "her face is drooping and she can't speak"),
    ("en", "my father had a stroke"),
    ("en", "the child drank poison"),
    # Hindi, Devanagari
    ("hi", "मुझे सीने में दर्द हो रहा है"),
    ("hi", "मेरी माँ को साँस नहीं आ रही"),
    ("hi", "वो बेहोश हो गया है"),
    ("hi", "बच्चे को साँप ने काट लिया"),
    ("hi", "बहुत खून बह रहा है"),
    ("hi", "उसने कीटनाशक पी लिया"),
    ("hi", "पत्नी को प्रसव पीड़ा हो रही है"),
    ("hi", "मैं मरना चाहता हूँ"),
    ("hi", "बेटे को दौरा पड़ा है"),
    ("hi", "वह बुरी तरह जल गया"),
    ("hi", "सिर में चोट लगी है, एक्सीडेंट हुआ"),
    ("hi", "चेहरा टेढ़ा हो गया और बोल नहीं पा रहे"),
    # Hindi, romanized
    ("hi", "saans nahi aa rahi"),
    ("hi", "seene mein dard hai"),
    ("hi", "behosh ho gaya"),
    ("hi", "saanp ne kaat liya"),
    ("hi", "bahut khoon beh raha hai"),
    ("hi", "usne zeher pi liya"),
    ("hi", "delivery ka dard shuru ho gaya, pani toot gaya"),
    ("hi", "main marna chahta hoon"),
    ("hi", "mirgi ka daura pad gaya"),
    # Tamil, native script
    ("ta", "எனக்கு நெஞ்சு வலிக்கிறது"),
    ("ta", "அம்மாவுக்கு மூச்சு விட முடியலை"),
    ("ta", "அப்பா மயங்கி விழுந்துட்டார்"),
    ("ta", "பாம்பு கடித்துவிட்டது"),
    ("ta", "அதிக ரத்தம் போகுது"),
    ("ta", "அவர் பூச்சி மருந்து குடிச்சுட்டார்"),
    ("ta", "மனைவிக்கு பிரசவ வலி வந்துடுச்சு"),
    ("ta", "நான் சாகணும்"),
    ("ta", "குழந்தைக்கு வலிப்பு வந்தது"),
    ("ta", "தீக்காயம் பெரிசா இருக்கு"),
    ("ta", "விபத்து ஆயிடுச்சு, தலையில் அடி"),
    ("ta", "முகம் கோணல் ஆகி பேச முடியவில்லை"),
    # Tamil, romanized
    ("ta", "nenju vali irukku"),
    ("ta", "moochu vida mudiyala"),
    ("ta", "paambu kadichiduchu"),
    ("ta", "ratham niraya poguthu"),
    ("ta", "avar visham kudichu irukkaru"),
    ("ta", "prasava vali vandhuduchu"),
    ("ta", "valippu vandhuduchu"),
    ("ta", "theekaayam pattiduchu"),
    ("ta", "appa mayangi vizhundhutaru"),
    ("ta", "naan saaganum"),
    # mixed languages: the gate checks all lists whatever lang is passed
    ("en", "amma ko saans nahi aa rahi"),
    ("hi", "my father has nenju vali"),
    ("ta", "he got a snake bite"),
]

SYMPTOM_CASES = [
    ("en", "What is this pain in my knee?"),
    ("en", "Which medicine should I take for cold?"),
    ("en", "Is it dangerous?"),
    ("en", "should I take paracetamol"),
    ("en", "what disease do I have"),
    ("en", "how to cure my cough"),
    ("hi", "kya dawai lu"),
    ("hi", "kaun si dawai khaun bukhar ke liye"),
    ("hi", "ye kya bimari hai"),
    ("hi", "क्या यह खतरनाक है"),
    ("hi", "कौन सी दवा लूं"),
    ("hi", "मुझे क्या हुआ है, इलाज बताइए"),
    ("ta", "enna marunthu saapidalam"),
    ("ta", "idhu enna noi"),
    ("ta", "அது ஆபத்தா"),
    ("ta", "என்ன மருந்து சாப்பிடலாம்"),
    ("ta", "இது என்ன நோய்"),
    ("ta", "enakku enna aachu"),
]

OK_CASES = [
    ("en", "I want to see a doctor for fever"),
    ("en", "Book an appointment for my pregnancy checkup"),
    ("en", "I need an eye test tomorrow"),
    ("en", "Find a government hospital near Tambaram"),
    ("en", "Does PM-JAY cover knee surgery?"),
    ("en", "Reschedule my appointment to Friday morning"),
    ("en", "heat stroke precautions"),
    ("en", "food poisoning symptoms"),
    ("hi", "mujhe bukhar ke liye doctor se milna hai"),
    ("hi", "गर्भावस्था की जांच के लिए अपॉइंटमेंट बुक करें"),
    ("hi", "aankh ki jaanch karwani hai"),
    ("hi", "मुझे पास का सरकारी अस्पताल बताइए"),
    ("hi", "kal subah ka slot chahiye"),
    ("ta", "காய்ச்சலுக்கு டாக்டரை பார்க்க வேண்டும்"),
    ("ta", "karppa kala checkup ku appointment venum"),
    ("ta", "கண் பரிசோதனைக்கு நேரம் வேண்டும்"),
    ("ta", "enakku kaichal, doctor paakanum"),
    ("ta", "பக்கத்தில் அரசு மருத்துவமனை எங்கே இருக்கு"),
    ("en", ""),
    ("en", "that slot fits my schedule"),
]


@pytest.mark.parametrize("lang,text", EMERGENCY_CASES)
def test_emergency(lang, text):
    r = check(text, lang)
    assert r.flag == "emergency", (text, r)
    assert r.matched
    assert r.reply == REPLIES["emergency"][lang]


@pytest.mark.parametrize("lang,text", SYMPTOM_CASES)
def test_symptom(lang, text):
    r = check(text, lang)
    assert r.flag == "symptom", (text, r)
    assert r.reply == REPLIES["symptom"][lang]


@pytest.mark.parametrize("lang,text", OK_CASES)
def test_ok(lang, text):
    r = check(text, lang)
    assert r.flag == "ok", (text, r)
    assert r.matched is None and r.reply is None


def test_emergency_beats_symptom():
    assert check("is it dangerous? I have chest pain", "en").flag == "emergency"


def test_replies_exact_english():
    assert check("chest pain", "en").reply == (
        "This sounds like an emergency. Please call 108 now (or 112). I can also connect you to a person.")
    assert check("which medicine", "en").reply == (
        "I can't give medical advice. Please visit your nearest PHC or call 104. I can book a visit for you.")


def test_unknown_lang_falls_back_to_english():
    assert check("chest pain", "fr").reply == REPLIES["emergency"]["en"]

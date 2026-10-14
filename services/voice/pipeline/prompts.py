LANG_NAME = {"en": "English", "hi": "Hindi", "ta": "Tamil"}

# Language-choice greeting for a call whose language is detected: one short line per language, then the beep.
AUTO_GREETING = [
    ("en", "Hello, this is Hello Sahay. I can speak English."),
    ("hi", "मैं हिंदी में भी बात कर सकती हूँ।"),
    ("ta", "நான் தமிழிலும் பேசுவேன்."),
    ("en", "Your call is transcribed. How would you like to continue? Please speak after the beep."),
]

GREETING = {
    "en": "Hello, this is Hello Sahay. Your call is transcribed. How can I help you? Please speak after the beep.",
    "hi": "नमस्ते, यह हेलो सहाय है। आपकी बातचीत लिखी जाती है। मैं आपकी कैसे मदद करूँ? बीप के बाद बोलिए।",
    "ta": "வணக்கம், இது ஹலோ சஹாய். உங்கள் அழைப்பு எழுத்தாக பதிவு செய்யப்படுகிறது. நான் எப்படி உதவலாம்? பீப் ஒலிக்குப் பிறகு பேசுங்கள்.",
}

UNVERIFIED = {"en": "I don't have verified information on that. Please ask at your nearest PHC or call 104. "
                    "A person from our team will also call you back.",
              "hi": "मेरे पास इसकी सत्यापित जानकारी नहीं है। कृपया अपने नज़दीकी PHC में पूछें या 104 पर कॉल करें। "
                    "हमारी टीम का कोई व्यक्ति भी आपको वापस कॉल करेगा।",
              "ta": "இதைப் பற்றி என்னிடம் சரிபார்க்கப்பட்ட தகவல் இல்லை. அருகிலுள்ள PHC-யில் கேளுங்கள் அல்லது 104 எண்ணை அழைக்கவும். "
                    "எங்கள் குழுவினர் ஒருவர் உங்களைத் திரும்ப அழைப்பார்."}

GREETING_FALLBACK = {"en": "Sorry, I had a problem. Could you say that again?",
                     "hi": "माफ़ कीजिए, कुछ गड़बड़ हो गई। क्या आप फिर से कह सकते हैं?",
                     "ta": "மன்னிக்கவும், ஒரு சிக்கல் ஏற்பட்டது. மீண்டும் சொல்ல முடியுமா?"}

SYSTEM = """You are Sahay, the voice assistant of Hello Sahay, a free health helpline for rural patients in Tamil Nadu.
You are on a phone call. Reply only in {language}, in one or two short sentences (about 20 words in all).
Ask one question at a time and never list more than two choices. The caller was already greeted: "{greeting}"
If the caller only chose a language or said hello, answer "How can I help you?" in their language and wait.
If the caller asks to switch language, call set_language, then answer in that language.

Hard rules:
- Never diagnose, never name a likely illness, never suggest medicines, doses or treatment, and never comment on symptoms.
  If asked, say you cannot give medical advice and offer to book a visit.
- You know nothing about any hospital, doctor, slot, address, phone number or scheme. Before you mention one, a tool
  must have returned it in this call. Never invent or guess them. Every reply is checked and blocked if it does.
- The visit reason is the caller's own words. You do not choose the department; find_facilities does.
- If the caller describes an emergency, call emergency_redirect and say the returned text exactly.

About this caller:
{caller}

Steps:
1. Get the reason for the visit in the caller's own words, then their location as described above. Do not ask for
   anything you already have.
2. Call find_facilities. It returns real hospitals and every one of them can be booked. If "free_government_option"
   is present, first say in one short sentence that it is the nearest free government hospital and offer it, then
   name the "recommended" hospital with its distance (up to three short sentences for this step). Ask which one to
   book. If the caller names any hospital, call find_facilities again with hospital_name and use that hospital.
3. When the caller agrees to a hospital, ask once whether they have a preferred doctor or time.
   Then call get_slots with doctor_name and preferred_time (24-hour HH:MM) if they gave them.
   "exact" means their wish is free; "next_for_doctor" means that doctor is busy then, so offer that doctor's next
   slot. Whatever the result, just offer the slots returned (at most two) with the doctor named in each, by day and
   time, e.g. "Thursday at ten thirty in the morning". If the caller asked for a doctor who is not in the slots,
   never say that doctor is unavailable or unknown: simply offer the doctor and time in the slots as the best fit.
4. When the caller chooses a slot and you have their name, call book_appointment, then confirm doctor, day, time and
   hospital in one sentence. Ask for the name only if you do not have it.
5. If get_slots returns no slots, say so, give the hospital's address if you have one and offer a callback.
6. If you cannot help or the caller asks for a person, call handoff_to_human.
Callers may say digits as words in any language (for example "nau aath saat"); convert them to digits yourself.
Use the exact facility names and ids from tool results; never use an id you were not given."""


def caller_block(state: dict, auto_lang_tool: bool = True) -> str:
    """Per-turn facts about this caller, built from the call itself and the Sahay app profile."""
    p = state.get("profile") or {}
    lines = []
    if state.get("phone"):
        lines.append("- Their mobile number is already known from the call. Never ask for it or read it out; "
                     "booking uses it automatically.")
    else:
        lines.append("- Their number is not known: ask for the 10-digit mobile number before booking, "
                     "read it back digit by digit, and wait for a yes.")
    if p.get("name"):
        lines.append(f"- They are registered in the Sahay app as {p['name']}. Use this name for the booking; "
                     "do not ask for it.")
    else:
        lines.append("- Their name is not known; ask for it just before booking.")
    if p.get("live") and p.get("place"):
        lines.append(f"- The app reports their live location near {p['place']}. Ask once, for example "
                     f"\"I see you are near {p['place']}, is that right?\". If yes, call find_facilities with "
                     "use_live_location true and no village. If no, ask for their village or town.")
    elif p.get("village"):
        lines.append(f"- No live location. Their saved village is {p['village']}: ask whether they are there now.")
    else:
        lines.append("- No live location: ask for their village or town.")
    return "\n".join(lines)

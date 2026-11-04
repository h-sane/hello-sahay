LANG_NAME = {"en": "English", "hi": "Hindi", "ta": "Tamil", "ml": "Malayalam", "kn": "Kannada", "te": "Telugu"}

# Opening of a call whose language is not yet known: a short welcome and one line per language, then the beep.
# The caller names their language (or just speaks it); the disclaimer follows in that language.
AUTO_GREETING = [
    ("en", "Hello, welcome to Hello Sahay. For English, say English."),
    ("hi", "हिंदी के लिए, हिंदी बोलिए।"),
    ("ta", "தமிழுக்கு, தமிழ் என்று சொல்லுங்கள்."),
    ("ml", "മലയാളത്തിന്, മലയാളം എന്ന് പറയൂ."),
    ("kn", "ಕನ್ನಡಕ್ಕಾಗಿ, ಕನ್ನಡ ಎಂದು ಹೇಳಿ."),
    ("te", "తెలుగు కోసం, తెలుగు అని చెప్పండి."),
    ("en", "Please speak after the beep."),
]

WELCOME = {"en": "Hello, welcome to Hello Sahay.",
           "hi": "नमस्ते, हेलो सहाय में आपका स्वागत है।",
           "ta": "வணக்கம், ஹலோ சஹாயுக்கு வரவேற்கிறோம்.",
           "ml": "നമസ്കാരം, ഹലോ സഹായിലേക്ക് സ്വാഗതം.",
           "kn": "ನಮಸ್ಕಾರ, ಹಲೋ ಸಹಾಯ್‌ಗೆ ಸ್ವಾಗತ.",
           "te": "నమస్కారం, హలో సహాయ్‌కి స్వాగతం."}

# The notice every caller hears in their own language before anything else: transcription, no medical advice, 108.
DISCLAIMER = {"en": "Your call is transcribed. I cannot give medical advice. In an emergency, call 108.",
              "hi": "आपकी बातचीत लिखी जाती है। मैं चिकित्सा सलाह नहीं दे सकती। आपात स्थिति में 108 पर कॉल करें।",
              "ta": "உங்கள் அழைப்பு எழுத்தாக பதிவு செய்யப்படுகிறது. என்னால் மருத்துவ ஆலோசனை வழங்க முடியாது. அவசர நிலையில் 108 எண்ணை அழைக்கவும்.",
              "ml": "നിങ്ങളുടെ കോൾ എഴുതി രേഖപ്പെടുത്തുന്നുണ്ട്. എനിക്ക് വൈദ്യോപദേശം നൽകാൻ കഴിയില്ല. അടിയന്തര ഘട്ടത്തിൽ 108 വിളിക്കൂ.",
              "kn": "ನಿಮ್ಮ ಕರೆಯನ್ನು ಬರಹದಲ್ಲಿ ದಾಖಲಿಸಲಾಗುತ್ತದೆ. ನಾನು ವೈದ್ಯಕೀಯ ಸಲಹೆ ನೀಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ 108 ಕ್ಕೆ ಕರೆ ಮಾಡಿ.",
              "te": "మీ కాల్ రాతపూర్వకంగా నమోదు చేయబడుతుంది. నేను వైద్య సలహా ఇవ్వలేను. అత్యవసర పరిస్థితిలో 108 కి కాల్ చేయండి."}

ASK_PROBLEM = {"en": "What is troubling you? Please speak after the beep.",
               "hi": "आपको क्या तकलीफ़ है? बीप के बाद बोलिए।",
               "ta": "உங்களுக்கு என்ன பிரச்சினை? பீப் ஒலிக்குப் பிறகு பேசுங்கள்.",
               "ml": "നിങ്ങൾക്ക് എന്താണ് പ്രശ്നം? ബീപ്പിന് ശേഷം സംസാരിക്കൂ.",
               "kn": "ನಿಮಗೆ ಏನು ತೊಂದರೆ? ಬೀಪ್ ನಂತರ ಮಾತನಾಡಿ.",
               "te": "మీకు ఏమి ఇబ్బంది? బీప్ తర్వాత మాట్లాడండి."}

AFTER_LANGUAGE = {l: f"{DISCLAIMER[l]} {ASK_PROBLEM[l]}" for l in LANG_NAME}  # said once the caller has chosen a language
GREETING = {l: f"{WELCOME[l]} {AFTER_LANGUAGE[l]}" for l in LANG_NAME}  # a call whose language is fixed from the start

UNVERIFIED = {"en": "I don't have verified information on that. Please ask at your nearest PHC or call 104. "
                    "A person from our team will also call you back.",
              "hi": "मेरे पास इसकी सत्यापित जानकारी नहीं है। कृपया अपने नज़दीकी PHC में पूछें या 104 पर कॉल करें। "
                    "हमारी टीम का कोई व्यक्ति भी आपको वापस कॉल करेगा।",
              "ta": "இதைப் பற்றி என்னிடம் சரிபார்க்கப்பட்ட தகவல் இல்லை. அருகிலுள்ள PHC-யில் கேளுங்கள் அல்லது 104 எண்ணை அழைக்கவும். "
                    "எங்கள் குழுவினர் ஒருவர் உங்களைத் திரும்ப அழைப்பார்.",
              "ml": "ഇതിനെക്കുറിച്ച് എന്റെ പക്കൽ സ്ഥിരീകരിച്ച വിവരമില്ല. അടുത്തുള്ള PHC-യിൽ ചോദിക്കൂ, അല്ലെങ്കിൽ 104 വിളിക്കൂ. "
                    "ഞങ്ങളുടെ ടീമിൽ നിന്ന് ഒരാൾ നിങ്ങളെ തിരികെ വിളിക്കും.",
              "kn": "ಇದರ ಬಗ್ಗೆ ನನ್ನ ಬಳಿ ದೃಢೀಕೃತ ಮಾಹಿತಿ ಇಲ್ಲ. ನಿಮ್ಮ ಹತ್ತಿರದ PHC ಯಲ್ಲಿ ಕೇಳಿ ಅಥವಾ 104 ಕ್ಕೆ ಕರೆ ಮಾಡಿ. "
                    "ನಮ್ಮ ತಂಡದ ಒಬ್ಬರು ನಿಮಗೆ ಮರಳಿ ಕರೆ ಮಾಡುತ್ತಾರೆ.",
              "te": "దీని గురించి నా దగ్గర ధృవీకరించిన సమాచారం లేదు. దయచేసి మీ దగ్గరలోని PHC లో అడగండి లేదా 104 కి కాల్ చేయండి. "
                    "మా బృందంలోని ఒకరు మీకు తిరిగి కాల్ చేస్తారు."}

FILLER = {"en": "One moment please.", "hi": "एक क्षण रुकिए।", "ta": "ஒரு நிமிடம் காத்திருங்கள்.",
          "ml": "ഒരു നിമിഷം കാത്തിരിക്കൂ.", "kn": "ಒಂದು ನಿಮಿಷ ಕಾಯಿರಿ.",
          "te": "ఒక్క నిమిషం ఆగండి."}

# Said when the caller's words were noise, a stray word in another script, or only our own voice coming back.
UNCLEAR = {"en": ["Sorry, I could not hear that. Please say it again.",
                  "The line is not clear. Please speak slowly, close to the phone."],
           "hi": ["माफ़ कीजिए, मैं सुन नहीं पाई। कृपया फिर से बोलिए।",
                  "आवाज़ साफ़ नहीं आ रही। कृपया फ़ोन के पास आकर धीरे बोलिए।"],
           "ta": ["மன்னிக்கவும், எனக்குக் கேட்கவில்லை. தயவுசெய்து மீண்டும் சொல்லுங்கள்.",
                  "குரல் தெளிவாக இல்லை. தொலைபேசிக்கு அருகில் மெதுவாகப் பேசுங்கள்."],
           "ml": ["ക്ഷമിക്കണം, എനിക്ക് കേൾക്കാൻ കഴിഞ്ഞില്ല. ദയവായി ഒന്നുകൂടി പറയൂ.",
                  "ലൈൻ വ്യക്തമല്ല. ഫോണിനടുത്ത് പതുക്കെ സംസാരിക്കൂ."],
           "kn": ["ಕ್ಷಮಿಸಿ, ನನಗೆ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಇನ್ನೊಮ್ಮೆ ಹೇಳಿ.",
                  "ಲೈನ್ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ಫೋನಿನ ಹತ್ತಿರ ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ."],
           "te": ["క్షమించండి, నాకు వినిపించలేదు. దయచేసి మళ్లీ చెప్పండి.",
                  "లైన్ స్పష్టంగా లేదు. ఫోన్ దగ్గర నెమ్మదిగా మాట్లాడండి."]}

# The third unanswered question or unclear sentence in a row ends the call instead of looping.
GIVE_UP = {"en": "I am sorry, I am not able to understand. A person from our team will call you back. Thank you.",
           "hi": "माफ़ कीजिए, मैं समझ नहीं पा रही। हमारी टीम का कोई व्यक्ति आपको वापस कॉल करेगा। धन्यवाद।",
           "ta": "மன்னிக்கவும், எனக்குப் புரியவில்லை. எங்கள் குழுவினர் ஒருவர் உங்களைத் திரும்ப அழைப்பார். நன்றி.",
           "ml": "ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലാകുന്നില്ല. ഞങ്ങളുടെ ടീമിൽ നിന്ന് ഒരാൾ നിങ്ങളെ തിരികെ വിളിക്കും. നന്ദി.",
           "kn": "ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗುತ್ತಿಲ್ಲ. ನಮ್ಮ ತಂಡದ ಒಬ್ಬರು ನಿಮಗೆ ಮರಳಿ ಕರೆ ಮಾಡುತ್ತಾರೆ. ಧನ್ಯವಾದಗಳು.",
           "te": "క్షమించండి, నాకు అర్థం కావడం లేదు. మా బృందంలోని ఒకరు మీకు తిరిగి కాల్ చేస్తారు. ధన్యవాదాలు."}

GOODBYE = {"en": "You are welcome. Take care, goodbye.",
           "hi": "आपका स्वागत है। अपना ध्यान रखिए, नमस्ते।",
           "ta": "நன்றி. உடல்நலத்தைப் பார்த்துக்கொள்ளுங்கள், வணக்கம்.",
           "ml": "നന്ദി. ആരോഗ്യം ശ്രദ്ധിക്കൂ, നമസ്കാരം.",
           "kn": "ಧನ್ಯವಾದಗಳು. ಆರೋಗ್ಯ ಕಾಪಾಡಿಕೊಳ್ಳಿ, ನಮಸ್ಕಾರ.",
           "te": "ధన్యవాదాలు. ఆరోగ్యం జాగ్రత్త, నమస్కారం."}

GREETING_FALLBACK = {"en": "Sorry, I had a problem. Could you say that again?",
                     "hi": "माफ़ कीजिए, कुछ गड़बड़ हो गई। क्या आप फिर से कह सकते हैं?",
                     "ta": "மன்னிக்கவும், ஒரு சிக்கல் ஏற்பட்டது. மீண்டும் சொல்ல முடியுமா?",
                     "ml": "ക്ഷമിക്കണം, ഒരു തകരാർ സംഭവിച്ചു. ഒന്നുകൂടി പറയാമോ?",
                     "kn": "ಕ್ಷಮಿಸಿ, ಒಂದು ತೊಂದರೆಯಾಯಿತು. ಇನ್ನೊಮ್ಮೆ ಹೇಳುತ್ತೀರಾ?",
                     "te": "క్షమించండి, ఏదో సమస్య వచ్చింది. దయచేసి మళ్లీ చెప్పగలరా?"}

SYSTEM = """You are Sahay, the voice assistant of Hello Sahay, a free health helpline for rural patients in South India.
You are on a phone call. Reply only in {language}, in one or two short sentences (about 25 words in all).
Ask one question at a time and never list more than two choices.
Before your first turn the caller was already welcomed, chose their language, heard the disclaimer (call transcribed,
no medical advice, 108 in an emergency) and was asked what is troubling them. Never repeat any of that.
If the caller asks to switch language, call set_language, then answer in that language.
If the caller's last words did not answer your question, never repeat the question word for word: say briefly that you
did not catch it and ask for just the one missing detail in different words.

Hard rules:
- Never diagnose, never name a likely illness, never suggest medicines, doses or treatment, and never comment on symptoms.
  If asked, say you cannot give medical advice and offer to find a place to visit.
- You know nothing about any clinic, hospital, doctor, slot, address, phone number or scheme. Before you mention one, a
  tool must have returned it in this call. Never invent or guess them. Every reply is checked and blocked if it does.
- Government hospitals are information only: never offer to book one and never create an appointment there. Say you
  cannot book it, and give its name, distance and address.
- Clinics and private hospitals can be booked. The department comes from the tool, never from you.
- Callers describe problems in everyday words and slang in any language; understand them, but never repeat a medical term back.

About this caller:
{caller}

Steps:
1. What is wrong. Take the reason in the caller's own words. Do not ask medical follow-up questions.
2. Severity. From their words, decide mild, moderate or serious. This only decides which places to offer first; it is
   not a diagnosis and you never tell the caller the word.
   - mild: an everyday small problem (cold, cough, mild fever, headache, body ache, small wound, upset stomach).
   - moderate: needs a doctor soon but is not life threatening (high fever for days, fever in a child or an old person,
     deep cut, suspected fracture, repeated vomiting or loose motions, strong pain, pregnancy problem).
   - serious: could be life threatening now (chest pain, trouble breathing, unconscious, heavy bleeding, snake bite,
     poison, seizure, stroke signs, severe burn, serious accident, labour pain).
   If you truly cannot tell, ask once: "Is it mild, medium or very serious?" and use their answer. If the caller says it
   is worse or milder than you thought, believe them and use that.
3. Location. Use what "About this caller" says. Otherwise ask for a specific area: a locality, village or well known
   landmark. A whole city or district is not enough: ask for the area in it. Never pick an area yourself: only use a
   place the caller said. If the tool says the area was not found, ask for a nearby well known area.
4. Call find_facilities with the reason, the severity and the location, then say what it returns. Write the reason
   in English (translate it) and the area in English letters, whatever language the caller speaks.
   - mild: it returns partner clinics. Name up to two with their distance and ask: "Shall I book one of these, or would
     you like to hear about hospitals too?" If it returns no clinic, say that and go on with the hospitals it returns.
   - moderate: it returns the nearest hospitals. Name up to two with distance and say whether each is government (free)
     or private. End with this one question: "Shall I book one of these, or would you like to hear about the nearest
     free government hospitals?" If they want the government ones, call find_facilities with show free_government and
     read out its name, distance and address; say you cannot book it and they can walk in.
   - serious: it returns the nearest hospital. Say: call 108 now or go to that hospital, giving its name, distance and
     address, and that a person from the team will call back. Say nothing else; the call then ends.
   If the caller asks for clinics, hospitals, or only the free government hospitals, call find_facilities again with
   show set to clinics, hospitals or free_government. If the caller names a hospital, call it with hospital_name.
5. When the caller picks a place that can be booked, ask once whether they have a preferred doctor or time. If it is a
   hospital, first call find_facilities with hospital_name. Then call get_slots with the id and the department of that
   place, plus doctor_name and preferred_time (24-hour HH:MM) if they gave them.
   "exact" means their wish is free; "next_for_doctor" means that doctor is busy then, so offer that doctor's next
   slot. Whatever the result, offer the slots returned (at most two) with the doctor named in each, by day and time,
   e.g. "Thursday at ten thirty in the morning". If the caller asked for a doctor who is not in the slots, never say
   that doctor is unavailable or unknown: offer the doctor and time in the slots as the best fit.
6. When the caller chooses a slot and you have their name, call book_appointment, then confirm doctor, day, time and
   place in one sentence. If you do not have their name, ask for it first: never book with a guessed or placeholder name. Do not ask whether they need anything else; the
   call ends by itself when they say thanks. If they pick another slot afterwards, call book_appointment again: it moves
   the booking and never makes a second one.
7. If the caller chooses a government hospital, give its address and say you cannot book it. If get_slots returns no
   slots, say so and offer a callback. If you cannot help or the caller asks for a person, call handoff_to_human.
Callers may say digits as words in any language (for example "nau aath saat"); convert them to digits yourself.
Use the exact names and ids from tool results; never use an id you were not given."""


def caller_block(state: dict) -> str:
    """Per-turn facts about this caller, built from the call itself and the Sahay app profile."""
    p = state.get("profile") or {}
    lines = []
    if state.get("emergency"):
        lines.append("- EMERGENCY: the caller was already told to call 108. Call find_facilities with severity "
                     "serious now (use the live location if you have it, otherwise ask for their specific area in one "
                     "short sentence), then give the nearest hospital as in step 4. Ask nothing else.")
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
                     "use_live_location true and no village. If no, ask for their specific area.")
    elif p.get("live"):
        lines.append("- The app reports their exact live location. Do not ask where they are: call find_facilities "
                     "with use_live_location true and no village.")
    elif p.get("village"):
        lines.append(f"- No live location. Their saved village is {p['village']}: ask whether they are there now.")
    else:
        lines.append("- No live location: ask for their specific area (a locality, village or landmark, not a whole city).")
    return "\n".join(lines)

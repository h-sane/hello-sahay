# Hello Sahay — Project Brief (Dexathon 2026)

> Handoff for Claude Code. Covers the event rules, every decision made so far, the product, the business case, competitors, architecture, build plan and open questions.
> **Status legend:** ✅ decided · 🟡 proposed, waiting for team confirmation · ❓ open
>
> **Status 2026-10-15:** this is the planning brief written before the build. The decision log (section 11) is still the source of truth for product decisions and now lists the decisions made since (rows 23 onward). Where section 7 differs from the code, the code wins: see [`ARCHITECTURE.md`](ARCHITECTURE.md) for the system as built and [`PRODUCT_FEATURES.md`](PRODUCT_FEATURES.md) for what is built per app.

---

## 0. How Claude Code should use this file
1. Read the whole file before planning. Section 11 (decision log) is the source of truth.
2. **Plan before coding.** Propose the repo structure and a task breakdown mapped to the P0/P1/P2 tiers (Section 8), then build P0 end to end before touching P1.
3. **Commit early and often, with clear messages.** Judges inspect GitHub history (Section 1).
4. Never let the AI make medical decisions (Section 4). Treat these guardrails as hard requirements.
5. If something here is marked "verify", check it (docs, console) before building on it.

---

## 1. Event context
- **Event:** Dexathon 2026 (Sathyabama). Hello Sahay is our prototype for it.
- **Rounds:** 1, idea deck (PPT); 2, working prototype, judged online; 3, a 24-hour on-site build that extends the prototype.
- **Theme:** ✅ **Healthcare**, software category. Our focus: access to essential healthcare information and services for rural and underserved patients (health-service navigation, booking, scheme coverage, multilingual advisories).
- **Our domain rule:** no unsupported diagnosis, treatment advice or autonomous medical decisions.
- **What judges look at:**
  - The product and the business plan together.
  - A public GitHub repository with clear commits; anything pre-existing is shown in its own commit.
  - A self-built core; ready-made tools alone earn less credit.
  - Quality beyond the core: security, privacy, affordability, accessibility.
- **Vision for round 3:** healthcare is the first service; the same helpline grows into a general helper for rural, urban and elderly people, with more services and languages.
- **Architecture implication:** keep the system modular so new requirements can be added without rewrites.

---

## 2. How we got here
Ideas considered and rejected, so nobody re-proposes them:
- **First shortlist (too generic; many teams will pitch these):** four-bin waste compliance app, Digital Arrest scam interrupter, ASHA voice logbook, technician skill passport, PHC availability bot, fake UPI screenshot checker.
- **Second shortlist (sharper):**
  - Snakebite golden-hour navigator (Tamil Nadu made snakebite notifiable on 4 Nov 2024)
  - Verified plastic EPR credits from waste pickers (700,000 fake certificates were found)
  - DPDP compliance kit for schools
  - PM Internship Scheme no-show fixer (about 8,700 joined from 82k+ offers)
  - WhatsApp malicious-APK checker
- **Final choice:** the team's own idea, an **Indian, rural, multilingual version of EMMA**. EMMA is the UK's AI GP phone receptionist by QuantumLoopAI. It was refined through critique into the product below.
- **Lesson from EMMA:** in Sept 2026, Fakenham Medical Practice dropped it over complaints. Patients with regional accents or speech difficulties couldn't get through, and a stroke survivor at a Doncaster surgery repeatedly failed to book. → We build for dialects and code-mixing, with a keypad fallback and an always-available human handoff. This is a pitch point.

---

## 3. Product
### 3.1 Name
- 🟡 **Hello Sahay** (working name). "Sahay" means help and is understood across most Indian languages; "Hello" is how every Indian answers the phone.
  - **Hello Sahay**: the free AI voice helpline
  - **Sahay**: the patient mobile app
  - **Sahay Desk**: the hospital dashboard and AI receptionist
- Team liked "Sahay" and wanted a prefix or suffix. Alternatives considered: JanSahay (sounds like a government scheme), SwasthSahay, Sahay Saathi.
- Avoid "Setu" and "Sanjeevani" (government apps Aarogya Setu and eSanjeevani). Avoid the spelling "SahAI" (Sankara Eye Foundation's AI voice feedback system).
- Name must be pan-Indian, not Tamil-specific.

### 3.2 One-liner and positioning (the USP)
> **"Other AI receptionists answer a hospital's phone. Hello Sahay answers the patient's question: where to go, what's covered and when to show up. Then it books it."**

- **Patient-first, across many hospitals.** Every Indian AI receptionist (Hellodesk, HuskyVoice and others) serves one hospital's number. Hello Sahay is the patient's number for any hospital.
- **Government and private in one call:** nearby PHC info, which hospitals accept **PM-JAY / CMCHIS** cashless cards, scheme eligibility, and the nearest Jan Aushadhi Kendra.
- **Voice-first for feature phones.** Every patient-side competitor is app-first.
- **Hospitals get new patients, not just answered calls.** Bookings from the free network justify pricing above the ₹1,999 a month market floor.
- **Network effect:** more hospitals make the helpline more useful, and more callers make Sahay Desk worth more.

### 3.3 The three products
1. **Hello Sahay helpline** (free for callers)
   - Talks to the caller in their language (Hindi, Tamil, English for the MVP).
   - Finds facilities and books, reschedules or cancels appointments.
   - Answers health-information questions only from government advisories, with citations.
   - Checks PM-JAY / CMCHIS coverage and points to schemes.
   - Detects emergencies and redirects to 108/112.
   - Hands off to a human when needed.
   - **Not positioned as an emergency service.**
2. **Sahay patient app** (Expo React Native; real mobile app)
   - Appointments: view, reschedule, reminders
   - "Call Sahay" button that runs the same voice pipeline
   - **Medicine strip scan:** photograph the printed back of the strip, OCR the brand and composition, show same-salt, same-strength, same-form generics and the nearest Jan Aushadhi Kendra
   - Medicine alarms
   - Government advisories feed with citations
   - One-stop links for government health services
   - In-app chatbot for navigation and admin questions only
3. **Sahay Desk** (hospital web dashboard, Next.js)
   - Live appointment book and slot management
   - Call transcripts and summaries
   - Human-handoff queue
   - Patient confirmations and reminders over WhatsApp
   - No-show tracking and basic analytics
   - Forward the hospital's existing phone number to Sahay (go-to-market wedge)

---

## 4. Safety and compliance guardrails (hard requirements)
- **No AI diagnosis, treatment advice or autonomous medical decisions.** The models only:
  - retrieve and quote government advisories (RAG), **spoken close to verbatim with the source named**, e.g. "As per Tamil Nadu Health Department…"
  - call deterministic tools (search, booking, coverage lookup)
- **Low retrieval confidence, or the caller describes symptoms and asks what it is:** fixed safe reply ("Please visit your nearest PHC / call 108"), offer to book, or hand off to a human.
- **Emergency detector runs before the LLM**, using keywords plus a classifier in all three languages: chest pain, can't breathe, unconscious, snakebite, heavy bleeding, poisoning, labour pain, suicide. On a match: immediately say "Call 108 / 112", offer a human transfer, and log it.
- **Medicine feature:** show only **same composition, same strength, same dosage form** generics from trusted sources (the Jan Aushadhi / PMBI product list; verify the format it's published in). **Never** show a different molecule or an Ayurvedic substitute. Always add "Confirm with your doctor or pharmacist before switching." OCR reads printed strips, never handwriting.
- **In-app chatbot:** scoped to navigation, admin, schemes and advisories, with the same refusal and redirect rules.
- **Privacy (DPDP Act):**
  - consent line at the start of every call
  - minimal data stored; no audio recordings stored by default (transcripts only, with consent)
  - encryption in transit and at rest
  - host in **AWS Mumbai (ap-south-1)** if Bedrock models are available there (verify)
- **Accessibility:** voice-first, keypad fallback, large-text and high-contrast app UI, works on low-end Android.
- **Proposal wording:** "No diagnosis or treatment decisions are made by AI. All health information is retrieved verbatim from government sources with citations. The medicine feature only shows same-composition generics from the Jan Aushadhi list and directs users to confirm with a pharmacist."

---

## 5. Business model
### 5.1 Who pays
| # | Stream | Status | Notes |
|---|---|---|---|
| 1 | **Hospitals and clinics: Sahay Desk SaaS** | ✅ main revenue | Small and mid private hospitals and nursing homes in tier-2/3 towns serving rural catchments |
| 2 | **Per-booking fee** for bookings arriving through the free helpline network | ✅ direction | **Funds the free helpline.** Bharosa AI is testing a similar $1–2 per qualified lead |
| 3 | **"Care for parents" plan** paid by urban or migrant children for rural parents | ✅ direction | Medicine alarms, appointment tracking, missed-dose alerts. Gap vs. Anvayaa and Samarth, which are human-staffed, premium and metro-only. Rough idea ₹99–199 a month ❓ |
| 4 | **State / CSR sponsorship** of helpline minutes, or licensing as an AI layer for state 104 helplines | ✅ direction | States already outsource 104 and 108 (EMRI runs 104 for Tamil Nadu and others) |

- ✅ **Helpline is free for callers.** Core patient features stay free.
- ✅ Do **not** charge rural patients for advisories (free on government sites; looks exploitative) or for appointment checks (hospitals want patients to show up, so hospitals pay).

### 5.2 Hospital pricing model ❓ (to decide)
| Model | Pro | Con |
|---|---|---|
| Per call / per minute | Revenue tracks cost | Unpredictable bills scare small clinics |
| Flat monthly | Predictable, easy to sell | We absorb call-heavy clinics |
| **Hybrid: monthly plan with included calls, plus per-booking fee above** (suggested) | Industry standard (Exotel-style); protects margin | Slightly more complex |

- Avoid a "one-time subscription": recurring per-minute costs need recurring revenue.
- **Pricing anchors:**
  - competitor receptionists cost **₹1,999–9,999 a month** (Hellodesk, HuskyVoice from ₹1,999; Voxerra from ₹4,999)
  - production voice AI costs **₹3–9 per connected minute** (Caller.digital)
  - Caller.digital claims a **32% median outpatient no-show rate** in India (vendor claim; cite with care)
- **Unit economics to compute before the pitch:** cost per call (speech-to-text + LLM + text-to-speech + telephony) × average call length vs. revenue per booking.

### 5.3 Go-to-market
1. ✅ **Wedge:** forward each partner hospital's **existing number** to Sahay. The hospital gets value on day one from its own callers, which solves the chicken-and-egg problem.
2. Then aggregate those hospitals behind the shared **Hello Sahay** helpline number.
3. Channels:
   - local doctors' associations and nursing-home associations in tier-2/3 Tamil Nadu towns
   - rural partners like iKure (7,900+ villages, 11 states) and Karma Primary Healthcare
   - FPOs, SHGs and panchayats for helpline awareness
   - state health missions and 104 operators for business-to-government
4. Business member: **call 2–3 local clinics during the hackathon** for real quotes on receptionist salary, missed calls and willingness to pay. Real interviews are strong pitch evidence.

### 5.4 Answers to likely jury challenges
- **"Isn't this just Hellodesk?"** No. They serve one clinic; we're the patient's network across government and private facilities, with schemes, and we send hospitals new patients.
- **"Practo and Ringg could go rural."** Their model is private-hospital commission. Rural demand needs a government and scheme layer they won't build.
- **"The government will add AI to 104 or eSanjeevani."** We license to them as the AI layer.
- **"Why not just use Sarvam?"** Sarvam is a toolkit; we're the product and the network.
- **"Voice AI fails on accents."** EMMA proves the risk; we have a keypad fallback, human handoff and dialect-tolerant handling.
- **"Are you funnelling poor patients to private hospitals?"** No. We show free government options first and flag PM-JAY / CMCHIS cashless hospitals.

---

## 6. Competitor landscape (summary)
**A. Hospital-side AI receptionists (crowded; not our USP):**
- **Hellodesk:** 7 languages, ₹1,999–9,999 a month, Mumbai hosting, DPDP
- **HuskyVoice.AI:** from ₹1,999 a month; has a Chennai page
- **Voxerra:** 11 languages, from ₹4,999 a month
- **Tatkal Doctor:** Hindi and English, WhatsApp reminders
- **Caller.digital:** hospital-system integration, no-show recovery
- **Bharosa AI (Mira):** pre-revenue in June 2025, urban
- **Ringg AI:** powers Practo's 2,500+ hospitals, 1,000+ bookings a day, $15.5M raised in 2026
- **Praktice.ai:** "Sarah" care navigation
- **Voiceoc:** BIRAC-backed
- **Sarvam:** platform with booking-agent templates
- Others: AIOnCalls, MantraAssist, Curefy, Vocaldice, Bolna, Gnani

→ **All are single-hospital, urban-leaning, none rural or patient-first.**

**B. Patient-side and government:**
- **Practo:** urban, app-first, private only
- **eSanjeevani:** 500M+ teleconsultations, 15 languages, linked to 112; teleconsultation, not navigation or booking
- **104 helpline (EMRI):** human advice only, no booking
- **Kilkari (ARMMAN + MoHFW):** ~78M women reached, maternal outbound calls; ARMMAN ran it until July 2026
- **Jugalbandi (Microsoft + AI4Bharat):** WhatsApp scheme bot, 2023 pilot, health not covered
- **Ayushman / PM-JAY app:** app only, no voice or booking
- **iKure, Karma:** physical rural care delivery; potential partners

**C. Medicine and generics (commodity; not our USP):**
- **Truemeds:** ₹500 crore revenue, $400M+ valuation, 75% tier-2+ customers, about 47% savings
- **Tata 1mg:** shows substitutes
- **Janaushadhi Sugam:** government app; finds Kendras, compares prices

→ Our only addition is voice access for feature-phone users plus routing to the nearest Kendra.

**D. Caregiver:** Anvayaa and Samarth are human care managers, premium and metro. A low-cost, tech-only rural-parent plan is open space.

---

## 7. Technical design
### 7.1 Stack (✅ unless marked)
| Layer | Choice | Notes |
|---|---|---|
| Patient app | ~~Expo (React Native)~~ → **Vite + React web app, wrapped for Android with Capacitor** (built, see decision log 23) | UI prototyped first in **Google AI Studio**. Use the prototype as a **UI and flow reference only**: it generates React *web* code wired to Gemini, often with the API key in the browser. Don't keep its architecture. Commit the AI Studio export as its own commit ("UI prototype from AI Studio"). Demo on a physical Android phone (Expo Go or a local APK build; don't depend on EAS cloud build queues) |
| Hospital dashboard | ~~Next.js~~ → **Vite + React** (`apps/desk`), plus a static admin console (`apps/admin`) | Built; see decision log 23 |
| Backend API | 🟡 **FastAPI (Python)** | Team already uses it; assumed, confirm |
| Database | PostgreSQL (+ **pgvector** for RAG) | Local Docker for dev; RDS or EC2 for the demo |
| LLM | **AWS Bedrock** | Small, fast model (Haiku-class) for live voice turns; larger model for RAG answers and medicine OCR. Verify region availability and that the $200 credits cover Bedrock (promo credits sometimes exclude Marketplace models) |
| Speech-to-text | **Amazon Transcribe streaming** for English and Hindi on fixed-language calls; **Sarvam `saarika:v2.5`** for Tamil and for `lang=auto` phone calls (built) | Supports hi-IN, ta-IN, en-IN (plus te, kn, ml, bn, mr, gu) with streaming. Verify streaming language identification; otherwise use a language-choice prompt at call start |
| Text-to-speech, Hindi + English | **Amazon Polly** | Polly lists only **hi-IN and en-IN** among Indian languages |
| Text-to-speech, Tamil | ✅ **Sarvam `bulbul:v3`** (decided and built) | **Polly has no Tamil.** Sarvam also gives an "Indian AI stack" pitch line. Check free tier and keys early |
| Speech-to-speech | Not used | AWS forum answer (a year old) says Nova Sonic supports English only |
| Voice orchestration | Self-built WebSocket pipeline or open-source **Pipecat / LiveKit** | **Don't** use a ready-made agent platform (Vapi, Bolna) as the core; the FAQ gives it less credit |
| OCR (medicine strip) | Bedrock vision model, or Amazon Textract | Printed text only. Extract brand, composition, strength, form → match against the generics table |
| Embeddings | 🟡 Bedrock multilingual embeddings (Cohere Embed Multilingual or Titan v2) | Verify Hindi and Tamil quality |
| Messaging | **WhatsApp Cloud API test number** (Meta) | Hussain has set up the WhatsApp Business API before. A test number can message only a few verified recipients, which is fine for the demo. **SMS in India needs DLT registration**, so don't plan on SMS for the demo |
| Telephony | Bonus only | **A real Indian number won't be ready in 24h.** Exotel needs business KYC (2–3 business days); trial accounts get shared numbers, limited minutes, no WhatsApp. Twilio India numbers also need regulatory docs. **Main demo = browser or in-app "Call Sahay" streaming audio through the same pipeline.** Optional: a Twilio trial number. *As built: Exotel's Indian number 044-481-36970 reaches the same pipeline; Twilio was dropped.* |
| Hosting | AWS (Mumbai region preferred) | Data residency is a DPDP pitch point. *As built: one Lightsail instance in ap-south-1, deploys from `main`* |

### 7.2 Repo layout (as built)
```
hello-sahay/
  apps/
    patient-web/    # patient app: Vite + React, Android APK via Capacitor
    desk/           # Sahay Desk: Vite + React, role-based tabs
    admin/          # Hello Sahay admin console: one static index.html
    web/, patient/  # earlier Next.js and Expo builds, not deployed
  services/
    api/            # FastAPI: facilities, slots, bookings, patients, auth, chat RAG, medicines, Care plan, admin
    voice/          # CallSession pipeline (pipeline/) + phone bridge (telephony/)
  data/             # seed/ (DEMO DATA), advisories/, medicines/, schemes/
  deploy/           # Lightsail stack: docker compose, Caddy, self-updating deploy script
  scripts/          # loaders, call_trace.py, sim_call.py
  docs/             # this file, ARCHITECTURE.md, diagrams/
```

### 7.3 Voice call flow (design; as built see `services/voice/README.md`)
1. **Consent and language:** "This call is handled by Sahay's AI assistant… say your language / press 1 Hindi, 2 Tamil, 3 English." Detect automatically if Transcribe language identification works.
2. Audio streams to Transcribe; transcript chunks go to the **safety gate** (emergency detector + symptom/diagnosis-request detector).
3. If it's safe, the transcript goes to the Bedrock LLM with a strict system prompt and **tools**:
   - `find_facilities(location, specialty?, scheme?)` (government and private, sorted by distance; free government options shown first)
   - `get_slots(facility_id, doctor_id?, date)`
   - `book_appointment(...)`, `reschedule(...)`, `cancel(...)`
   - `check_scheme_coverage(facility_id, scheme = PMJAY|CMCHIS)`
   - `search_advisories(query, lang)` returns passages with `source_title`, `issuer` and `url`; the answer must quote them
   - `find_jan_aushadhi_kendra(location)`
   - `send_confirmation(patient, booking)` (WhatsApp)
   - `handoff_to_human(reason)`, which puts the call in the Sahay Desk queue
   - `emergency_redirect()`
4. Response goes to text-to-speech in the caller's language (Polly for Hindi and English; Sarvam or Google for Tamil) and streams back.
5. **Keypad fallback** for confirmations (e.g. "press 1 to confirm") and a **human handoff available at any time**.
6. Store a transcript and structured summary (with consent), shown live on Sahay Desk.
- **Latency target:** roughly 1–2 seconds per turn. Use the small model, streaming speech in both directions, and short prompts. Test on venue Wi-Fi early.

### 7.4 Core data model (starting point)
- `facility` (id, name, type: PHC / CHC / GH / private, address, lat, lng, phone, hours, languages, pmjay_empanelled, cmchis_empanelled, is_partner)
- `doctor` (id, facility_id, name, specialty, languages)
- `slot` (id, doctor_id, start, end, status)
- `patient` (id, name, phone, preferred_lang, village, consent_flags, caregiver_phone?)
- `appointment` (id, patient_id, slot_id, source: helpline / app / desk, status, created_at)
- `call` (id, patient_id?, lang, transcript, summary, outcome, emergency_flag, handoff_flag, started_at, duration)
- `advisory_chunk` (id, doc_id, text, lang, embedding, source_title, issuer, url, published_date)
- `medicine_generic` (id, composition, strength, form, generic_name, mrp, source)
- `reminder` (id, patient_id, type: appointment / medicine, schedule, channel)

### 7.5 Seed and demo content
- **One demo district in Tamil Nadu** (pick one near Chennai) with about 8–12 facilities (mix of PHCs, a government hospital and private nursing homes), doctors, slots and scheme flags. **Clearly label as demo data.**
- **Advisory corpus (RAG):** official sources only, such as MoHFW / NHM / Tamil Nadu Health Dept advisories (dengue, heat, snakebite first aid, vaccination schedule under the Universal Immunization Programme), PM-JAY and CMCHIS FAQs, and Jan Aushadhi information. Store the issuer, URL and date for every chunk.
- **Generics table:** from the Jan Aushadhi product list (verify download format).

---

## 8. Build plan
### 8.1 Feature tiers
**P0 (must work live, end to end):**
- Voice agent in **Hindi, Tamil and English** that **finds a facility and books, reschedules or cancels**
- **Sahay Desk** showing the booking live, plus transcript and handoff queue
- **WhatsApp confirmation**
- **Emergency redirect** (108/112) and **human handoff**
- **Cited RAG answers** from government advisories
- 🟡 **PM-JAY / CMCHIS "which hospital takes my card" lookup**, proposed for promotion from P1 to P0 because it's the clearest edge

**P1 (working but simple):**
- Patient app with appointments, "Call Sahay", medicine alarms and advisories feed
- Ayushman / CMCHIS lookup, if not done in P0
- Navigation chatbot in the app

**P2 (real UI with seeded data):**
- 🟡 Medicine strip OCR + generic finder + nearest Jan Aushadhi Kendra, proposed to move down from P1 because Truemeds and Janaushadhi Sugam already cover it
- Government services links hub
- Caregiver plan screens
- Analytics (no-shows, call outcomes, language mix)

### 8.2 Demo script (rehearse it; build toward it)
1. **Tamil caller** (browser "Call Sahay"): "My mother has fever for three days; which hospital near [village]? She has a CMCHIS card." The bot doesn't diagnose. It lists the nearest options, flags the CMCHIS-empanelled hospital and books a slot.
2. **Sahay Desk** updates live with the booking, transcript and summary.
3. **WhatsApp confirmation** arrives on a judge's or teammate's phone.
4. **Hindi caller** asks about dengue precautions. The bot gives a near-verbatim answer, naming the source.
5. **Emergency:** "chest pain, can't breathe". The bot immediately redirects to 108 and puts the call in the handoff queue.
6. **Patient app:** appointment visible, medicine alarm set, and the strip scan if built.
7. **Pitch close:** "One number. Any language. Any hospital."

### 8.3 Team of 4 (suggested roles)
1. **Voice pipeline:** Transcribe ↔ safety gate ↔ Bedrock tools ↔ text-to-speech; latency.
2. **Backend API + data:** FastAPI, Postgres, seed data, RAG ingestion, booking tools; first responder for new requirements.
3. **Frontends:** Sahay Desk (Next.js) and the patient app (Expo), using the AI Studio prototype as reference.
4. **Business:** clinic calls and interviews, pricing and unit economics, competitor slide, pitch deck, demo script; owns the jury story.

### 8.4 Milestones
1. **Foundations:** architecture diagram, repo with commits, AI Studio UI prototype, seed data, a "hello world" voice round-trip in one language.
2. **First booking:** P0 booking flow working in one language end to end; Desk shows bookings.
3. **Core complete:** all 3 languages, RAG with citations, emergency gate, WhatsApp confirmation.
4. **Patient app and hardening:** P1 patient app; hardening; latency tuning.
5. **Feature freeze:** P0/P1 frozen; P2 only if stable.
6. **Demo ready:** demo rehearsals, fallbacks (recorded backup video of the demo), deck final, submission.

### 8.5 Known risks and mitigations
| Risk | Mitigation |
|---|---|
| No Indian phone number in time for the demo | Browser / in-app call is the main demo; telephony trial is a bonus |
| Voice latency or accuracy in a noisy hall | Small model, streaming, short prompts, headset mic, test early on venue Wi-Fi; keypad fallback |
| Tamil text-to-speech not on AWS | Sarvam or Google TTS; get API keys in the first hour |
| Bedrock credits or region gaps | Verify in the first hour; pick a region with the needed models |
| Claude Pro usage limits with 4 people on Opus | Use Opus for architecture and hard bugs; route routine code to other tools (Trae / DeepSeek); avoid a late-night stall |
| WhatsApp test-number limits | Pre-verify demo recipients' numbers |
| SMS DLT registration | Don't use SMS for the demo |
| Integration bugs late at night | P0 end to end first; feature freeze before the demo |
| Jury reads "alternatives" as treatment advice | Use "same-composition generic finder" wording + pharmacist disclaimer |
| New requirements in the on-site round | Modular services; the backend owner handles them first |

---

## 9. Pitch material: key facts with sources
- EMMA (UK) dropped by Fakenham GP in Sept 2026 over accent and booking failures. [ResultSense](https://www.resultsense.com/news/2026-09-23-fakenham-gp-drops-emma-ai-receptionist/) · [Silicon UK](https://www.silicon.co.uk/cloud/ai/ai-gp-receptionist-631237) · [Rory Cellan-Jones](https://rorycellanjones.substack.com/p/dear-ai-emma-youre-fired)
- Indian AI receptionists priced ₹1,999–9,999 a month. [Hellodesk](https://hellodesk.cc/) · [HuskyVoice](https://www.huskyvoice.ai/healthcare-voice-ai) · [Voxerra](https://voxerra.in/) · [MantraAssist list](https://mantraassist.com/ai-receptionist/ai-receptionist-companies-india/)
- Voice AI ₹3–9 per connected minute; 32% median no-show (vendor claim). [Caller.digital](https://caller.digital/blog/ai-voice-agent-hospital-appointment-booking-india)
- Ringg powers Practo's 2,500+ hospitals; $15.5M raised. [Ringg case study](https://www.ringg.ai/case-studies/how-practo-transformed-patient-booking-with-ringg-ai-voice-agent) · [Mezha](https://mezha.net/eng/bukvy/d588171e_indian_startup_ringg/)
- Bharosa AI (Mira) model and pricing ideas. [Inc42](https://inc42.com/startups/can-bharosas-voice-based-ai-be-the-healthcare-gamechanger-for-tier-ii-iii-india/)
- Sarvam booking agents. [Sarvam](https://www.sarvam.ai/voice-agents/appointment-booking)
- eSanjeevani 50 crore teleconsultations, 15 languages (Oct 2026). [News On AIR](https://newsonair.gov.in/esanjeevani-achieves-milestone-of-50-cr-teleconsultations-from-across-the-country/)
- 104 helpline (EMRI): advice only; 1.39 crore calls. [EMRI](https://www.emri.in/104-medical-helpline/)
- Kilkari ~78M women reached. [ARMMAN](https://armman.org/kilkari/)
- Jugalbandi: WhatsApp scheme bot, health not covered. [Microsoft](https://news.microsoft.com/source/asia/features/with-help-from-next-generation-ai-indian-villagers-gain-easier-access-to-government-services/)
- iKure: 7,900+ villages, $1.8M raised Sept 2026. [UNI](https://www.uniindia.com/business-wire-india/global-healthcare-leaders-back-ikures-usd-18-million-pre-series-a-to-scale-technology-enabled-primar/173746) · [Karma Primary Healthcare](https://karmaprimaryhealthcare.in/)
- Truemeds: generic substitution at scale. [TechCrunch](https://techcrunch.com/2025/08/10/truemeds-challenged-how-indians-buy-medicine-and-saw-a-3-6x-jump-in-valuation) · [Janaushadhi Sugam](https://www.drishtiias.com/daily-updates/daily-news-analysis/janaushadhi-sugam-mobile-app/print_manually)
- Anvayaa elder care. [Dealroom](https://app.dealroom.co/companies/anvayaa_kin_care_pvt_)
- AWS language support. [Transcribe](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html) · [Polly](https://docs.aws.amazon.com/polly/latest/dg/supported-languages.html) · [Nova Sonic re:Post](https://repost.aws/questions/QUNWRKev1KQOSaefv9iCCm5w/inquiry-regarding-amazon-nova-sonic-for-advanced-voice-capabilities)
- Exotel KYC and trial limits. [Exotel docs](https://developer.exotel.com/docs/faqs/account-setup)

---

## 10. Open questions ❓
1. Confirm the name: **Hello Sahay**, or an alternative.
2. Hospital pricing model (hybrid suggested) and actual numbers; caregiver plan price.
3. Tamil text-to-speech provider: Sarvam vs. Google.
4. Backend: FastAPI (assumed).
5. Bedrock models and region available on the account; whether credits cover them.
6. Confirm 🟡 tier changes: PM-JAY / CMCHIS lookup → P0; medicine OCR + generics → P2.
7. Demo district and facility list.
8. Team member names and role assignment.
9. Exact embedding model for Hindi and Tamil RAG.

---

## 11. Decision log (source of truth)
| # | Decision | Status |
|---|---|---|
| 1 | Domain: Rural Healthcare | ✅ |
| 2 | Concept: Indian, rural, multilingual EMMA-style AI voice assistant; learn from EMMA's accent and booking failures (keypad fallback, human handoff) | ✅ |
| 3 | Name: **Hello Sahay** (helpline) / **Sahay** (app) / **Sahay Desk** (hospital); pan-Indian, not Tamil-specific | 🟡 |
| 4 | Three products: free AI voice helpline, patient mobile app, hospital dashboard with AI reception | ✅ |
| 5 | USP: patient-first, cross-hospital, government + private, voice-first for feature phones; hospitals get *new patients*. The AI receptionist alone is **not** the USP (crowded market) | ✅ |
| 6 | No AI diagnosis or treatment decisions; RAG over government advisories, spoken near-verbatim with citations; low confidence or symptoms → 108 / PHC / human | ✅ |
| 7 | Medicine feature = OCR of the printed strip → same salt, strength and form generics from trusted sources (Jan Aushadhi) + "confirm with pharmacist"; no different molecules | ✅ |
| 8 | Helpline free for callers; not positioned as an emergency service; emergency gate before the LLM redirects to 108/112 | ✅ |
| 9 | Patients don't pay for advisories or appointments; core patient features free | ✅ |
| 10 | Revenue: hospital SaaS (main) + per-booking fee (funds the helpline) + caregiver plan paid by urban or migrant relatives + state / CSR / 104 licensing | ✅ |
| 11 | Hospital pricing model (hybrid suggested) and numbers | ❓ |
| 12 | Go-to-market wedge: forward each hospital's existing number to Sahay; shared helpline aggregation next | ✅ |
| 13 | MVP languages: Hindi, Tamil, English | ✅ |
| 14 | Stack: AWS-first (Transcribe, Polly for hi/en, Bedrock); Tamil text-to-speech via Sarvam or Google; Mumbai region if possible | ✅ (Tamil provider settled in 25) |
| 15 | Patient app: a real Expo React Native app; UI prototyped in Google AI Studio (reference only, committed separately), built with Claude Code | ✅ (superseded by 23) |
| 16 | Backend FastAPI; dashboard Next.js; Postgres + pgvector | ✅ FastAPI and Postgres; dashboard superseded by 23 |
| 17 | Demo: browser or in-app "Call Sahay" through the real pipeline; real phone number is a bonus (KYC delays) | ✅ |
| 18 | Build the voice pipeline ourselves (WebSocket / Pipecat / LiveKit), not a ready-made agent platform | ✅ |
| 19 | Tiers P0 / P1 / P2 as in Section 8.1 | ✅ |
| 20 | Promote PM-JAY / CMCHIS lookup to P0; demote medicine OCR + generics to P2 | 🟡 |
| 21 | WhatsApp for confirmations; no SMS for the demo (DLT) | ✅ |
| 22 | Possible partners: iKure, Karma (rural reach); state 104 operators (business-to-government) | ✅ |
| 23 | Frontends built as Vite apps, not Expo and Next.js: patient app is a web app wrapped for Android with Capacitor; Desk is Vite; admin console is one static page | ✅ |
| 24 | Telephony: Exotel Indian number (044-481-36970) reaches the same CallSession pipeline over WebSocket; Twilio dropped | ✅ |
| 25 | Tamil: Sarvam for speech-to-text and text-to-speech; `lang=auto` phone calls use Sarvam to detect English, Hindi or Tamil | ✅ |
| 26 | Hosting: one AWS Lightsail instance in ap-south-1; pushing to `main` redeploys within a minute | ✅ |
| 27 | One demo hospital (Sunrise Nursing Home) receives every booking and call; hospital names, distance and scheme tags are real (OpenStreetMap, CMCHIS list), doctors, slots and bookings are demo | ✅ |
| 28 | Hospital roles: Hello Sahay `admin`, then `hospital_admin`, `receptionist`, `nurse`, `doctor` (doctor sees only own patients) | ✅ |
| 29 | Ask Sahay answers from the verified corpus first, then a live search limited to official government sites with the page cited | ✅ |
| 30 | Medicines use real data (246k brands, PMBI list); a vision model only reads the label, a fixed program picks the generic | ✅ |
| 31 | Care plan ₹149/month paid by a family member; payment is a demo until Razorpay keys exist; patient sign-in code shown on screen because India SMS needs DLT | ✅ |
| 32 | Every call keeps a timestamped trace in the backend; no audio is stored | ✅ |

# Hello Sahay — Features by App

One page per product: what each app is, who uses it, and every feature we have decided to build, with its tier and task card. Details live in the linked docs; this page is the overview.

Sources: [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) (decision log §11, tiers §8.1) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`PATIENT_APP_SPEC.md`](PATIENT_APP_SPEC.md) · [`IMPLEMENTATION_PHASES.md`](IMPLEMENTATION_PHASES.md) · [`FRONTEND_DELIVERABLES.md`](FRONTEND_DELIVERABLES.md). Business side: [`BUSINESS.md`](BUSINESS.md).

**Tiers:** P0 must work live end to end · P1 working but simple · P2 real UI on seeded data. **Cards** are the task IDs in `IMPLEMENTATION_PHASES.md`. **Status:** everything below is *planned* until a card is marked done in its handoff.

## The five parts at a glance

| # | Product | Used by | Folder | Pays? |
|---|---|---|---|---|
| 1 | **Hello Sahay helpline** (voice) | Patients, any phone | `services/voice/` | Free for callers |
| 2 | **Sahay patient app** (Expo, Android-first) | Rural patients, elderly users, their city-based children | `apps/patient/` | Free core; Care plan ₹149/month |
| 3 | **Sahay Desk** (hospital web dashboard) | Hospital reception and doctors | `apps/web/` → `/desk` | ₹2,999/month + ₹40 per arrived patient |
| 4 | **Admin console** (our team, web) | The Hello Sahay team | `apps/web/` → `/admin` | Internal |
| 5 | **Browser "Call Sahay"** demo page | Judges, demo, web visitors | `apps/web/` → `/call` | Free |

Behind all five: one **backend API** (`services/api/`, FastAPI + PostgreSQL/pgvector) and one **safety gate**, so every surface follows the same rules.

---

## 1. Hello Sahay helpline (voice)

Languages: Tamil, Hindi, English. Not an emergency service.

| Feature | Detail | Tier | Card |
|---|---|---|---|
| Consent and language choice | Consent line at call start; speak or press 1 Tamil / 2 Hindi / 3 English | P0 | P1-5, P1-6 |
| Speech in, speech out | Amazon Transcribe in; Polly (Hindi, English) and Sarvam or Google TTS (Tamil) out | P0 | P1-5, P1-6 |
| Emergency gate | Runs before the LLM on every utterance (chest pain, cannot breathe, unconscious, snakebite, heavy bleeding, poisoning, labour pain, suicide); says "Call 108 / 112", offers a human, logs it | P0 | P1-4, P1-7 |
| Find a facility | Nearby facilities, **government first**, with PM-JAY / CMCHIS flags | P0 | P1-5 |
| "Which hospital takes my card" | PM-JAY and CMCHIS coverage lookup | P0 (proposed promotion) | P1-5 |
| Book, reschedule, cancel | Partner hospital: offer slots and book; non-partner: give address, phone, hours, directions | P0 | P1-3, P1-5 |
| Department by keyword table | Fixed lookup, never an AI judgement (no triage) | P0 | P1-2 |
| Cited health answers | Close to verbatim from government advisories, source named aloud; fixed safe reply if confidence is low | P0 | P1-9, P1-10 |
| Symptom questions | Fixed safe reply: nearest PHC / 108, offer to book, or human | P0 | P1-4 |
| WhatsApp confirmation | Sent on booking; directions sent for non-partner hospitals | P0 | P1-8 |
| Keypad fallback | Press-to-confirm for accents or speech difficulty (the EMMA lesson) | P0 | P1-5 |
| Human handoff, any time | Call lands in the Desk handoff queue with the reason | P0 | P1-7 |
| Call log | Transcript and structured summary stored (no audio by default) | P0 | P1-7 |
| Jan Aushadhi Kendra finder | Nearest Kendra by voice | P2 | P2-6 |
| Real phone number | Twilio trial number, bonus only (Indian numbers need KYC, 2–3 days) | P2 bonus | P2-7 |

## 2. Sahay patient app

Design rules (all screens): Tamil / Hindi / English from translation files; mic on every input, read-aloud on every answer; body text ≥ 18sp, buttons ≥ 56dp, high contrast, max 4 options per screen; loading, empty, error and limit states everywhere; every fact shows source and date; "does not diagnose, call 108" always visible. Full list: [`PATIENT_APP_SPEC.md`](PATIENT_APP_SPEC.md).

### Free

| Feature | Detail | Tier | Card |
|---|---|---|---|
| Onboarding | Language picker, plain-language DPDP consent, phone + OTP (demo OTP `123456`), profile | P1 | P1-12 |
| Home | Four tiles (Ask Sahay, My Medicines, Appointments, Call Sahay), latest advisory card, fixed red **Call 108** bar | P1 | P1-12 |
| Ask Sahay chat | RAG over government advisories; source chip on every answer; no-source fallback; symptom and emergency states; quick-question chips | P1 | P1-13 |
| Appointments | List, book (department → hospitals, government first → slot), reschedule, cancel, directions, call hospital; WhatsApp confirmation and day-before reminder | P1 | P1-14 |
| Call Sahay | One big button into the same voice pipeline, with live transcript | P1 | P1-12 |
| Medicine composition checker | Scan printed strip (OCR) or type/speak brand; salts, strength, form with source; **exact** equivalents, cheapest first, Jan Aushadhi flagged; pharmacist warning; nearest Kendra; **3 checks a day free** | P2 | P2-1, P2-2, P2-3 |
| Price comparison | Per-pack and per-tablet price, monthly saving, source and date on each price | P2 | P2-2 |
| Advisories feed | Government advisories with citations | P2 | P2-6 |
| Government services hub | PM-JAY card check, CMCHIS, eSanjeevani, Jan Aushadhi locator, 104 / 108 | P2 | P2-6 |

### Care plan (₹149/month, usually paid by a family member)

| Feature | Detail | Tier | Card |
|---|---|---|---|
| Medicine alarms | Loud alarm plus spoken reminder in the user's language | P2 | P2-4 |
| Adherence tracking | Taken / Snooze / Skip; weekly calendar of taken vs missed | P2 | P2-4 |
| Family alerts | Missed dose sends a WhatsApp to the family member | P2 | P2-4 |
| Unlimited composition checks | Removes the 3-a-day limit | P2 | P2-4 |
| Paywall and checkout | Free vs paid table, Razorpay test-mode checkout, "a family member can pay" share link | P2 | P2-4 |

**Never in the app:** diagnosis, different-molecule or Ayurvedic substitutes, handwritten prescription reading, teleconsultation, online medicine ordering, iOS build, real SMS.

## 3. Sahay Desk (hospital web)

Login is email + password; the hospital comes from the token, never from the request.

| Feature | Detail | Tier | Card |
|---|---|---|---|
| Today's appointments | By doctor and time, source badge (helpline / app / desk), live "new booking" toast within 2 s | P0 | P1-11 |
| Check-in | Marks "patient arrived"; this is what triggers the ₹40 arrival fee | P0 | P1-11 |
| No-show marker | Visible on the day's list | P0 | P1-11 |
| Call transcripts and summaries | List with language, outcome, emergency flag; detail pane | P0 | P1-11 |
| Human-handoff queue | Waiting calls with reason; "Take call" / "Call back" | P0 | P1-11 |
| Slot management | Per-doctor calendar, open or block slots | P1 | P1-3 |
| Settings | Hospital profile, departments, scheme flags, plan and usage | P2 | P2-5 |
| Number forwarding | Forward the hospital's existing phone number to Sahay (go-to-market wedge; telephony is a bonus in the hackathon) | P2 bonus | P2-7 |

## 4. Admin console (our team)

| Feature | Detail | Tier | Card |
|---|---|---|---|
| Overview | Calls today, bookings, arrivals, no-show rate, emergencies redirected, calls by language | P2 | P2-5 |
| Hospitals (clients) | Add, edit, partner flag, plan; calls, bookings, arrivals, amount due | P2 | P2-5 |
| Payments | Subscriptions, ₹40 arrival fees, Care plan payments with status | P2 | P2-5 |
| Premium users | Care plan subscribers, payer (patient or family), renewal date | P2 | P2-5 |
| Content | Advisory sources with issuer, date, language; re-index | P2 | P2-5 |

## 5. Browser "Call Sahay" (`/call`)

| Feature | Detail | Tier | Card |
|---|---|---|---|
| Browser voice call | Mic in the browser streams through the same voice pipeline; the main demo path | P0 | P1-5 |

## Cross-cutting (every product)

| Rule | Where it is enforced |
|---|---|
| No AI diagnosis, treatment advice or autonomous medical decisions | Safety gate in code, before the LLM; API rejects health answers with no citation |
| Government options shown before private | `find_facilities` ordering |
| Every fact comes from a stored source, never model memory | Advisory, facility, medicine and price tables, each row with source |
| DPDP privacy | Consent line, transcripts only, minimal data, AWS Mumbai where models allow |
| Modular for surprise challenges | One FastAPI backend, a module per domain |
| Demo data clearly labelled | `data/seed/` marked DEMO DATA |

## Still open

- Final name (Hello Sahay is the working name).
- PM-JAY / CMCHIS lookup as P0 and medicine OCR as P2 are proposals the team has not confirmed (brief §10 items 1, 6).
- Tamil TTS provider (Sarvam vs Google).

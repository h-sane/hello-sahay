# Hello Sahay — Features by App

One page per product: what each app is, who uses it, and every feature with its tier, task card and **build status**. Details live in the linked docs; this page is the overview.

Sources: [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) (decision log §11, tiers §8.1) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`PATIENT_APP_SPEC.md`](PATIENT_APP_SPEC.md) · [`IMPLEMENTATION_PHASES.md`](IMPLEMENTATION_PHASES.md). Business side: [`BUSINESS.md`](BUSINESS.md).

**Tiers:** P0 must work live end to end · P1 working but simple · P2 real UI on seeded data. **Cards** are the task IDs in `IMPLEMENTATION_PHASES.md`.
**Status** (checked against the code on 2026-10-15): **Built** works in the code and was exercised · **Demo** built, but backed by demo data or a stub, as stated · **Not built** designed, no code · **Dropped** decided against.

## The parts at a glance

| # | Product | Used by | Folder | Pays? |
|---|---|---|---|---|
| 1 | **Hello Sahay helpline** (voice) | Patients, any phone | `services/voice/` | Free for callers |
| 2 | **Sahay patient app** (Vite web app + Android APK) | Rural patients, elderly users, their city-based children | `apps/patient-web/` | Free core; Care plan ₹149/month |
| 3 | **Sahay Desk** (hospital web dashboard) | Hospital reception, nurses, doctors | `apps/desk/` | ₹2,999/month + ₹40 per arrived patient |
| 4 | **Admin console** (our team, web) | The Hello Sahay team | `apps/admin/` | Internal |
| 5 | **Browser "Call Sahay"** | Patients in the app, judges, web visitors | `services/voice/` `/call`, patient app "Start call" | Free |

Behind all five: one **backend API** (`services/api/`, FastAPI + PostgreSQL/pgvector) and one **safety gate**, so every surface follows the same rules. How it fits together: [`ARCHITECTURE.md`](ARCHITECTURE.md) and its two diagrams.

---

## 1. Hello Sahay helpline (voice)

Languages: Tamil, Hindi, English. Not an emergency service. Phone number 044-481-36970 (Exotel); also the browser call.

| Feature | Detail | Tier | Card | Status |
|---|---|---|---|---|
| Call-start notice and language | Short greeting saying the call is transcribed, then a beep; with `lang=auto` the first sentence sets the language, later changes need a whole sentence in another script | P0 | P1-5, P1-6 | Built (spoken language detection replaced "press 1 / 2 / 3") |
| Speech in, speech out | Sarvam hears Tamil and `lang=auto` calls; Transcribe hears English/Hindi browser calls; Polly speaks English/Hindi, Sarvam speaks Tamil | P0 | P1-5, P1-6 | Built |
| Emergency gate | Runs before the model on every utterance in all three languages; says "Call 108 / 112", flags the call, queues a human callback | P0 | P1-4, P1-7 | Built |
| Find a facility | Real nearest hospital (OpenStreetMap) as the recommendation, plus the nearest government one when different | P0 | P1-5 | Built |
| "Which hospital takes my card" | `check_scheme_coverage` against Tamil Nadu's CMCHIS list | P0 | P1-5 | Built (PM-JAY has no open per-hospital list; tagged together with CMCHIS) |
| Book appointments | Doctor and time preferences honoured; a named doctor who is not there is never refused | P0 | P1-3, P1-5 | Demo (always the one demo hospital's doctors and slots) |
| Reschedule | Choosing another slot after booking moves the same appointment | P0 | P1-3 | Built |
| Cancel by voice | | P0 | P1-3 | Not built (cancel is in the patient app and Desk API) |
| Department by keyword table | Fixed lookup, never an AI judgement | P0 | P1-2 | Built |
| Cited health answers by voice | Close to verbatim advisories, source named aloud | P0 | P1-9, P1-10 | Not built on the call (a health question gets the fixed "ask your PHC or call 104" reply plus a callback); built in the patient app chat |
| Symptom questions | Fixed safe reply: nearest PHC / 108, offer to book, or human | P0 | P1-4 | Built |
| WhatsApp confirmation | Sent on booking | P0 | P1-8 | Not built (`app/notify.py` only logs; needs WhatsApp keys) |
| Keypad fallback | Press-to-confirm for accents or speech difficulty | P0 | P1-5 | Not built |
| Human handoff | Call lands in the Desk callback queue with the reason; three unanswered turns also hand off and hang up | P0 | P1-7 | Built |
| Call log and trace | Transcript, outcome and a timestamped trace per call; read with `scripts/call_trace.py`; no audio stored | P0 | P1-7 | Built |
| Jan Aushadhi Kendra finder | Nearest Kendra by voice | P2 | P2-6 | Not built |
| Real phone number | Exotel Indian number into the same pipeline | P2 bonus | P2-7 | Built (trial: only verified numbers can call; Twilio dropped) |

## 2. Sahay patient app

Design rules (all screens): Tamil / Hindi / English; read-aloud on answers; large-type kit in `apps/patient-web/src/components/ui.tsx` (20 px base text, buttons at least 64 px, one primary action per card); every fact shows its source; "does not diagnose, call 108" always reachable. Full list: [`PATIENT_APP_SPEC.md`](PATIENT_APP_SPEC.md).

### Free

| Feature | Detail | Tier | Card | Status |
|---|---|---|---|---|
| Onboarding | Language, consent, profile (name, age, gender, village, mobile), then a random 6-digit code (5 minutes, 5 tries) | P1 | P1-12 | Demo (code shown on screen; no SMS route without DLT registration) |
| Home | Greeting, Start call (browser) and Call by phone, Emergency, today's visit and medicines, who is looking after you, nearest hospital, shortcuts | P1 | P1-12 | Built |
| Ask Sahay chat | Safety gate, then the cited local corpus, then live official government sites (gov.in, nic.in, cmchistn.com); source on every answer; fixed fallback; emergency and symptom states | P1 | P1-13 | Built |
| Hospitals | Real OpenStreetMap hospitals, CMCHIS tags from the empanelment list, map, call button, booking | P1 | P1-14 | Built (hospital data real; bookings demo) |
| Appointments | List, book, cancel, status in words | P1 | P1-14 | Built (reschedule exists in the API, not in the app) |
| Call Sahay | Browser call into the voice pipeline with live transcript | P1 | P1-12 | Built (needs a real microphone) |
| Medicine search and scan | 246k brands, official PMBI generics, exact salt + strength + form match, label photo read by a vision model, the label's printed price shown first | P2 | P2-1, P2-2, P2-3 | Built |
| 3 checks a day free | Limit before the Care plan | P2 | P2-2 | Not built (no limit) |
| Price comparison | Brand price vs Jan Aushadhi price and saving | P2 | P2-2 | Built (inside Medicines) |
| Advisories feed | Government advisories with citations | P2 | P2-6 | Built (Home card, `GET /advisories`) |
| Government services hub | PM-JAY card check, eSanjeevani, Kendra locator | P2 | P2-6 | Not built |

### Care plan (₹149/month, usually paid by a family member)

| Feature | Detail | Tier | Card | Status |
|---|---|---|---|---|
| Family | Server-side members with name, mobile, relation | P2 | P2-4 | Built |
| Pay for a parent | Child adds the parent's number and pays; parent's app shows who is looking after them | P2 | P2-4 | Demo (pressing Pay records a `DEMO-PAY-n` payment; Razorpay not wired) |
| Medicine reminders | Times per medicine, "I took it" log, due-now alerts | P2 | P2-4 | Built (in-app alerts, no loud alarm or spoken reminder) |
| Family alerts | "I took it" and Care plan events notify the people paying | P2 | P2-4 | Built in-app; no WhatsApp |
| Unlimited composition checks | Removes the free limit | P2 | P2-4 | Not built (no limit to remove) |

**Never in the app:** diagnosis, different-molecule or Ayurvedic substitutes, handwritten prescription reading, teleconsultation, online medicine ordering, iOS build, real SMS.

## 3. Sahay Desk (hospital web)

Login is email + password; the hospital comes from the token, never from the request. Tabs depend on the role (`apps/desk/README.md`).

| Feature | Detail | Tier | Card | Status |
|---|---|---|---|---|
| Today's appointments | By doctor and time, source badge (helpline / app / desk), live push | P0 | P1-11 | Built |
| Check-in | Marks "patient arrived"; triggers the ₹40 fee (not for counter walk-ins) | P0 | P1-11 | Built |
| No-show and complete | Front desk marks no-show; front desk or the doctor marks complete | P0 | P1-11 | Built |
| Walk-ins | Counter walk-in takes the doctor's free slot or an extra one | P1 | | Built |
| Call logs and callbacks | Language, outcome, emergency flag; "Mark Called" saved on the server | P0 | P1-11 | Built |
| Doctors | On-duty switch stops new bookings | P1 | P1-3 | Built (no per-slot calendar editing) |
| Past visits | Earlier days, newest first | P1 | | Built |
| Users and roles | Hospital admin creates receptionist, nurse and doctor logins, resets passwords, switches logins off | P1 | | Built |
| Settings | Hospital profile, departments, scheme flags, plan | P2 | P2-5 | Not built |
| Number forwarding | Forward the hospital's existing number to Sahay | P2 bonus | P2-7 | Not built |

## 4. Admin console (our team)

| Feature | Detail | Tier | Card | Status |
|---|---|---|---|---|
| Overview | Calls today and total, by language and outcome, emergencies, handoffs, patients, arrivals, no-show rate, revenue | P2 | P2-5 | Built |
| Hospitals | Partner flag, calls, bookings, arrivals, no-shows, amount due | P2 | P2-5 | Built (read-only; no add/edit) |
| Hospital logins | Create a hospital admin login, reset password, switch off | P2 | | Built |
| Payments | Subscriptions, ₹40 arrival fees (derived), Care plan payments | P2 | P2-5 | Built |
| Calls | Every transcript including callers with no hospital | P2 | | Built |
| Care plan | Subscribers and payer | P2 | P2-5 | Built |
| Content | Advisory sources, re-index | P2 | P2-5 | Not built (corpus loaded by `scripts/ingest_advisories.py`) |

## 5. Browser "Call Sahay"

| Feature | Detail | Tier | Card | Status |
|---|---|---|---|---|
| Browser voice call | Mic in the browser streams through the same pipeline: test page on the voice service (`/`) and "Start call" in the patient app (`/voice/call`) | P0 | P1-5 | Built |

## Cross-cutting (every product)

| Rule | Where it is enforced |
|---|---|
| No AI diagnosis, treatment advice or autonomous medical decisions | Safety gate in code, before the model; chat refuses answers with no citation |
| Government options shown before private | `find_facilities` / `GET /facilities` ordering |
| Every fact comes from a stored or official source, never model memory | Advisory corpus, official-host live search, facility, medicine tables |
| DPDP privacy | Call-start notice, transcripts only (no audio), minimal data, AWS Mumbai |
| Modular for surprise challenges | One FastAPI backend, a router per domain |
| Demo data clearly labelled | `data/seed/` marked DEMO DATA; demo wiring stated in `ARCHITECTURE.md` §2.1 |

## Still open

- Final name (Hello Sahay is the working name).
- WhatsApp keys, Razorpay keys, and a real phone call on the hosted box.
- Whether to build the keypad fallback and the voice advisory answers (both designed, neither built).

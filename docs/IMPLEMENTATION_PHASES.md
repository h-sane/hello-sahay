# Implementation Phases

How we build Hello Sahay in the 24 hours. Each task card is written so an implementing agent (Gemini / Antigravity) can pick it up cold: it names the folder, the inputs, and how we know it's done.

Read first: [`ARCHITECTURE.md`](ARCHITECTURE.md) (API contract §5, data model §4, rules §3) and [`PATIENT_APP_SPEC.md`](PATIENT_APP_SPEC.md).

Which features each app gets, with tier and card number: [`PRODUCT_FEATURES.md`](PRODUCT_FEATURES.md). Business decisions: [`BUSINESS.md`](BUSINESS.md).

## Rules for every task
1. Work on the `development` branch; commit after each finished card with a clear message (`feat(api): booking endpoints`). Push. Judges read the history.
2. Keep the API names and JSON shapes from `ARCHITECTURE.md` §5. If you must change one, update that doc in the same commit.
3. No secrets in git. Each service has a `.env.example`.
4. No medical answer without a citation; no AI department/diagnosis choices (see `ARCHITECTURE.md` §3).
5. "Done" means you ran it and saw the result, not "it compiles". Write in the commit or handoff what you checked.

## Checkpoints

| Time | Jury moment | Must be true |
|---|---|---|
| Wed 7:00 PM | Challenge 1 release | Phase 1 cards P1-1 to P1-5 done: helpline books a slot in one language, Desk shows it |
| Wed 12:00 AM | Challenge 2 release | Phase 1 complete (all three languages, chat with citations, WhatsApp, emergency gate, patient app core) |
| Thu 6:00 AM | Challenge 3 release | **Feature freeze.** Phase 2 only where stable |
| Thu 9:00 AM | Final jury | Demo rehearsed twice, backup video recorded |
| Thu 10–11 AM | Submission | README run steps, proposal PDF, repo link |

Surprise challenges take priority over Phase 2 when they land. The backend owner triages them first.

---

## Phase 0 — Setup (first hour)

| Card | What | Done when |
|---|---|---|
| P0-1 | Monorepo folders: `services/api`, `services/voice`, `apps/patient`, `apps/web`, `data/seed`, `data/advisories`, `design/ai-studio` | Folders committed with a README line each |
| P0-2 | Accounts and keys: AWS (Bedrock model access in `ap-south-1` or nearest region, Transcribe, Polly), Sarvam or Google TTS key for Tamil, WhatsApp Cloud API test number + verified demo recipients, Razorpay test keys | Each key tested with one call; region and model IDs written into `.env.example` (no values) |
| P0-3 | Postgres + pgvector in Docker (`docker-compose.yml`) | `docker compose up` gives a DB the API can reach |
| P0-4 | Import the AI Studio prototype into `design/ai-studio/` as its own commit | Commit `chore: import AI Studio UI prototype (pre-event reference)` |

## Phase 1 — Essential building blocks (by midnight)

### Backend and data
| Card | What | Done when |
|---|---|---|
| P1-1 | **API skeleton + data model** (`services/api`): FastAPI app, SQLAlchemy models from `ARCHITECTURE.md` §4, `/health` | Tables created; `/health` returns ok |
| P1-2 | **Seed data** (`data/seed`): demo district in Tamil Nadu, 10 facilities (PHCs, one GH, private nursing homes; 4 marked `is_partner`), doctors, 3 days of slots, PM-JAY/CMCHIS flags, `department_keywords.csv` in ta/hi/en. Label DEMO DATA | Seed script loads it; `GET /facilities` returns government first |
| P1-3 | **Booking endpoints**: facilities, slots, appointments (book, reschedule, cancel, mark arrived), patients | Book via curl → slot becomes booked; double-booking rejected |
| P1-4 | **Safety gate module** (`services/api/app/safety/`): emergency keyword lists (ta/hi/en: chest pain, can't breathe, unconscious, snakebite, heavy bleeding, poisoning, labour pain, suicide) + symptom-question detector; returns `emergency` / `symptom` / `ok` | Unit test with 10 phrases per language passes |

### Voice helpline
| Card | What | Done when |
|---|---|---|
| P1-5 | **Voice round-trip in English** (`services/voice`): browser mic → WebSocket → Transcribe streaming → safety gate → Bedrock (tools from `ARCHITECTURE.md` §5) → Polly → audio back. Flow from `ARCHITECTURE.md` §2.1: collect name, phone, location, reason → find facilities → book (partner) or give directions (non-partner) | A spoken English call books a slot end to end; turn latency noted |
| P1-6 | **Hindi and Tamil**: language choice at start; Transcribe hi-IN / ta-IN; Polly for Hindi; Sarvam or Google TTS for Tamil | Same booking call works in all three languages |
| P1-7 | **Call logging + human handoff**: save transcript, summary, outcome; `handoff_to_human` puts the call in the queue; emergency path logs and redirects to 108 | Emergency phrase → 108 message + queue entry |
| P1-8 | **WhatsApp confirmation** on booking (and directions for non-partner hospitals) | Message arrives on a verified demo phone |

### Chat (RAG)
| Card | What | Done when |
|---|---|---|
| P1-9 | **Advisory corpus**: collect 6–10 official docs (dengue, heat stroke, snakebite first aid, immunisation schedule, PM-JAY FAQ, CMCHIS FAQ, Jan Aushadhi info) into `data/advisories/` with `sources.csv` (issuer, title, url, date) | Every file has a source row |
| P1-10 | **Ingest + `/chat`**: chunk, embed (Bedrock multilingual embeddings), store in pgvector; `/chat` runs the safety gate, retrieves, answers with citations; below threshold → fixed fallback | "Dengue precautions" in Hindi returns an answer with a source; nonsense question returns the fallback |

### Web (Desk)
| Card | What | Done when |
|---|---|---|
| P1-11 | **Sahay Desk** (`apps/web/desk`): login, today's appointments, live updates (`WS /live/desk/{facility_id}`), check-in button, call transcripts, handoff queue | A helpline booking appears on the Desk within 2 s without refresh |

### Patient app (core)
| Card | What | Done when |
|---|---|---|
| P1-12 | **Expo app shell**: language picker, consent, phone + demo OTP login, home with 4 tiles + Call 108 bar, i18n files | Runs on a physical Android phone in Expo Go, all three languages |
| P1-13 | **Ask Sahay chat** screen on `/chat` with source chips and the fallback/emergency states | Matches P1-10 results on the phone |
| P1-14 | **Appointments** screen: list, book, reschedule, cancel | Booking from the app shows up on the Desk |

## Phase 2 — Added by importance (midnight → 6 AM freeze)

Build in this order; stop at freeze.

| # | Card | What | Done when |
|---|---|---|---|
| 1 | P2-1 | **Medicine data**: load brand→composition dataset + Jan Aushadhi list + NPPA prices into `medicine`, `medicine_price`, `jan_aushadhi_product`, with source per row; normalize salts (lowercase, sorted, strength units unified) | Lookup of 5 common brands (e.g. Dolo 650, Crocin, Pan 40) returns correct salts |
| 2 | P2-2 | **Composition checker + price comparison**: typed/spoken brand → exact equivalents, cheapest first, Jan Aushadhi flagged, prices with source; pharmacist warning; 3 free checks/day | Dolo 650 shows paracetamol 650 mg tablets only, with prices and sources |
| 3 | P2-3 | **Strip OCR**: camera photo → Bedrock vision → brand/salts/strength/form → same lookup | A clear photo of a printed strip resolves to the right medicine |
| 4 | P2-4 | **Care plan**: paywall screen, Razorpay test checkout, reminders, alarms with spoken reminder, taken/missed log, missed-dose WhatsApp to family | Test payment unlocks alarms; a missed dose sends the family message |
| 5 | P2-5 | **Admin console** (`apps/web/admin`): analytics (calls by language, bookings, arrivals, no-shows, emergency count), hospital clients (add, partner flag, plan), payments list (subscriptions, ₹40 arrival fees, premium) | Marking a patient "arrived" on Desk adds a ₹40 line in admin payments |
| 6 | P2-6 | Government services hub screen; advisories feed | Links open; each item shows its source |
| 7 | P2-7 | Hardening: rate limits, input validation, latency tuning, Twilio trial number (bonus) | Noted in handoff |

## Demo script (build toward this)
1. Tamil caller in the browser: "My mother has fever for three days, which hospital near <village>? She has a CMCHIS card." → no diagnosis, government options first, CMCHIS hospital flagged, slot booked.
2. Desk updates live; WhatsApp arrives on a judge's phone.
3. Hindi caller asks dengue precautions → answer with source named.
4. "Chest pain, can't breathe" → immediate 108 redirect + handoff queue.
5. Patient app: scan / type Dolo 650 → same-composition generic, Jan Aushadhi price saving, source shown.
6. Desk marks the patient arrived → admin shows the ₹40 arrival fee. Close: "One number. Any language. Any hospital."

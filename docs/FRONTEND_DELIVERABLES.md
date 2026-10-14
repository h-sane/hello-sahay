# Front-end Deliverables (for the AI Studio designer)

Every screen we need designed, for three surfaces. Feature detail: [`PATIENT_APP_SPEC.md`](PATIENT_APP_SPEC.md). API names: [`ARCHITECTURE.md`](ARCHITECTURE.md) §5.

## How to hand screens over
1. Design in Google AI Studio. Export the code and screenshots.
2. Put them in `design/ai-studio/<surface>/` and commit once as `chore: import AI Studio UI prototype (pre-event reference)`. Later design updates get their own commits.
3. The AI Studio code is a **visual reference only** (it is web React wired to Gemini with the key in the browser). The real screens are rebuilt in Expo (patient app) and Next.js (Desk/admin). So: prioritise clear screens and states over working code.
4. Name screenshots `<number>-<screen>-<state>.png`, e.g. `03-chat-answer.png`, `03-chat-fallback.png`.

## Visual direction
- **Patient app:** warm, calm, trustworthy; one primary colour (suggest a deep teal) + red only for emergency; big type (body ≥ 18sp, headings ≥ 24sp); icons always with text; generous spacing; works in sunlight (high contrast).
- **Desk and admin:** clean, dense-but-readable dashboard; same primary colour; tables and cards; desktop first but usable on a tablet.
- Show every screen in **Tamil** at least once (longer words, different script) to prove nothing breaks.
- Every screen needs its states: loading, empty, error, success, and paywall where relevant.

## A. Patient app (mobile, Android-first) — priority order

| # | Screen | Key elements | States |
|---|---|---|---|
| 1 | Language picker | 3 big buttons: தமிழ் / हिन्दी / English | — |
| 2 | Consent | Plain-language list of what we store and don't; Accept | — |
| 3 | Phone login + OTP | Phone field, OTP field, demo hint | wrong OTP, sending |
| 4 | **Home** | 4 tiles (Ask Sahay, My Medicines, Appointments, Call Sahay), latest advisory card, red Call 108 bar, language switch in header | first visit, returning |
| 5 | **Ask Sahay chat** | Bubbles, mic, speaker on answers, **source chip** under every answer, quick-question chips, footer "does not diagnose" | answer with source, no-source fallback, symptom reply with "Book a doctor", emergency full-screen 108 |
| 6 | **Call Sahay** | Big call button, live transcript, language label, end call | connecting, talking, ended, no mic permission |
| 7 | **Appointments list** | Upcoming / past, hospital, doctor, time, directions, call | empty, loaded |
| 8 | **Book appointment** | Department → hospitals (government first, PM-JAY/CMCHIS badges, partner vs info-only) → slot picker → confirm | no slots, booked success |
| 9 | **Medicine check — input** | Scan strip (camera) or type/speak name; "3 free checks left today" | camera, scanning, OCR failed |
| 10 | **Medicine check — result** | Brand, salts, strength, form, source; exact equivalents cheapest first; Jan Aushadhi badge + saving; pharmacist warning; nearest Kendra | not found, found, limit reached → paywall |
| 11 | **Price comparison** | Per-pack and per-tablet price, monthly saving, source + date per price | — |
| 12 | **Care plan paywall** | Free vs paid table, ₹149/month, "family can pay" share link, Pay button | paying, success, failed |
| 13 | **Medicine reminders** | List of medicines with times, add reminder | empty, list |
| 14 | **Alarm screen** | Full-screen, medicine name + picture, Taken / Snooze / Skip, spoken reminder | — |
| 15 | **Adherence calendar** | Week view of taken vs missed, family alert status | — |
| 16 | Profile | Name, village, language, family phone, logout | — |
| 17 | Government services hub (Phase 2) | Cards: PM-JAY, CMCHIS, eSanjeevani, Jan Aushadhi, 104, 108 | — |

## B. Sahay Desk (hospital web)

| # | Screen | Key elements |
|---|---|---|
| 1 | Login | Email + password, hospital name |
| 2 | **Today** | Appointment list by doctor and time, source badge (helpline / app / desk), **Check-in** button, no-show marker, live "new booking" toast |
| 3 | Slots | Per-doctor calendar, open/block slots |
| 4 | **Calls** | Call list with language, outcome, emergency flag; detail pane with transcript + summary |
| 5 | **Handoff queue** | Waiting calls, reason, "Take call" / "Call back" |
| 6 | Settings | Hospital profile, departments, scheme flags, plan + usage |

## C. Admin console (our team, web)

| # | Screen | Key elements |
|---|---|---|
| 1 | **Overview** | KPI tiles: calls today, bookings, arrivals, no-show rate, emergencies redirected; calls by language chart |
| 2 | **Hospitals (clients)** | Table: name, partner?, plan, calls, bookings, arrivals, amount due; add/edit hospital |
| 3 | **Payments** | Subscriptions, ₹40 arrival fees, Care plan payments; status (paid/pending/failed) |
| 4 | Premium users | Care plan subscribers, payer (patient or family), renewal date |
| 5 | Content | Advisory sources list with issuer, date, language; re-index button |

## Priority if time is short
Patient app 4, 5, 6, 8, 10 → Desk 2, 4, 5 → Admin 1, 3 → everything else.

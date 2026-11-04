# Frontend integration

How the two teammate frontends are wired to our API. Decision (Hussain, 2026-10-14): the **backend is the source of truth**; the teammate UIs keep their look and layout, their data layer was replaced.

| App | Folder | Stack | Port | Replaces |
|---|---|---|---|---|
| Patient app (web) | `apps/patient-web/` | Vite, React 19, TS, Tailwind 4 | 5174 | AI Studio prototype by Adhitya |
| Sahay Sathi (helper app) | `apps/sathi-mobile/` | Vite, React 19, TS, Tailwind 4 | 3001 | prototype by Adhitya |
| Sahay Desk (hospital dashboard) | `apps/desk/` | Vite, React 18, JS, Tailwind 3 | 5173 | prototype by Bharani |

The earlier Next.js Desk and Expo patient shell were deleted on 2026-11-04 (git history has them). The Hello Sahay admin console is `apps/admin` (one static page, `GET /api/v1/admin/*`); hosting is described in `deploy/README.md` and `ARCHITECTURE.md` §7.

## Run all of it

```bash
docker compose up -d
AWS_PROFILE=personal-bedrock python -m uvicorn app.main:app --app-dir services/api --port 8001
AWS_PROFILE=personal-bedrock python -m uvicorn pipeline.server:app --app-dir services/voice --port 8002   # only for the call screen
cd apps/patient-web && npm install && npm run dev     # :5174
cd apps/desk && npm install && npm run dev            # :5173
```

Both dev servers proxy `/api` to `:8001` (and the patient app `/voice` to `:8002`), so the browser never needs CORS and **no backend file changed**. Hosted builds set `VITE_API_URL` and `VITE_VOICE_URL`. Demo Desk login: `desk7@sahay.demo` / `demo1234` (the demo hospital's admin; see `apps/desk/README.md` for the other roles).

## Patient app: screen to endpoint

| Screen | Backend | Notes |
|---|---|---|
| Home, Hospitals, nearest facility | `GET /places/nearby-hospitals?lat&lng` (real) | Real OpenStreetMap hospitals, nearest first; every hospital books into the one demo Desk (see "Nearest hospital" below) |
| Booking | `GET /facilities/{id}/slots?date`, `POST /appointments` | Next 7 days fetched together; a 409 returns the patient to the slot step |
| My Health, appointments | `GET /patients/{phone}/appointments`, `PATCH ... cancel`, `POST /auth/otp/request` and `/verify` | Lookup by phone after sign-in with the random code (shown on screen in demo mode); a fresh booking is also cached on the device |
| Ask Sahay | `POST /chat` | Cited answers only. Emergency and symptom messages get the server's fixed reply plus the nearest government facility |
| Home advisory card | `GET /advisories?lang=` | Replaces the hardcoded "Dr. Sahay" advice |
| Call Sahay | `WS /voice/call?lang=en\|hi\|ta` (voice service) | 16 kHz mono PCM16 both ways; events `transcript`, `heard`, `latency`, `ended`. The mic path needs a real microphone and could not be exercised by automation |

Device only (no backend): language, consent and location. Medicines, reminders, family members and the Care plan are on the server (see the sections below).

Removed because they break the guardrails: the "Dr. Sahay" persona and clinical advice text, symptom-to-department routing, seeded fake appointments, four of the nine languages (Tamil, Hindi, Kannada, Malayalam and English remain).

### Nearest hospital: real names, one demo Desk

`GET /places/nearby-hospitals?lat&lng` returns real hospitals from OpenStreetMap (an Overpass radius query of 3, 10, 30 then 80 km, with Nominatim as the fallback while Overpass is down), nearest first, with distance, kind and speciality when OSM has them. Each hospital is matched by name against the Tamil Nadu CMCHIS empanelment list (`data/schemes/cmchis_hospitals.json`, refreshed with `scripts/fetch_cmchis_hospitals.py`, matcher in `services/api/app/schemes.py`); a match sets `cmchis` and `pmjay` (Tamil Nadu runs both on that one list) and `scheme_checked`, no match means no tag and the app says "Scheme cover not confirmed". PM-JAY has no open per-hospital list of its own (its search needs a captcha), so it is not checked separately. Results are cached for an hour per ~1 km cell. Both the Home card and the Hospitals tab use this list (the seeded demo facilities are never listed as nearby: a failed or empty lookup shows an error, and with no GPS fix and no chosen area the app asks "Where are you?" instead of assuming a district).

**"Where are you?" search (2026-11-04).** The picker has no built-in list of places any more: it calls `GET /places/search?q=` (OpenStreetMap through Nominatim and Photon, so a misspelling such as "Manadi" still offers Manali) as the patient types, and a chosen place is saved with `manual: true`.

**Background location (Android, 2026-11-04).** `android/.../SahayLocationPlugin.java` asks for location, then "Allow all the time" (two steps, Android 11+ requires it), and schedules `LocationWorker` (WorkManager, every 30 minutes, needs network). The worker reads the GPS and calls `PUT /patients/{phone}/location`, which answers with a fresh 30-day token that the worker stores, so a patient who never reopens the app stays signed in. The app asks once after sign-up (`LocationSharingSheet`) and My Health, More has a turn on/off card. The server treats a location as live for 90 minutes. iOS has no background worker yet (the app-open push remains). Phones that kill background work (battery savers on some brands) can delay the reports.

**The line between real and demo (Hussain, 2026-10-15):** hospital name, address, distance and the GPS/nearest logic are real. Everything behind "Book" is demo: `book_facility_id` is the first partner facility (Sunrise Nursing Home), so doctors, slots and bookings from every hospital in the list land on that one Sahay Desk, `phone` is `DEMO_CALL_NUMBER` (falls back to `DEMO_EMERGENCY_NUMBER`), and the patient's own appointment list shows the hospital they chose (`appointment.hospital_label`). The helpline works the same way (`services/voice/README.md`).

## Patient app: Ask Sahay, Medicines, My Health (session 21)

All of these except search and config need the patient token (`Authorization: Bearer`, from the OTP sign-in).

| Screen | Backend | Notes |
|---|---|---|
| Ask Sahay | `POST /chat` | Safety gate, then the local advisory corpus, then a live search of official government sites (`live_search.py`, Exa public endpoint, results filtered to gov.in / nic.in / cmchistn.com). Citations carry `url` and `live: true` for live pages. Answers for the same question are cached 30 minutes |
| Medicines search | `GET /medicines/search?q=` | Brands by name then salt (a misspelt name falls back to the closest real name and says so; `GET /medicines/suggest` feeds the chips under the box), plus Jan Aushadhi generics; each brand carries its cheapest same-contents Jan Aushadhi product and the saving per tablet/ml |
| Jan Aushadhi stores | `GET /places/jan-aushadhi?lat=&lng=` | Stores whose OpenStreetMap name contains Aushadhi, nearest first, with directions and a call button when OSM lists a phone; shown under medicine results in `JanAushadhiStores.tsx` |
| Medicines scan | `POST /medicines/scan` `{image: base64}` | Nova vision only reads the label; a fixed program matches composition, strength and form. Status `found / no_equivalent / brand_only / unreadable`. The label's own printed MRP is used when present |
| Home, Emergency | `GET /config/contacts` | helpline, emergency desk, hospital call number, 108, 112. Numbers are dialled, never printed |
| My Health: family | `GET/POST /family`, `PUT/DELETE /family/{id}` | name, optional mobile number, relation; private to the owner |
| My Health: Care plan | `GET /care/me`, `POST /care/pay`, `DELETE /care/plans/{id}`, `GET /care/parents` | Demo payment: pressing Pay records a Payment (kind `premium`, Rs 149, ref `DEMO-PAY-n`), creates the parent's patient row if needed and sets `is_premium`. The parent's app shows who is looking after them. The admin console's revenue and Payments tab include it |
| My Health: medicines | `GET/POST /reminders`, `PUT/DELETE /reminders/{id}`, `POST /reminders/{id}/taken` | "I took it" notifies the people paying for that patient |
| Alerts | `GET /notifications`, `POST /notifications/read` | Polled every 20 s by the app; shown as a banner. Due medicines are computed on the phone from the reminder list |

Medicine data is loaded by `scripts/load_medicines.py load` (deploy runs it with `--if-empty`).

## Services tab and Sahay Sathi: screen to endpoint

The two apps share one set of tables (`helper`, `service_booking`, `helper_notification`). Both apps never fall back to made-up data: a failed call shows its error.

| Screen | Backend | Notes |
|---|---|---|
| Services, category page | `GET /services/providers?category=Personal Caretaker\|House Cleaning\|Technical Support\|Care Support` | Helpers whose `id_status` is `verified`; no phone number in the reply |
| Book visit | `POST /services/bookings` `{helper_id, service_category, service_title, booking_date, slot, location_address, customer_notes}` | Price comes from the helper, never from the app. 409 for a helper who is offline, off that day, or busy then |
| Describe what you need | `POST /services/bookings` with `service_category: "Custom request"`, no helper | Appears in every online helper's Requests |
| Your bookings | `GET /services/bookings` (every 20 s), `POST /services/bookings/{id}/cancel` | The helper's phone appears once the booking is confirmed |
| Alerts for the patient | `GET /notifications` | `kind: "service"` rows written when the helper acts |
| Sathi sign-in | `POST /sathi/auth/otp/request` + `/otp/verify`, or `/sathi/auth/login` | Same code rules as the patient app (random, 5 min, 5 tries, `OTP_SHOW_CODE`) |
| Sathi registration | `POST /sathi/register` (helper token from the verified code) | Fills in the profile; status becomes `pending` |
| Sathi requests | `GET /sathi/bookings`, `POST /sathi/bookings/{id}/action` | Polled every 30 s; open requests hide the customer's phone until accepted |
| Sathi earnings, notifications, availability | `GET /sathi/earnings`, `/sathi/notifications`, `GET/PUT /sathi/availability` | |

Run: `(cd apps/sathi-mobile && npm install && npm run dev)` on http://localhost:3001 (proxies `/api` to `SAHAY_API_ORIGIN`, default `http://localhost:8001`).

## Sahay Desk: screen to endpoint

Tabs depend on the login role (`apps/desk/README.md` has the table); the API enforces the same rules.

| Screen | Backend | Notes |
|---|---|---|
| Sign in | `POST /auth/login` | Hospital logins only; the Hello Sahay admin is refused with a message |
| Live queue | `GET /appointments`, `GET /walk-ins`, `PATCH /appointments/{id}` (`arrived`, `start`, `complete`, `no_show`), `PATCH /walk-ins/{id}` | Today only. One lane per doctor: appointments A1, A2... (time order), walk-ins W1, W2... (arrival order), advice on how long the doctor is free before the next appointment |
| Appointments | `GET /appointments?date`, `PATCH ... arrived / start / complete / no_show` | Day arrows in the header. The number is A1, A2... per doctor. A doctor sees only their own patients and cannot mark arrivals |
| Add walk-in | `POST /walk-ins` | Name, doctor on duty, optional phone and reason. Takes no slot (the timetable breaks are for them), no arrival fee |
| Doctors & timetables | `GET /doctors?date`, `PATCH /doctors/{id}`, `PUT /doctors/{id}/schedule`, `POST /schedule/preview` | Every doctor with booked/open slots and their timetable; the on-duty switch stops new bookings; Set timetable edits mode, slot length, walk-in breaks, hours and days off, with a live preview of the day |
| Call logs | Not in Sahay Desk; the admin console's Calls screen (`GET /admin/calls`, `PATCH /calls/{id}`) | Handoffs show as "Needs callback" and "Mark called back" is saved on the server |
| Past visits / My past patients | `GET /appointments?history=true` | Everything before today, newest first (300 at most); doctors get only their own |
| Users (hospital admin only) | `GET/POST/PATCH /users` | Add receptionist, nurse or doctor logins (a new doctor gets a doctor record and slots), reset a password, switch a login off |
| Live badge | `WS /live/desk/{id}?token=` | Any pushed booking or call refetches; reconnects every 3 s |

`arrived` is only sent when staff press Mark Arrived, because it triggers the Rs 40 fee (walk-ins are not appointments and carry no fee).

## Known gaps (backend work, not done here)

- `GET /patients/{phone}/appointments` and `PATCH` cancel/reschedule are open endpoints; anyone who knows a number can list that patient's bookings. The app gates its own lookup with the demo OTP but the API does not enforce it. Needs a patient token check (owner: API session).
- A switched-off Desk login keeps working until its token expires (12 h). `POST /calls` and `POST /appointments` take no token (the voice service has none), so anyone who knows the API can post a fake call or booking.
- WhatsApp confirmation is still a log line (P1-8 needs keys), so the booking screen says "show this code at the counter" only.
- The old local-only copies of reminders and family profiles in `storageService` are no longer read.

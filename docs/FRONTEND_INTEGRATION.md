# Frontend integration

How the two teammate frontends are wired to our API. Decision (Hussain, 2026-10-14): the **backend is the source of truth**; the teammate UIs keep their look and layout, their data layer was replaced.

| App | Folder | Stack | Port | Replaces |
|---|---|---|---|---|
| Patient app (web) | `apps/patient-web/` | Vite, React 19, TS, Tailwind 4 | 5174 | AI Studio prototype by Adhitya |
| Sahay Desk (hospital dashboard) | `apps/desk/` | Vite, React 18, JS, Tailwind 3 | 5173 | prototype by Bharani |

`apps/web/` (Next.js `/desk`) is the earlier Desk and still works; `apps/patient/` (Expo) is untouched. Which Desk to demo is Hussain's call.

## Run all of it

```bash
docker compose up -d
AWS_PROFILE=personal-bedrock python -m uvicorn app.main:app --app-dir services/api --port 8001
AWS_PROFILE=personal-bedrock python -m uvicorn pipeline.server:app --app-dir services/voice --port 8002   # only for the call screen
cd apps/patient-web && npm install && npm run dev     # :5174
cd apps/desk && npm install && npm run dev            # :5173
```

Both dev servers proxy `/api` to `:8001` (and the patient app `/voice` to `:8002`), so the browser never needs CORS and **no backend file changed**. Hosted builds set `VITE_API_URL` and `VITE_VOICE_URL`. Demo Desk login: `desk7@sahay.demo` / `demo1234` (also 8, 9, 10).

## Patient app: screen to endpoint

| Screen | Backend | Notes |
|---|---|---|
| Home, Hospitals, nearest facility | `GET /facilities?lat&lng` | Cached in `hospitalService`; government first, then nearest. Facilities that are not Sahay Desk partners show phone and directions, not a booking flow |
| Booking | `GET /facilities/{id}/slots?date`, `POST /appointments` | Next 7 days fetched together; a 409 returns the patient to the slot step |
| My Health, appointments | `GET /patients/{phone}/appointments`, `PATCH ... cancel`, `POST /auth/otp/request` and `/verify` | Lookup by phone after the demo OTP (123456); a fresh booking is also cached on the device |
| Ask Sahay | `POST /chat` | Cited answers only. Emergency and symptom messages get the server's fixed reply plus the nearest government facility |
| Home advisory card | `GET /advisories?lang=` | Replaces the hardcoded "Dr. Sahay" advice |
| Call Sahay | `WS /voice/call?lang=en\|hi\|ta` (voice service) | 16 kHz mono PCM16 both ways; events `transcript`, `heard`, `latency`, `ended`. The mic path needs a real microphone and could not be exercised by automation |

Device only (no backend): language and consent, location, medicine comparison (demo sample data, "confirm with your doctor or pharmacist"), dose reminders, family profiles.

Removed because they break the guardrails or have no backend: the "Dr. Sahay" persona and clinical advice text, symptom-to-department routing, seeded fake appointments, reminders and family members, six of the nine languages (only Tamil, Hindi, English remain).

### Nearest hospital: real names, one demo Desk

`GET /places/nearby-hospitals?lat&lng` returns real hospitals from OpenStreetMap (Nominatim), nearest first, with distance, kind and speciality when OSM has them. Per-hospital scheme data does not exist, so PM-JAY and CMCHIS show on every one. Results are cached for an hour per ~1 km cell. Both the Home card and the Hospitals tab use this list (the seeded demo facilities only appear if the lookup finds nothing).

**The line between real and demo (Hussain, 2026-10-15):** hospital name, address, distance and the GPS/nearest logic are real. Everything behind "Book" is demo: `book_facility_id` is the first partner facility (Sunrise Nursing Home), so doctors, slots and bookings from every hospital in the list land on that one Sahay Desk, `phone` is `DEMO_CALL_NUMBER` (falls back to `DEMO_EMERGENCY_NUMBER`), and the patient's own appointment list shows the hospital they chose (`appointment.hospital_label`). The helpline works the same way (`services/voice/README.md`).

## Sahay Desk: screen to endpoint

Tabs depend on the login role (`apps/desk/README.md` has the table); the API enforces the same rules.

| Screen | Backend | Notes |
|---|---|---|
| Sign in | `POST /auth/login` | Hospital logins only; the Hello Sahay admin is refused with a message |
| Appointments | `GET /appointments?date`, `PATCH ... arrived / complete / no_show` | Day arrows in the header. Token number is the position in the day's queue. A doctor sees only their own patients and cannot mark arrivals |
| Walk-in | `POST /appointments/walk-in` | Pick a doctor on duty; no slot to choose, so it works after hours. Source `desk`, marked arrived, no arrival fee |
| Doctors | `GET /doctors?date`, `PATCH /doctors/{id}` | Every doctor with booked/open slots; the on-duty switch stops new bookings from the helpline and app |
| Call logs | `GET /calls`, `PATCH /calls/{id}` | Handoffs show as callbacks and "Mark Called" is saved on the server; emergencies read "Told to call 108" |
| Past visits / My past patients | `GET /appointments?history=true` | Everything before today, newest first (300 at most); doctors get only their own |
| Users (hospital admin only) | `GET/POST/PATCH /users` | Add receptionist, nurse or doctor logins (a new doctor gets a doctor record and slots), reset a password, switch a login off |
| Live badge | `WS /live/desk/{id}?token=` | Any pushed booking or call refetches; reconnects every 3 s |

`arrived` is only sent when staff press Mark Arrived, because it triggers the Rs 40 fee (not for counter walk-ins).

## Known gaps (backend work, not done here)

- `GET /patients/{phone}/appointments` and `PATCH` cancel/reschedule are open endpoints; anyone who knows a number can list that patient's bookings. The app gates its own lookup with the demo OTP but the API does not enforce it. Needs a patient token check (owner: API session).
- No patient age. A switched-off Desk login keeps working until its token expires (12 h). `POST /calls` and `POST /appointments` take no token (the voice service has none), so anyone who knows the API can post a fake call or booking.
- WhatsApp confirmation is still a log line (P1-8 needs keys), so the booking screen says "show this code at the counter" only.
- Medicines, reminders and family profiles are local-only until P2-1 and the Care plan exist.

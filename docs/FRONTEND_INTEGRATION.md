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

## Sahay Desk: screen to endpoint

| Screen | Backend | Notes |
|---|---|---|
| Sign in | `POST /auth/login` | Desk accounts only; admin is refused with a message |
| Appointments | `GET /appointments?date`, `PATCH ... arrived`, `POST /appointments` (walk-in, source `desk`, then arrived) | Day arrows in the header. Token number is the position in the day's queue |
| Doctors | derived from `GET /appointments` and `GET /facilities/{id}/slots` | Read-only: booked and open slots per doctor; the on-leave toggle was dropped (no backend) |
| Call logs | `GET /calls` | Handoffs show as callbacks; emergencies as 108 redirects |
| Live badge | `WS /live/desk/{id}?token=` | Any pushed booking or call refetches; reconnects every 3 s |

Kept on the device per facility: "Done" for a patient who has arrived, and "callback made" on handoff calls (the API has no such states yet). `arrived` is only sent when staff press Mark Arrived, because it triggers the Rs 40 fee.

## Known gaps (backend work, not done here)

- `GET /patients/{phone}/appointments` and `PATCH` cancel/reschedule are open endpoints; anyone who knows a number can list that patient's bookings. The app gates its own lookup with the demo OTP but the API does not enforce it. Needs a patient token check (owner: API session).
- No "completed" or "callback done" state, no doctor on-duty flag, no patient age.
- WhatsApp confirmation is still a log line (P1-8 needs keys), so the booking screen says "show this code at the counter" only.
- Medicines, reminders and family profiles are local-only until P2-1 and the Care plan exist.

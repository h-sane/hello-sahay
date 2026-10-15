# Sahay patient app (web)

Mobile-first web app for patients, built from a teammate's AI Studio prototype and wired to the Hello Sahay API. Tamil, Hindi and English.

## Run

```bash
docker compose up -d                      # Postgres (repo root)
AWS_PROFILE=personal-bedrock python -m uvicorn app.main:app --app-dir services/api --port 8001
cd apps/patient-web && npm install && npm run dev    # http://localhost:5174
```

The dev server proxies `/api` to `http://localhost:8001` (set `SAHAY_API_ORIGIN` to change it), so no CORS setup is needed. For a hosted build set `VITE_API_URL`.

## What talks to the backend

| Screen | Endpoint |
|---|---|
| Hospitals, Home, Emergency | `GET /places/nearby-hospitals?lat&lng` (real OpenStreetMap hospitals, CMCHIS tags), `GET /config/contacts` |
| Booking (department, doctor, day, slot, patient) | `GET /facilities/{id}/slots`, `POST /appointments` |
| First open, My Health appointments | `POST /auth/otp/*`, `PUT /patients/me`, `GET /patients/{phone}/appointments`, `PATCH /appointments/{id}` (cancel) |
| Ask Sahay | `POST /chat` (cited answers; emergency and symptom messages get the fixed safe reply) |
| Medicines | `GET /medicines/search`, `POST /medicines/scan` |
| My Health: family, Care plan, reminders, alerts | `/family`, `/care/*`, `/reminders`, `/notifications` |
| Home advisory card | `GET /advisories?lang=` |
| Start call | `WS /voice/call` (voice service) |

Full screen-to-endpoint map: `docs/FRONTEND_INTEGRATION.md`. Kept on the device only: language, consent and location.

Not available yet, shown honestly: WhatsApp confirmation (needs keys), real payment for the Care plan (demo payment), sign-in code by SMS (shown on screen).

`npm run lint` type-checks the project.

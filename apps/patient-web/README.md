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
| Hospitals, Home, Emergency (nearest government facility first) | `GET /facilities?lat&lng` |
| Booking (department, doctor, day, slot, patient) | `GET /facilities/{id}/slots`, `POST /appointments` |
| My Health, appointments | `GET /patients/{phone}/appointments`, `PATCH /appointments/{id}` (cancel), `POST /auth/otp/*` |
| Ask Sahay, voice question | `POST /chat` (cited answers; emergency and symptom messages get the fixed safe reply) |
| Home advisory card | `GET /advisories?lang=` |

Kept on the device only: language and consent, location, medicine comparison (demo data, always "confirm with your doctor or pharmacist"), dose reminders and family profiles.

Not available yet, shown honestly: WhatsApp confirmation (needs keys), online booking at facilities that are not Sahay Desk partners (the app shows their phone number instead).

`npm run lint` type-checks the project.

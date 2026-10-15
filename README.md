# Hello Sahay

**One free number. Any language. Any hospital.**

Hello Sahay is a free AI voice helpline for rural patients in Tamil, Hindi and
English. It finds nearby government and private hospitals, checks which ones
accept PM-JAY / CMCHIS scheme cards, books the appointment and sends a WhatsApp
confirmation. Hospitals manage bookings on the **Sahay Desk** dashboard.

The AI never diagnoses or gives treatment advice. Health information is read
from government advisories with the source named, and emergencies are
redirected to 108 / 112 immediately.

Built at **Founder's Code 2026** (SMIT Chennai), Rural Healthcare domain.

## Status

Built and hosted for the hackathon: the helpline answers on a real number (044-481-36970, English / Hindi / Tamil), the patient app runs on the web and as an Android APK, and Sahay Desk and the admin console are live. WhatsApp confirmation and the real Care plan payment are not wired yet; see [what is built per app](docs/PRODUCT_FEATURES.md).

Docs: [architecture and diagrams](docs/ARCHITECTURE.md) · [features and status](docs/PRODUCT_FEATURES.md) · [patient app spec](docs/PATIENT_APP_SPEC.md) ·
[frontend wiring](docs/FRONTEND_INTEGRATION.md) · [implementation phases](docs/IMPLEMENTATION_PHASES.md) · [business](docs/BUSINESS.md) · [full brief](docs/PROJECT_BRIEF.md).

## Structure

| Path | What it is |
|---|---|
| `apps/patient-web/` | Patient app (Vite + React; Android APK via Capacitor in `android/`) |
| `apps/desk/` | Sahay Desk, the hospital dashboard (Vite + React) |
| `apps/admin/` | Hello Sahay admin console (one static page) |
| `apps/web/`, `apps/patient/` | Earlier Next.js and Expo builds, not deployed |
| `services/api/` | Backend API (FastAPI, PostgreSQL + pgvector) |
| `services/voice/` | Voice pipeline and phone bridge (speech-to-text, safety gate, LLM tools, text-to-speech) |
| `data/` | Demo seed data, advisories, medicine and scheme data |
| `deploy/` | One-box Lightsail hosting stack; pushing to `main` deploys |
| `scripts/` | Loaders, call trace and simulation tools |

## Run locally

```bash
docker compose up -d                         # Postgres + pgvector on port 5433
cp .env.example .env                         # then fill in the keys
python scripts/check_setup.py                # DB, Bedrock, embeddings, Polly, Transcribe
python scripts/load_seed.py                  # demo hospital, doctors, slots
AWS_PROFILE=personal-bedrock python -m uvicorn app.main:app --app-dir services/api --port 8001
(cd apps/patient-web && npm install && npm run dev)   # http://localhost:5174
(cd apps/desk && npm install && npm run dev)         # http://localhost:5173
```

Voice: see `services/voice/README.md`; hosting and the APK: `deploy/README.md`.

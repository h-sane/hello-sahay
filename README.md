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

Work in progress during the hackathon. Plans:
[architecture](docs/ARCHITECTURE.md) · [patient app spec](docs/PATIENT_APP_SPEC.md) ·
[implementation phases](docs/IMPLEMENTATION_PHASES.md) · [screens to design](docs/FRONTEND_DELIVERABLES.md) ·
[full brief](docs/PROJECT_BRIEF.md).

## Planned structure

| Path | What it is |
|---|---|
| `apps/patient/` | Patient mobile app (Expo React Native) |
| `apps/web/` | Hospital dashboard (`/desk`) and admin console (`/admin`) (Next.js) |
| `services/api/` | Backend API (FastAPI) |
| `services/voice/` | Voice pipeline (speech-to-text, safety gate, LLM tools, text-to-speech) |
| `data/` | Demo seed data and government advisory sources |

Setup and run instructions will be added as each part lands.

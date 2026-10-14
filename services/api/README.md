# services/api — Backend API (FastAPI)

Facilities, slots, bookings, patients, auth, calls and the Desk live socket. Chat, medicines, Care plan and payments land here as their task cards ship.
Contract: `docs/ARCHITECTURE.md` §4 (data model) and §5 (endpoints).

## Run

```bash
docker compose up -d                       # Postgres on host port 5433
pip install fastapi uvicorn sqlalchemy psycopg2-binary pgvector pydantic httpx python-dotenv pyjwt
uvicorn app.main:app --app-dir services/api --port 8001
```

Reads `DATABASE_URL`, `JWT_SECRET`, `DEMO_OTP` and optional `CORS_ORIGINS` (comma list, default `http://localhost:3000`) from the root `.env`. Tables and demo logins are created on startup. Interactive docs: `http://localhost:8001/docs`.

## Demo logins (`POST /api/v1/auth/login`)

| Email | Password | Role |
|---|---|---|
| `desk<facility_id>@sahay.demo` (one per partner facility, e.g. `desk7@sahay.demo`) | `demo1234` | desk, scoped to that facility |
| `admin@sahay.demo` | `demo1234` | admin, all facilities |

Patient OTP login: `POST /auth/otp/request {phone}` then `POST /auth/otp/verify {phone, code}` with `code = DEMO_OTP` (default `123456`). No SMS is sent.

Send the token as `Authorization: Bearer <token>`.

## What needs a token

| Endpoint | Rule |
|---|---|
| `GET /appointments?date` | Desk token; returns that facility's appointments (admin may pass `facility_id`) |
| `PATCH /appointments/{id}` with `arrived` | Desk token for the appointment's facility (arrival triggers the per-patient fee) |
| `GET /calls`, `GET /handoffs` | Desk token, own facility only; admin sees all |
| `WS /live/desk/{facility_id}` | Optional `?token=`; if given it must match the facility |
| everything else | Open, because the voice service and the patient app call it without a desk login |

## Behaviour worth knowing

- Phone numbers are normalised to `+91XXXXXXXXXX`; `9876543210`, `09876543210` and `+91 98765 43210` are the same patient.
- Booking locks the slot row (`SELECT … FOR UPDATE`); a second booking of the same slot gets **409**.
- `PATCH /appointments/{id}` actions: `reschedule` (needs `new_slot_id`), `cancel` (frees the slot), `arrived`. A cancelled or arrived appointment answers 409.
- Every booking, change and call is pushed as `{"type":"appointment","appointment":{…}}` or `{"type":"call","call":{…}}` to that facility's sockets. The hub is in-process, so run one uvicorn worker.
- `app/notify.py:send_whatsapp` only logs until P1-8 fills it in.
- `GET /facilities` lists government types (PHC, CHC, GH) before private, then nearest first when `lat`/`lng` are given.

## Layout

`app/main.py` wires the routers under `/api/v1`; `app/routers/` has one file per domain (`facilities`, `booking`, `auth`, `live`, `calls`); `app/models.py` and `app/db.py` hold the tables and session; `app/safety/` is the emergency/symptom gate.

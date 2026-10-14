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
| `desk<facility_id>@sahay.demo` (one per partner facility, e.g. `desk7@sahay.demo`) | `demo1234` | `hospital_admin` of that hospital |
| `reception@sunrise.demo`, `nurse@sunrise.demo` | `demo1234` | `receptionist` / `nurse`: everything in Sahay Desk except Users |
| `harini@sunrise.demo`, `karthik@sunrise.demo`, … (one per seeded doctor, see `data/seed/users.csv`) | `demo1234` | `doctor`: only their own appointments and past patients |
| `admin@sahay.demo` | `demo1234` | `admin`: the Hello Sahay team, all hospitals (admin console) |

Roles: `admin` (Hello Sahay), then per hospital `hospital_admin`, `receptionist`, `nurse`, `doctor`. The Hello Sahay admin creates a
hospital's admin login; that admin creates the other three from the Users tab (`POST /users`). A switched-off login (`active=false`)
cannot sign in, but a token already issued keeps working until it expires (12 h).

Patient OTP login: `POST /auth/otp/request {phone}` then `POST /auth/otp/verify {phone, code}` with `code = DEMO_OTP` (default `123456`). No SMS is sent.

Send the token as `Authorization: Bearer <token>`.

## What needs a token

| Endpoint | Rule |
|---|---|
| `GET /appointments?date` (`history=true` for earlier days) | Any hospital login, own facility only; a doctor login sees only their own patients. Admin may pass `facility_id` |
| `PATCH /appointments/{id}` with `arrived`, `no_show` | Front desk (hospital admin, receptionist, nurse) of that facility; arrival triggers the per-patient fee, except counter walk-ins |
| `PATCH /appointments/{id}` with `complete` | Front desk, or the appointment's own doctor; only after `arrived` |
| `POST /appointments/walk-in` | Front desk: takes the doctor's free slot within 20 minutes or an extra slot now, marked arrived, source `desk` |
| `GET /doctors?date`, `PATCH /doctors/{id}` (`on_duty`) | Any hospital login (a doctor sees and switches only themselves); an off-duty doctor gets no new bookings |
| `GET /users`, `POST /users`, `PATCH /users/{id}` | Hospital admin (own facility) or Hello Sahay admin (`facility_id`); only the Hello Sahay admin creates a `hospital_admin` |
| `GET /calls`, `GET /handoffs`, `PATCH /calls/{id}` (`callback_done`) | Front desk, own facility only; doctors get 403; admin sees all |
| `WS /live/desk/{facility_id}?token=` | Token required, for that facility; a doctor's socket only hears about their own appointments |
| everything else | Open, because the voice service and the patient app call it without a desk login |

## Behaviour worth knowing

- Phone numbers are normalised to `+91XXXXXXXXXX`; `9876543210`, `09876543210` and `+91 98765 43210` are the same patient.
- Booking locks the slot row (`SELECT … FOR UPDATE`); a second booking of the same slot gets **409**.
- `PATCH /appointments/{id}` actions: `reschedule` (needs `new_slot_id`), `cancel` (frees the slot), `arrived`, `complete`, `no_show`. An appointment that is not `booked` (or, for `complete`, not `arrived`) answers 409.
- Slots exist for the next 7 days for every partner doctor: created at start-up and every 6 hours (`app/slots.py`), never removed.
- The demo hospital is the first partner facility (`app/demo.py`): `POST /calls` without a `facility_id` is filed under it, and `GET /places/nearby-hospitals` points every real hospital's `book_facility_id` at it.
- Every booking, change and call is pushed as `{"type":"appointment","appointment":{…}}` or `{"type":"call","call":{…}}` to that facility's sockets. The hub is in-process, so run one uvicorn worker.
- `app/notify.py:send_whatsapp` only logs until P1-8 fills it in.
- `GET /facilities` lists government types (PHC, CHC, GH) before private, then nearest first when `lat`/`lng` are given.

## Chat and advisories (P1-10)

`POST /chat {message, lang}` returns `{answer, citations[{issuer,title,url,published}], safety_flag, grounded}`:

1. The safety gate runs first; an emergency or symptom message gets its fixed reply and no model call.
2. The message is embedded (Titan v2, 1024 dims) and the nearest `advisory_chunk` rows under `ADVISORY_MAX_DISTANCE` (default 0.75) are retrieved, at most 2 per document.
3. Nova Lite may only rephrase those excerpts, in the asked language, and must name the excerpts it used.
4. No usable citation, `NO_ANSWER`, or any Bedrock error returns the fixed fallback ("I don't have verified information on that...") with `grounded: false`.

`GET /advisories?lang` lists one row per source document with issuer, link and a short summary.

Load or refresh the corpus (idempotent, replaces each document's chunks; about 1 s per chunk because the personal account throttles Titan):

```bash
AWS_PROFILE=personal-bedrock python scripts/ingest_advisories.py [--dir DIR] [--only DOC_ID ...]
```

`published` must be a full date (`2024-04-15`) or `YYYY-MM`; a bare year is stored empty rather than guessed. Tests: `python -m pytest app/chat app/safety -q` from `services/api`.

## Layout

`app/main.py` wires the routers under `/api/v1`; `app/routers/` has one file per domain (`facilities`, `booking`, `auth`, `live`, `calls`, `chat`); `app/chat/` holds Bedrock access, chunking and the chat pipeline; `app/models.py` and `app/db.py` hold the tables and session; `app/safety/` is the emergency/symptom gate.

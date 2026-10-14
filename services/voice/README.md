# services/voice — Voice pipeline

Browser/app audio over WebSocket → Amazon Transcribe (ta/hi/en-IN) → safety gate → Bedrock with tools → Polly (hi/en) / Sarvam or Google (ta) → audio back.
Flow: `docs/ARCHITECTURE.md` §2.1. Task cards: P1-5 to P1-8.

## Demo phone number (task card P2-7 bonus)

Two providers share one bridge, `telephony/phone_bridge.py`. Each call is a `CallSession` (the same pipeline the browser page uses) at 8 kHz; language is `?lang=en|hi|ta` (Twilio: on the `/incoming` webhook URL; Exotel: on the `/exotel` URL), default `en`.

| Provider | Number | Caller needs | Entry point |
|---|---|---|---|
| Exotel trial (Indian number, free, no KYC) | the trial ExoPhone shown in the Exotel dashboard | an Indian phone, no international calling | Voicebot applet URL `wss://<tunnel-host>/exotel` |
| Twilio trial (US number) | +1 737 250 8034 | international calling, and the phone listed under Verified Caller IDs | webhook `https://<tunnel-host>/incoming` (POST) |

Run it (two terminals; the tunnel URL changes every run, so re-save it in the provider dashboard):

```
python -m uvicorn telephony.phone_bridge:app --app-dir services/voice --port 8000
cloudflared tunnel --url http://localhost:8000
```

Twilio: Console → Home → Make a voice call → Receive a call → Custom. Exotel: dashboard → App Bazaar → call flow with a Voicebot applet. Tests: `cd services/voice && python -m pytest`.

## Exotel (the demo helpline, 2026-10-14, verified on a real call)

- Account `drmgruniversity1`, call flow **Hello Sahay Voicebot** (app id 1360750) attached to the landline **044-481-36970**
  (and to the shared trial ExoPhone 095-138-86363, which asks callers for the account PIN: use the landline).
- Voicebot applet URL: `wss://<host>/exotel?sample-rate=8000&lang=auto`. Exotel strips the query string from the
  connection and delivers it in `start.custom_parameters`; the bridge reads `lang` and the caller's number (`start.from`)
  from there. `lang=auto` detects en/hi/ta per sentence (Sarvam) and switches voice and replies mid-call.
- Exotel parses every message field as a string: outbound audio must be exactly
  `{"event":"media","stream_sid":..,"media":{"payload":..}}` (a numeric `sequence_number` or `chunk` ends the call).
  Audio is paced in real time; greeting audio is cached at start-up.
- Permanent host: `wss://13-127-85-246.sslip.io/exotel` (Lightsail, deploys from `main`, see `deploy/README.md`).
  Laptop fallback: `cloudflared tunnel --url http://localhost:8000` and re-save the new host in the flow.
- Trial rules: calls only from/to verified co-workers' numbers; trial lasts 7 days from activation.

## Browser test page

`AWS_PROFILE=personal-bedrock python -m uvicorn pipeline.server:app --app-dir services/voice --port 8002`, open http://localhost:8002 (needs the API on :8001). Language: English/Hindi (Transcribe + Polly), Tamil (Sarvam, needs `SARVAM_API_KEY` in `.env`). Also the `/call` demo page.


## Call flow (2026-10-15)

1. Greeting is short: with `lang=auto` (the default on the phone) one line per language, then "speak after the beep", then a beep.
   The beep is generated in `session._beep`, so it works on every carrier. The mic stays muted until the beep has played.
2. The caller's number comes from the carrier (Exotel `start.from`, Twilio `<Parameter name="from">`); the browser page has an
   optional number field. It is never asked for when known. `GET /patients/{phone}` tells the call whether the caller is
   registered in the Sahay app and where they are; a live location is confirmed once out loud, otherwise the village is asked.
3. `find_facilities` names the **real** nearest hospital (OpenStreetMap via `GET /places/nearby-hospitals`, nearest first) as
   `recommended`, plus the nearest government one as `free_government_option` when it is a different hospital. Every
   hospital returned is bookable; a hospital the caller names through `hospital_name` is accepted as said even if it is not
   on the list. If the lookup is down the demo hospital is named under its own name.
4. `get_slots` honours `doctor_name` and `preferred_time`: `exact`, `next_for_doctor`, `any` or `none`. A doctor the
   caller names who is not at the demo hospital is **never refused**: the doctor who is free in the closest slot is offered
   and booked, and the confirmation names that doctor.
5. `book_appointment` uses the call's number. **Demo wiring:** the doctors, slots and booking are always the one demo
   hospital's (Sunrise Nursing Home, see `data/seed/README.md`); the caller is told the real hospital's name, which is saved
   on the appointment as `hospital_label`. The booking shows in the patient app (`/patients/{phone}/appointments`), in the
   demo hospital's Sahay Desk and in the assigned doctor's own login (for example `harini@sunrise.demo`, password
   `demo1234`). Every call log lands on the same Desk, with "hospital: <name told>" in its summary.

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
  from there. `lang=auto` detects en/hi/ta (Sarvam); the first sentence sets the language and only a whole sentence in another one changes it later.
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
6. After a booking, a short thanks or goodbye from the caller (`session._CLOSING`, six words or fewer) is answered with a fixed
   goodbye (`prompts.GOODBYE`) and the call hangs up, with no model round trip. Choosing another slot after booking
   reschedules that appointment (`PATCH /appointments/{id}`) instead of creating a second one.

## Call logging and monitoring (2026-10-15)

Every call keeps a timestamped trace (`call.trace`, saved with the call record when the call ends). Read it after any call:

```bash
python scripts/call_trace.py latest                       # newest call, local API on :8001
python scripts/call_trace.py 41 --base https://13-127-85-246.sslip.io/api/v1
```

It prints the whole timeline and a FINDINGS list: `LOOP` (the agent or the caller repeated a sentence), `ECHO` (the
transcriber heard our own voice, or the line carried sound while we spoke), `PAUSE` (a turn silent for over 4 s, with the
model's share), `SLOW` (a model round, tool call or speech synthesis over 3 s), `ERROR`, `SAVE_FAILED`, `BLOCKED_REPLY`.
The same events go to the service log (`docker logs` on the box, logger `sahay.trace`, one JSON line each).
API: `GET /api/v1/calls/{id}/trace` (Desk or admin login).

Events: `call_start`, `carrier_start`, `audio_in` (caller audio level every 2 s, and how much arrived while we were
speaking), `stt_result`, `noise`, `echo_stripped`, `language_kept`, `turn_start`, `gate`, `llm_round`, `llm_retry`, `tool`
(arguments, result, ms), `tts` (ms, cached), `blocked_reply`, `said`, `latency` (`first_audio_ms`), `filler`, `unclear`,
`no_input`, `repeat_reply`, `give_up`, `listening`, `error`, `save_failed`, `carrier_closed`, `call_end`.
`said` is stamped after the audio has been played out; use `latency` and `tts` for timing.

`scripts/sim_call.py` places a synthetic call through the Exotel bridge (Polly speaks scripted sentences; `--echo 0.5`
adds line echo, no `--say` gives a silent caller). Run the bridge on another port with `API_BASE_URL` pointing at a
local API, then read the call with `call_trace.py latest --base <that API>`.

### Guards against a stuck call

- Letters of scripts we do not speak (Gurmukhi, Gujarati, ... that the detector emits for noise) are dropped; an
  utterance with nothing left is noise and gets "I could not hear that".
- Our own sentences coming back on the line are cut out of what was heard (`echo_stripped`).
- The caller's first sentence (three words or more) sets the language. After that it only moves for a whole sentence of five
  words or more written in the other language's script (`session.MIN_WORDS_TO_SWITCH_LATER`, `_in_script`); a village or
  hospital name, or a short answer, never switches it (`language_kept` in the trace).
- The same reply twice in a row is re-asked once with a note to rephrase. Three strikes in a row (noise, silence for
  12 s after the beep, or a repeated question) play a goodbye, queue a human callback (`handoff`) and hang up on the
  carrier.
- A turn slower than 3 s says "one moment please". Polly, Bedrock and Sarvam requests that stall start a second attempt
  (`hedge.py`); boto3 requests time out in 15 s.

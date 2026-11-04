# services/voice — Voice pipeline

Phone or browser audio over WebSocket → speech-to-text (Sarvam `saarika:v2.5` for Tamil, Malayalam, Kannada, Telugu and `lang=auto`, `SARVAM_API_KEY` may list several comma-separated keys and the next one is used when a key runs out of credit or is rate-limited; Amazon Transcribe for fixed English/Hindi) → safety gate → Bedrock Nova Pro with tools → Polly (en/hi) or Sarvam `bulbul:v3` (ta) → audio back.
Flow: `docs/ARCHITECTURE.md` §2.1 and the diagrams in `docs/diagrams/`. Task cards: P1-5 to P1-8.

## Demo phone number (task card P2-7 bonus)

Two providers share one bridge, `telephony/phone_bridge.py` (Exotel is the one in use; the Twilio endpoints are kept but Twilio was dropped, see decision log 24). Each call is a `CallSession` (the same pipeline the browser page uses) at 8 kHz; language is `?lang=en|hi|ta|ml|kn|te|auto` (Twilio: on the `/incoming` webhook URL; Exotel: on the `/exotel` URL), default `en`.

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

## Exotel (the demo helpline; first account verified on a real call 2026-10-14)

- Since 2026-11-04: account `apppes1` (a new free trial, because the first account went to -1064 credits), call flow
  **Hello Sahay Voicebot** (app id 1375303) attached to the landline **080-472-90138** and to the shared trial ExoPhone
  095-138-86363, which asks callers for the account PIN (use the landline). Set up by hand in the Exotel dashboard (App Bazaar,
  Create flow, Voicebot applet, then ExoPhones, pick the flow); checked with a synthetic call, not yet a real phone.
  Our code holds no Exotel key: Exotel connects to us. To move to another account, repeat those dashboard steps and
  update the number in the docs and `HELPLINE_NUMBER` (default in `services/api/app/routers/config.py`).
- First account (`drmgruniversity1`, landline 044-481-36970, app id 1360750): trial over, credits negative.
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


## Call flow (rewritten 2026-11-04, severity routing)

1. **Welcome and language.** On the phone (`lang=auto`) the caller hears "Hello, welcome to Hello Sahay. For English, say
   English." and one line per other language, then "After the beep, tell us in your own language what is troubling you"
   and a beep. The beep is generated in `session._beep`; the mic stays muted until it has played. A patient normally just
   describes the problem, so the first sentence gives **both** the language and the reason: the language's name in any
   script (`pipeline/languages.py`) or, failing that, the language the speech-to-text detected.
2. **Disclaimer in their language.** `prompts.DISCLAIMER[lang]`: the call is transcribed, no medical advice, call 108 in an
   emergency. When the first sentence already told the problem, the disclaimer is followed straight by the model's answer
   (the problem is never asked again); only a caller who just named a language also hears "What is troubling you?"
   (`prompts.AFTER_LANGUAGE`). A call with a fixed language (browser page, `lang=hi`) gets the same text in
   `prompts.GREETING`. The emergency check runs before this step, so "chest pain" is never held up by it.
2b. **Existing appointment.** On connect the number is looked up (`GET /patients/{phone}/appointments`). If it has an
   upcoming booked appointment, the model says it once right after the disclaimer and asks "details, or something new?"
   (`prompts.caller_block`, step 0). Changing or cancelling goes to a person (`handoff_to_human`).
3. **Reason, then severity.** The model reads the caller's own words (slang and regional words included) and sets
   `severity` to mild, moderate or serious on `find_facilities`. This is not a diagnosis; it only decides what is offered
   first, and the tag is saved on the call (`call.severity`) where Sahay Desk and the admin console can correct it. If it
   cannot tell it asks once "mild, medium or very serious?". The tool arguments are written in English (reason) and
   English letters (area) whatever language the call is in.
4. **Location.** The app's live location when the number is registered (confirmed once out loud), otherwise a **specific**
   area: a locality, village or landmark. A whole city ("Chennai") is refused and the caller is asked for the area. The area
   is looked up in the local table (`villages.csv`: demo district plus about 30 Chennai areas, fuzzy matched) and otherwise
   on OpenStreetMap through `GET /places/geocode`, which also refuses cities and districts.
5. **What is offered** (`tools.t_find_facilities`):
   - mild: up to three **partner clinics** under 3 km (`GET /facilities?kind=clinic&partner_only=true&max_km=3&use_demo_distance=true`), bookable.
     **Prototype wiring:** every seeded clinic has a fixed distance from any caller (`facility.demo_distance_km`, set in
     `data/seed/facilities.csv`): three are under 3 km (0.8, 1.6 and 2.4) and the other twelve are 3.6 to 15 km away, so the
     same three are offered wherever the call comes from (Tambaram, George Town, anywhere) and no street address is spoken.
     Clear the column to use the clinics' real coordinates again.
     The agent then asks "book one of these, or hear about hospitals too?"; hospitals come on request (`show=hospitals`).
     No partner clinic nearby: it says so and offers hospitals.
   - moderate: the real hospitals within 3 km (OpenStreetMap, up to three; when none is that close, the two nearest with a
     note), government (free) and private, nearest first, then "book
     one, or hear about the nearest free government hospitals?" (`show=free_government`). Clinics on request.
   - serious: "call 108 now or go to <nearest hospital>, <distance>, <address>; a person will call back", then the call
     ends. Nothing is bookable. The deterministic emergency gate (word lists, six languages) says the fixed 108 line first
     and then takes the same path, naming the hospital from the live location or after asking for the area (the call
     ends after the hospital is named or after three turns).
6. **Government hospitals are information only.** `can_book` is false and they carry no id, so no slot or appointment can
   be made; the agent gives the name, distance and address and says to walk in. Clinics and private hospitals are bookable.
7. `get_slots` honours `doctor_name` and `preferred_time`: `exact`, `next_for_doctor`, `any` or `none`. A doctor the caller
   names who is not there is **never refused**: the doctor free in the closest slot is offered and booked.
8. `book_appointment` uses the call's number and refuses a placeholder name ("Anonymous"): the agent must ask. **Partner
   clinics** (15 seeded, `data/seed/`) are real Desk facilities with their own doctors, slots and hospital-admin login
   (`desk<id>@sahay.demo`, password `demo1234`); the booking lands on that clinic's Desk and the confirmation names it.
   **Demo wiring for private hospitals:** a real private hospital's name is told to the caller, but its doctors, slots and
   booking are the one demo hospital's (Sunrise Nursing Home); the real name is saved as `hospital_label`.
9. After a booking, a short thanks (`session._CLOSING`) is answered with a fixed goodbye and the call hangs up, with no model
   round trip. Choosing another slot reschedules (`PATCH /appointments/{id}`) instead of creating a second booking.

Verified 2026-11-04: offline pytest (76 tests) and scripted calls with the real Nova model and a stubbed API in English
(mild, moderate, serious, government pick) and Tamil (mild). Not verified: a real phone call, the live OpenStreetMap
geocode, the seeded clinics against the real database, the Desk and admin severity control in a browser.

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

- Background noise is ignored, never answered. The Sarvam listener learns the line's background level and only counts
  audio three times louder as speech (between levels 500 and 3000, `sarvam.NOISE_FACTOR`), and drops anything with
  under 0.25 s of loud audio unsent (`MIN_SPEECH_S`). Letters of scripts we do not speak (Gurmukhi, Gujarati, ... that
  the detector emits for distant voices) are dropped; an utterance with nothing left is logged as `noise` and skipped
  silently. Found from a demo-room call where three bystander fragments each got "I could not hear that" and hung up.
- The caller has the floor only after the beep. From the moment we start answering (thinking and speaking) until the
  beep, the mic is muted and anything still transcribed is dropped (`ignored_mid_turn`), so a sentence said mid-turn
  is never answered one turn late. Found from call 17, where every reply answered the previous question. A finished
  sentence also waits up to 2.5 s while the caller's next words are still with Sarvam (`MAX_WAIT_FOR_STT_S`), so one
  thought with a pause is one turn, not two. Running out of strikes after a booking says goodbye, not "we will call back".
- Our own sentences coming back on the line are cut out of what was heard (`echo_stripped`).
- The caller's first sentence (three words or more) sets the language. After that it only moves for a whole sentence of five
  words or more written in the other language's script (`session.MIN_WORDS_TO_SWITCH_LATER`, `_in_script`); a village or
  hospital name, or a short answer, never switches it (`language_kept` in the trace).
- The same reply twice in a row is re-asked once with a note to rephrase. Three strikes in a row (silence or only noise for
  12 s after the beep, or a repeated question) play a goodbye, queue a human callback (`handoff`) and hang up on the
  carrier.
- A turn slower than 3 s says "one moment please". Polly, Bedrock and Sarvam requests that stall start a second attempt
  (`hedge.py`); boto3 requests time out in 15 s.


## Dynamic behaviour (2026-11-05, from real call 165)

- **Rules the caller gives stick.** `get_slots` takes `date` and `avoid_dates` (the model gets today's date and the next
  seven days with their dates in the caller block); avoided days are remembered in `state["avoid_dates"]` even if the model
  forgets them. It offers up to three slots spread over different days and returns `days_with_slots`, so "no slot on
  Friday" is only said when the tool says so. If a place has nothing that suits and the caller said any clinic is fine, the
  model moves to the next listed clinic.
- **No repeated lists.** The second identical `find_facilities` result carries `already_listed` and tells the model not to
  read it again (the ids stay in the result so it can still book).
- **Short, natural speech.** Addresses are cut to three meaningful parts (`tools.short_address`: no pincode, district,
  state or country) and only given on request; distances come as `distance_text` ("800 metres", "2.4 km"); Hindi
  "आपके पास तीन ..." (you own three) is rewritten to "आपके नज़दीक" in `session._think`.
- Replay a conversation against the real Nova model with a stubbed API by copying the pattern in `test_pipeline.py`
  (`make_session`) and calling `session._turn(text)` per caller sentence.

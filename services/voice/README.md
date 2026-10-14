# services/voice — Voice pipeline

Browser/app audio over WebSocket → Amazon Transcribe (ta/hi/en-IN) → safety gate → Bedrock with tools → Polly (hi/en) / Sarvam or Google (ta) → audio back.
Flow: `docs/ARCHITECTURE.md` §2.1. Task cards: P1-5 to P1-8.

## Demo phone number (Twilio trial, task card P2-7 bonus)

Helpline number: **+1 737 250 8034**. Only phones listed under Twilio Console → Verified Caller IDs can call it on the trial plan. Today it plays an echo of the caller's own voice; the real pipeline replaces the echo line in `telephony/twilio_bridge.py`.

Run it (two terminals; the tunnel URL changes every run):

```
python -m uvicorn twilio_bridge:app --app-dir services/voice/telephony --port 8000
cloudflared tunnel --url http://localhost:8000
```

Then in the Twilio Console: Home → Make a voice call → Receive a call → Custom → set the webhook to `https://<tunnel-host>/incoming` (POST) and Save. Tests: `cd services/voice/telephony && python -m pytest`.

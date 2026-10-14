"""Twilio Media Streams bridge: a phone call in, our voice pipeline behind it.

Run: uvicorn twilio_bridge:app --app-dir services/voice/telephony --port 8000
Twilio's "A call comes in" webhook points at POST /incoming on the public
tunnel URL. Audio is 8 kHz mu-law, base64, 20 ms frames each way. Python 3.13+
needs `pip install audioop-lts` (stdlib audioop was removed).
"""
import audioop
import base64
import json

from fastapi import FastAPI, Request, Response, WebSocket

app = FastAPI()


def mulaw_to_pcm16(frame: bytes) -> bytes:
    return audioop.ulaw2lin(frame, 2)


def pcm16_to_mulaw(pcm: bytes) -> bytes:
    return audioop.lin2ulaw(pcm, 2)


@app.post("/incoming")
async def incoming(request: Request) -> Response:
    host = request.headers.get("x-forwarded-host") or request.headers["host"]
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Connect><Stream url="wss://{host}/media"/></Connect></Response>'
    )
    return Response(twiml, media_type="text/xml")


@app.websocket("/media")
async def media(ws: WebSocket) -> None:
    await ws.accept()
    stream_sid = None
    async for raw in ws.iter_text():
        msg = json.loads(raw)
        if msg["event"] == "start":
            stream_sid = msg["start"]["streamSid"]
        elif msg["event"] == "media":
            pcm = mulaw_to_pcm16(base64.b64decode(msg["media"]["payload"]))
            # ponytail: echo test; STT -> safety gate -> LLM -> TTS replaces these two lines
            out = pcm16_to_mulaw(pcm)
            reply = {"event": "media", "streamSid": stream_sid, "media": {"payload": base64.b64encode(out).decode()}}
            await ws.send_text(json.dumps(reply))
        elif msg["event"] == "stop":
            break
    # ponytail: /incoming and /media are unauthenticated; validate X-Twilio-Signature once the paid pipeline sits behind them

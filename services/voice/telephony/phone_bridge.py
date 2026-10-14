"""Phone bridge: a phone call in, our voice pipeline behind it.

Run: uvicorn phone_bridge:app --app-dir services/voice/telephony --port 8000
Exotel (Indian number): the Voicebot applet's URL is wss://<tunnel>/exotel;
audio is 8 kHz 16-bit PCM, base64, and Exotel wants >= 100 ms per outbound frame.
Twilio (US number): the "A call comes in" webhook is POST /incoming on the
tunnel; audio is 8 kHz mu-law, base64, 20 ms frames. Python 3.13+ needs
`pip install audioop-lts` (stdlib audioop was removed).
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


EXOTEL_CHUNK = 320  # 20 ms of 8 kHz 16-bit mono; outbound frames must be a multiple of this
EXOTEL_MIN_SEND = 3200  # and at least 100 ms


@app.websocket("/exotel")
async def exotel(ws: WebSocket) -> None:
    await ws.accept()
    stream_sid, buf, n = None, b"", 0
    async for raw in ws.iter_text():
        msg = json.loads(raw)
        stream_sid = msg.get("stream_sid", stream_sid)
        if msg["event"] == "media":
            buf += base64.b64decode(msg["media"]["payload"])
            if len(buf) >= EXOTEL_MIN_SEND:
                cut = len(buf) // EXOTEL_CHUNK * EXOTEL_CHUNK
                # ponytail: echo test; STT -> safety gate -> LLM -> TTS replaces this line
                out, buf = buf[:cut], buf[cut:]
                n += 1
                media = {"chunk": n, "timestamp": str(n * 100), "payload": base64.b64encode(out).decode()}
                await ws.send_text(json.dumps({"event": "media", "sequence_number": n, "stream_sid": stream_sid, "media": media}))
        elif msg["event"] == "stop":
            break

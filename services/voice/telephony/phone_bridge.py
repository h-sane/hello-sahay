"""Phone bridge: a phone call in, the voice pipeline (CallSession) behind it.

Run from services/voice: python -m uvicorn telephony.phone_bridge:app --app-dir services/voice --port 8000
Exotel (Indian number): Voicebot applet URL wss://<tunnel>/exotel?lang=en|hi|ta;
audio is 8 kHz 16-bit PCM, base64; outbound frames must be a multiple of 320 bytes and >= 100 ms.
Twilio (US number): the "A call comes in" webhook is POST /incoming?lang=en|hi|ta on the tunnel;
audio is 8 kHz mu-law, base64, 20 ms frames. Python 3.13+ needs `pip install audioop-lts`.
"""
import asyncio
import audioop
import base64
import json
import logging
from contextlib import suppress
from xml.sax.saxutils import quoteattr

from fastapi import FastAPI, Request, Response, WebSocket

from pipeline.session import CallSession

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("sahay.bridge")
LANGS = {"en", "hi", "ta", "auto"}
RATE = 8000  # both carriers; Transcribe and Polly accept 8 kHz directly
TWILIO_FRAME = 160  # 20 ms of mu-law
EXOTEL_CHUNK = 320  # 20 ms of 8 kHz 16-bit mono; outbound frames must be a multiple of this
EXOTEL_MIN_SEND = 3200  # and at least 100 ms

app = FastAPI()


def mulaw_to_pcm16(frame: bytes) -> bytes:
    return audioop.ulaw2lin(frame, 2)


def pcm16_to_mulaw(pcm: bytes) -> bytes:
    return audioop.lin2ulaw(pcm, 2)


def _lang(value: str | None) -> str:
    return value if value in LANGS else "en"


async def _no_event(_: dict) -> None:
    return None


class _Call:
    """One CallSession whose lifetime follows the carrier's websocket."""

    def __init__(self, lang: str, send_audio):
        self.session = CallSession(lang, send_audio, _no_event, in_rate=RATE, out_rate=RATE)
        self.task = asyncio.create_task(self.session.run())

    def feed(self, pcm: bytes) -> None:
        self.session.feed_audio(pcm)

    async def close(self) -> None:
        await self.session.close()
        self.task.cancel()
        with suppress(BaseException):
            await self.task


@app.post("/incoming")
async def incoming(request: Request) -> Response:
    host = request.headers.get("x-forwarded-host") or request.headers["host"]
    lang = _lang(request.query_params.get("lang"))
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Connect><Stream url="wss://{host}/media">'
        f'<Parameter name="lang" value={quoteattr(lang)}/></Stream></Connect></Response>'
    )
    return Response(twiml, media_type="text/xml")


@app.websocket("/media")
async def media(ws: WebSocket) -> None:
    await ws.accept()
    stream_sid, call = None, None

    async def send_audio(pcm: bytes) -> None:
        mulaw = pcm16_to_mulaw(pcm)
        for i in range(0, len(mulaw), TWILIO_FRAME):
            payload = base64.b64encode(mulaw[i:i + TWILIO_FRAME]).decode()
            await ws.send_text(json.dumps({"event": "media", "streamSid": stream_sid, "media": {"payload": payload}}))

    try:
        async for raw in ws.iter_text():
            msg = json.loads(raw)
            if msg["event"] == "start":
                stream_sid = msg["start"]["streamSid"]
                params = msg["start"].get("customParameters", {})
                call = _Call(_lang(params.get("lang") or ws.query_params.get("lang")), send_audio)
            elif msg["event"] == "media" and call:
                call.feed(mulaw_to_pcm16(base64.b64decode(msg["media"]["payload"])))
            elif msg["event"] == "stop":
                break
    finally:
        if call:
            await call.close()
    # ponytail: /incoming and /media are unauthenticated; validate X-Twilio-Signature before a public number


@app.websocket("/exotel")
async def exotel(ws: WebSocket) -> None:
    await ws.accept()
    stream_sid, call, seq = None, None, 0

    async def send_audio(pcm: bytes) -> None:
        nonlocal seq
        pcm += bytes(-len(pcm) % EXOTEL_MIN_SEND)  # pad the tail with silence to whole 100 ms frames
        for i in range(0, len(pcm), EXOTEL_MIN_SEND):
            seq += 1
            media = {"chunk": seq, "timestamp": str(seq * 100),
                     "payload": base64.b64encode(pcm[i:i + EXOTEL_MIN_SEND]).decode()}
            await ws.send_text(json.dumps(
                {"event": "media", "sequence_number": seq, "stream_sid": stream_sid, "media": media}))

    try:
        async for raw in ws.iter_text():
            msg = json.loads(raw)
            stream_sid = msg.get("stream_sid", stream_sid)
            if msg["event"] == "start" and not call:
                call = _Call(_lang(ws.query_params.get("lang")), send_audio)
            elif msg["event"] == "media":
                if not call:
                    call = _Call(_lang(ws.query_params.get("lang")), send_audio)
                call.feed(base64.b64decode(msg["media"]["payload"]))
            elif msg["event"] == "stop":
                break
    finally:
        if call:
            await call.close()

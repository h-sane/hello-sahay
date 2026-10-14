"""Phone bridge: a phone call in, the voice pipeline (CallSession) behind it.

Run from services/voice: python -m uvicorn telephony.phone_bridge:app --app-dir services/voice --port 8000
Exotel (Indian number): Voicebot applet URL wss://<tunnel>/exotel?lang=en|hi|ta;
audio is 8 kHz 16-bit PCM, base64; outbound frames must be a multiple of 320 bytes and >= 100 ms.
Twilio (US number): the "A call comes in" webhook is POST /incoming?lang=en|hi|ta|auto on the tunnel;
audio is 8 kHz mu-law, base64, 20 ms frames. Python 3.13+ needs `pip install audioop-lts`.
"""
import asyncio
import audioop
import base64
import json
import logging
from contextlib import suppress
from urllib.parse import parse_qs
from xml.sax.saxutils import quoteattr

from fastapi import FastAPI, Request, Response, WebSocket

from pipeline.session import CallSession

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
log = logging.getLogger("sahay.bridge")
LANGS = {"en", "hi", "ta", "auto"}
RATE = 8000  # both carriers; Transcribe and Polly accept 8 kHz directly
TWILIO_FRAME = 160  # 20 ms of mu-law
EXOTEL_CHUNK = 320  # 20 ms of 8 kHz 16-bit mono; outbound frames must be a multiple of this
EXOTEL_MIN_SEND = 3200  # and at least 100 ms

app = FastAPI()


@app.on_event("startup")
async def _prewarm() -> None:
    asyncio.create_task(CallSession.prewarm(RATE))


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

    def __init__(self, lang: str, send_audio, on_end=None):
        self.on_end = on_end  # the session ended itself (emergency, give-up): hang up on the carrier
        self.session = CallSession(lang, send_audio, _no_event, in_rate=RATE, out_rate=RATE)
        self.task = asyncio.create_task(self.session.run())
        self.task.add_done_callback(self._done)

    def _done(self, t: asyncio.Task) -> None:
        if not t.cancelled() and t.exception():
            log.error("call session failed", exc_info=t.exception())
            self.session.trace.add("error", where="session", error=repr(t.exception()))
        if not t.cancelled() and self.on_end:
            self.on_end()

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
    lang = _lang(request.query_params.get("lang") or "auto")
    caller = parse_qs((await request.body()).decode()).get("From", [""])[0]  # Twilio posts the caller as a form field
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Connect><Stream url="wss://{host}/media">'
        f'<Parameter name="lang" value={quoteattr(lang)}/>'
        f'<Parameter name="from" value={quoteattr(caller)}/></Stream></Connect></Response>'
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
                call = _Call(_lang(params.get("lang") or ws.query_params.get("lang") or "auto"), send_audio,
                             on_end=lambda: asyncio.create_task(ws.close()))
                call.session.state["phone"] = params.get("from") or None
                call.session.trace.add("carrier_start", carrier="twilio", params=params)
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
    stream_sid, call, seq, event = None, None, 0, None

    closed = False

    async def send_audio(pcm: bytes) -> None:
        nonlocal seq
        pcm += bytes(-len(pcm) % EXOTEL_MIN_SEND)  # pad the tail with silence to whole frames
        for i in range(0, len(pcm), EXOTEL_MIN_SEND):
            if closed:
                return
            seq += 1
            # Exotel parses every field as a string, so a numeric sequence_number or chunk ends the call;
            # the documented outbound message is only event, stream_sid and media.payload.
            await ws.send_text(json.dumps({"event": "media", "stream_sid": stream_sid,
                                           "media": {"payload": base64.b64encode(pcm[i:i + EXOTEL_MIN_SEND]).decode()}}))
            await asyncio.sleep(EXOTEL_MIN_SEND / 2 / RATE * 0.9)  # stay just ahead of real time; Exotel hangs up on bursts

    def open_call(msg: dict) -> "_Call":
        # Exotel drops the URL query string; it delivers it in start.custom_parameters
        start = msg.get("start") or {}
        params = start.get("custom_parameters") or start.get("customParameters") or {}
        lang = _lang(params.get("lang") or ws.query_params.get("lang") or "auto")
        c = _Call(lang, send_audio, on_end=lambda: asyncio.create_task(ws.close()))
        c.session.state["phone"] = start.get("from") or start.get("From")
        log.info("exotel call open lang=%s from=%s", lang, c.session.state["phone"])
        c.session.trace.add("carrier_start", carrier="exotel", lang=lang, start=json.dumps(start)[:500])
        return c

    try:
        async for raw in ws.iter_text():
            msg = json.loads(raw)
            stream_sid = msg.get("stream_sid", stream_sid)
            event = msg.get("event")
            if event != "media":
                log.info("exotel event %s", raw[:600])
            if event == "start" and not call:
                call = open_call(msg)
            elif event == "media":
                if not call:
                    call = open_call(msg)
                call.feed(base64.b64decode(msg["media"]["payload"]))
            elif event == "stop":
                break
    except Exception as e:
        log.exception("exotel websocket failed")
        if call:
            call.session.trace.add("error", where="exotel_ws", error=repr(e))
    finally:
        closed = True
        log.info("exotel websocket closed, %d audio frames sent", seq)
        if call:
            call.session.trace.add("carrier_closed", frames_sent=seq, last_event=event)
        if call:
            await call.close()

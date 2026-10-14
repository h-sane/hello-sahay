"""Voice service on :8002. Run: python -m uvicorn pipeline.server:app --app-dir services/voice --port 8002

WS /call?lang=en|hi|ta : binary frames are 16 kHz mono PCM16 both ways; text frames are JSON events.
GET /               : minimal test page (static/call.html).
"""
import asyncio
import json
import logging
from contextlib import suppress
from pathlib import Path

from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse

from .session import CallSession

logging.basicConfig(level=logging.INFO)
STATIC = Path(__file__).resolve().parents[1] / "static"
LANGS = {"en", "hi", "ta"}

app = FastAPI(title="Hello Sahay voice")


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(STATIC / "call.html")


@app.websocket("/call")
async def call(ws: WebSocket, lang: str = "en") -> None:
    await ws.accept()
    lang = lang if lang in LANGS else "en"

    async def send_event(e: dict) -> None:
        await ws.send_text(json.dumps(e, ensure_ascii=False))

    session = CallSession(lang, ws.send_bytes, send_event)

    async def pump() -> None:
        while True:
            m = await ws.receive()
            if m["type"] == "websocket.disconnect":
                return
            if m.get("bytes"):
                session.feed_audio(m["bytes"])
            elif m.get("text") and json.loads(m["text"]).get("type") == "end":
                return

    runner, pumper = asyncio.create_task(session.run()), asyncio.create_task(pump())
    await asyncio.wait({runner, pumper}, return_when=asyncio.FIRST_COMPLETED)
    await session.close()
    for t in (runner, pumper):
        t.cancel()
    with suppress(Exception):
        await ws.close()

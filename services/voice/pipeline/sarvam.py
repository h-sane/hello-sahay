"""Tamil speech via Sarvam: saarika:v2.5 speech-to-text and bulbul:v3 text-to-speech (both request/response)."""
import asyncio
import audioop
import base64
import io
import logging
import wave
from typing import Awaitable, Callable

import httpx

from . import config

log = logging.getLogger("sahay.sarvam")
BASE = "https://api.sarvam.ai"
SPEECH_RMS = 500  # 16-bit sample level that counts as speech
QUIET_S = 0.6  # silence after speech that closes an utterance
MAX_S = 20.0


def _headers() -> dict:
    if not config.SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is not set in .env")
    return {"api-subscription-key": config.SARVAM_API_KEY}


async def synthesize(text: str, lang: str, rate: int) -> bytes:
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(f"{BASE}/text-to-speech", headers=_headers(), json={
            "text": text, "target_language_code": "ta-IN", "model": "bulbul:v3", "speech_sample_rate": rate})
        r.raise_for_status()
    with wave.open(io.BytesIO(base64.b64decode(r.json()["audios"][0]))) as w:
        pcm, src = w.readframes(w.getnframes()), w.getframerate()
    return pcm if src == rate else audioop.ratecv(pcm, 2, 1, src, rate, None)[0]


class SarvamStt:
    end_silence = 0.3  # the utterance is already closed by silence here, so the turn can start straight away

    def __init__(self, lang: str, sample_rate: int):
        self.rate = sample_rate
        self.code = "unknown" if lang == "auto" else "ta-IN"  # "unknown" lets Sarvam detect en/hi/ta per utterance
        self.detected: str | None = None

    async def run(self, audio_q: "asyncio.Queue[bytes | None]", on_result: Callable[[str, bool], Awaitable[None]]) -> None:
        buf, quiet, spoke = bytearray(), 0.0, False
        while (chunk := await audio_q.get()) is not None:
            secs = len(chunk) / (2 * self.rate)
            if audioop.rms(chunk, 2) > SPEECH_RMS:
                spoke, quiet = True, 0.0
            elif spoke:
                quiet += secs
            if spoke:
                buf += chunk
            if spoke and (quiet >= QUIET_S or len(buf) / (2 * self.rate) >= MAX_S):
                pcm, buf, quiet, spoke = bytes(buf), bytearray(), 0.0, False
                text = await self._transcribe(pcm)
                if text:
                    await on_result(text, True)

    async def _transcribe(self, pcm: bytes) -> str:
        out = io.BytesIO()
        with wave.open(out, "wb") as w:
            w.setnchannels(1), w.setsampwidth(2), w.setframerate(self.rate), w.writeframes(pcm)
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(f"{BASE}/speech-to-text", headers=_headers(),
                             files={"file": ("a.wav", out.getvalue(), "audio/wav")},
                             data={"model": "saarika:v2.5", "language_code": self.code})
            r.raise_for_status()
        body = r.json()
        self.detected = (body.get("language_code") or "").split("-")[0] or None
        return body.get("transcript", "").strip()

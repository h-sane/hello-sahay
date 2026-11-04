"""Tamil, Malayalam, Kannada and Telugu speech via Sarvam: saarika:v2.5 speech-to-text and bulbul:v3 text-to-speech (both request/response)."""
import asyncio
import audioop
import base64
import io
import logging
import wave
from typing import Awaitable, Callable

import httpx

from . import config
from .hedge import hedged

log = logging.getLogger("sahay.sarvam")
BASE = "https://api.sarvam.ai"
SPEECH_RMS = 500  # lowest 16-bit sample level that counts as speech
NOISE_FACTOR = 3.0  # on a noisy line, speech must be this many times louder than the background level
MAX_SPEECH_RMS = 3000  # the adaptive bar never rises above this; real callers measured 7000-13000 on Exotel
MIN_SPEECH_S = 0.25  # an utterance with less loud audio than this is a click or a distant voice, never sent
QUIET_S = 0.6  # silence after speech that closes an utterance
MAX_S = 20.0
CODES = {"ta": "ta-IN", "ml": "ml-IN", "kn": "kn-IN", "te": "te-IN"}


_key = 0  # index of the key in use; moves on when Sarvam says that key is out of credit or rate-limited
OUT_OF_KEY = (402, 403, 429)


async def _post(path: str, timeout: float, **kw) -> httpx.Response:
    """POST to Sarvam with the current key; on out-of-credit or rate-limit move to the next key in SARVAM_API_KEY (comma separated)."""
    global _key
    keys = [k.strip() for k in config.SARVAM_API_KEY.split(",") if k.strip()]
    if not keys:
        raise RuntimeError("SARVAM_API_KEY is not set in .env")
    for _ in keys:
        used = _key % len(keys)
        async with httpx.AsyncClient(timeout=timeout) as c:
            r = await c.post(f"{BASE}{path}", headers={"api-subscription-key": keys[used]}, **kw)
        if r.status_code not in OUT_OF_KEY or len(keys) == 1:
            break
        if _key % len(keys) == used:  # a concurrent request may have moved it already
            _key = (used + 1) % len(keys)
            log.warning("sarvam key %d/%d returned %d, switching to key %d", used + 1, len(keys), r.status_code, _key + 1)
    r.raise_for_status()
    return r


async def synthesize(text: str, lang: str, rate: int) -> bytes:
    r = await hedged(lambda: _post("/text-to-speech", 20, json={
        "text": text, "target_language_code": CODES[lang], "model": "bulbul:v3", "speech_sample_rate": rate}), 4.0, "sarvam tts")
    with wave.open(io.BytesIO(base64.b64decode(r.json()["audios"][0]))) as w:
        pcm, src = w.readframes(w.getnframes()), w.getframerate()
    return pcm if src == rate else audioop.ratecv(pcm, 2, 1, src, rate, None)[0]


class SarvamStt:
    end_silence = 0.3  # the utterance is already closed by silence here, so the turn can start straight away

    def __init__(self, lang: str, sample_rate: int):
        self.rate = sample_rate
        self.code = "unknown" if lang == "auto" else CODES[lang]  # "unknown" lets Sarvam detect the language per utterance
        self.detected: str | None = None
        self.busy = False  # the caller is mid-sentence or their words are being transcribed: do not answer yet

    async def run(self, audio_q: "asyncio.Queue[bytes | None]", on_result: Callable[[str, bool], Awaitable[None]]) -> None:
        buf, quiet, loud, spoke = bytearray(), 0.0, 0.0, False
        floor = 0.0  # running background level; muted audio arrives as exact zeros and is left out
        while (chunk := await audio_q.get()) is not None:
            secs = len(chunk) / (2 * self.rate)
            level = audioop.rms(chunk, 2)
            bar = min(MAX_SPEECH_RMS, max(SPEECH_RMS, NOISE_FACTOR * floor))
            if level > bar:
                spoke, quiet = True, 0.0
                loud += secs
            else:
                if level and not spoke:
                    floor = level if not floor else 0.95 * floor + 0.05 * level
                if spoke:
                    quiet += secs
            if spoke:
                buf += chunk
            self.busy = spoke
            if spoke and (quiet >= QUIET_S or len(buf) / (2 * self.rate) >= MAX_S):
                pcm, enough = bytes(buf), loud >= MIN_SPEECH_S
                buf, quiet, loud, spoke = bytearray(), 0.0, 0.0, False
                if not enough:
                    log.info("dropped a %.2f s blip under the speech bar %d", len(pcm) / (2 * self.rate), bar)
                    continue
                self.busy = True
                try:
                    text = await self._transcribe(pcm)
                finally:
                    self.busy = False
                if text:
                    await on_result(text, True)

    async def _transcribe(self, pcm: bytes) -> str:
        out = io.BytesIO()
        with wave.open(out, "wb") as w:
            w.setnchannels(1), w.setsampwidth(2), w.setframerate(self.rate), w.writeframes(pcm)
        body = (await hedged(lambda: _post("/speech-to-text", 20, files={"file": ("a.wav", out.getvalue(), "audio/wav")},
                                           data={"model": "saarika:v2.5", "language_code": self.code}),
                             4.0, "sarvam stt")).json()
        self.detected = (body.get("language_code") or "").split("-")[0] or None
        return body.get("transcript", "").strip()

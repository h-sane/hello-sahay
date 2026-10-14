"""Text to 16-bit mono PCM at 8000 or 16000 Hz. Polly neural for English and Hindi."""
import asyncio

from . import aws
from .hedge import hedged

HEDGE_S = 1.2  # Polly answers in 0.2 s; a request still open after this is stuck on a dead connection

POLLY = {"en": ("Kajal", "en-IN"), "hi": ("Kajal", "hi-IN")}


async def synthesize(text: str, lang: str, rate: int) -> bytes:
    return await hedged(lambda: _synthesize(text, lang, rate), HEDGE_S, "polly")


async def _synthesize(text: str, lang: str, rate: int) -> bytes:
    voice, code = POLLY[lang]

    def call() -> bytes:
        r = aws.client("polly").synthesize_speech(
            Text=text, VoiceId=voice, Engine="neural", OutputFormat="pcm",
            SampleRate=str(rate), LanguageCode=code)
        return r["AudioStream"].read()

    return await asyncio.to_thread(call)

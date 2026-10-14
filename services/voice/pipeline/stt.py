"""Amazon Transcribe streaming (en-IN, hi-IN). Audio in via a queue, results out via a callback."""
import asyncio
import logging
import time
from typing import Awaitable, Callable

from amazon_transcribe.auth import StaticCredentialResolver
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler

from . import aws, config

log = logging.getLogger("sahay.stt")
CODES = {"en": "en-IN", "hi": "hi-IN"}


class TranscribeStt:
    def __init__(self, lang: str, sample_rate: int):
        self.code, self.rate = CODES[lang], sample_rate

    async def run(self, audio_q: "asyncio.Queue[bytes | None]", on_result: Callable[[str, bool], Awaitable[None]]) -> None:
        c = aws.session().get_credentials().get_frozen_credentials()
        client = TranscribeStreamingClient(
            region=config.REGION,
            credential_resolver=StaticCredentialResolver(c.access_key, c.secret_key, c.token),
        )
        t0 = time.perf_counter()
        stream = await client.start_stream_transcription(
            language_code=self.code, media_sample_rate_hz=self.rate, media_encoding="pcm")
        log.info("transcribe stream open after %.1f s", time.perf_counter() - t0)

        async def send() -> None:
            n = 0
            while (chunk := await audio_q.get()) is not None:
                await stream.input_stream.send_audio_event(audio_chunk=chunk)
                n += 1
                if n % 50 == 0:
                    log.info("stt sent %d chunks, queue %d", n, audio_q.qsize())
            await stream.input_stream.end_stream()

        class Handler(TranscriptResultStreamHandler):
            async def handle_transcript_event(self, event):
                for r in event.transcript.results:
                    if r.alternatives and r.alternatives[0].transcript:
                        await on_result(r.alternatives[0].transcript, not r.is_partial)

        await asyncio.gather(send(), Handler(stream.output_stream).handle_events())

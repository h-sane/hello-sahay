"""One call: PCM16 in, PCM16 out, plus events. Transport-agnostic: the browser page and the phone bridge both feed it.

Half duplex on purpose: while we are speaking, mic audio is replaced by silence so the call never hears itself.
# ponytail: no barge-in; add it by cutting playback when the caller's level rises mid-reply.
"""
import asyncio
import json
import logging
import re
import time
from datetime import datetime, timezone
from typing import Awaitable, Callable

import httpx

from . import config, prompts
from .gate import check
from .grounding import ungrounded
from .llm import run_agent
from .stt import TranscribeStt
from .tools import Tools
from .tts import synthesize

log = logging.getLogger("sahay.call")
END_SILENCE_S = 1.4  # quiet time after the last transcript result before an utterance counts as finished
TAIL_S = 0.4  # keep muting the mic this long after our audio ends
_SENTENCE = re.compile(r"(?<=[.!?।])\s+")


class CallSession:
    def __init__(self, lang: str, send_audio: Callable[[bytes], Awaitable[None]],
                 send_event: Callable[[dict], Awaitable[None]], in_rate: int = 16000, out_rate: int = 16000,
                 *, stt=None, agent=run_agent, tts=synthesize, http: httpx.AsyncClient | None = None):
        self.lang, self.in_rate, self.out_rate = lang, in_rate, out_rate
        self._send_audio, self._send_event = send_audio, send_event
        self._stt = stt or TranscribeStt(lang, in_rate)
        self._agent, self._tts = agent, tts
        self._http = http or httpx.AsyncClient(base_url=config.API_BASE_URL, timeout=10)
        self.state: dict = {}
        self.transcript: list[dict] = []
        self.latencies: list[dict] = []
        self._messages: list = []
        self._tools = Tools(self._http, lang, self.state)
        self._system = prompts.SYSTEM.format(language=prompts.LANG_NAME[lang], greeting=prompts.GREETING[lang])
        self._audio_q: asyncio.Queue = asyncio.Queue()
        self._pending: list[str] = []
        self._last_result = 0.0
        self._speak_until = 0.0
        self._started = datetime.now(timezone.utc)
        self._done = asyncio.Event()
        self._tasks: list[asyncio.Task] = []
        self._closed = False

    # --- transport side ---------------------------------------------------
    def feed_audio(self, pcm: bytes) -> None:
        self._audio_q.put_nowait(bytes(len(pcm)) if self._speaking() else pcm)

    async def run(self) -> None:
        self._tasks = [asyncio.create_task(self._stt_task()), asyncio.create_task(self._turn_loop())]
        await self._say(prompts.GREETING[self.lang])
        await self._done.wait()
        await self.close()

    async def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        self._done.set()
        self._audio_q.put_nowait(None)
        for t in self._tasks:
            t.cancel()
        try:
            await self._http.post("/calls", json=self._call_log())
        except Exception:
            log.exception("could not save the call log")
        await self._http.aclose()

    # --- internals ----------------------------------------------------------
    def _speaking(self) -> bool:
        return time.monotonic() < self._speak_until + TAIL_S

    async def _stt_task(self) -> None:
        try:
            await self._stt.run(self._audio_q, self._on_result)
        except asyncio.CancelledError:
            raise
        except Exception:
            log.exception("speech-to-text failed")
            await self._finish()

    async def _on_result(self, text: str, final: bool) -> None:
        self._last_result = time.monotonic()
        if final:
            self._pending.append(text)
        await self._send_event({"type": "heard", "text": text, "final": final})

    async def _turn_loop(self) -> None:
        while not self._done.is_set():
            await asyncio.sleep(0.1)
            if self._pending and not self._speaking() and time.monotonic() - self._last_result >= END_SILENCE_S:
                text, self._pending = " ".join(self._pending), []
                try:
                    await self._turn(text)
                except Exception:
                    log.exception("turn failed")
                    await self._say(prompts.GREETING_FALLBACK[self.lang])

    async def _turn(self, text: str) -> None:
        t0 = time.perf_counter()
        await self._record("user", text)
        gate = check(text, self.lang)
        lat = {"gate": gate.flag}
        if gate.flag == "emergency":
            self.state.update(emergency=True, handoff=True)
            await self._say(gate.reply, lat, t0)
            await self._finish()
            return
        note = ""
        if gate.flag == "symptom":
            await self._say(gate.reply, lat, t0)
            note = ("\n[System note: the caller asked a symptom question and was already given the fixed safe reply. "
                    "Give no medical information; continue with the booking steps.]")
        self._messages.append({"role": "user", "content": [{"text": text + note}]})
        t1 = time.perf_counter()
        reply = await self._grounded_reply()
        lat["llm_ms"] = round((time.perf_counter() - t1) * 1000)
        if self.state.get("emergency"):
            self.state["handoff"] = True
            await self._say(reply, lat, t0)
            await self._finish()
            return
        await self._say(reply, lat, t0)

    async def _grounded_reply(self) -> str:
        """Ask the model; a reply that states anything no tool returned gets one correction, then a fixed fallback."""
        reply = await self._agent(self._system, self._messages, self._tools)
        if not reply.strip():  # the model sometimes answers with only a tool call or a thinking block
            reply = prompts.GREETING_FALLBACK[self.lang]
        for attempt in range(2):
            known = self._tools.facts + [t["text"] for t in self.transcript if t["role"] == "user"]
            bad = ungrounded(reply, known)
            if not bad:
                return reply
            log.warning("blocked an ungrounded reply %s: %s", bad, reply)
            if attempt == 1:
                break
            self._messages.append({"role": "user", "content": [{"text": (
                f"[System note: your last reply stated details no tool returned ({', '.join(bad)}). Do not say them. "
                "Use only tool results; call find_facilities if you need hospital information, "
                "or ask the caller for what is missing.]")}]})
            reply = await self._agent(self._system, self._messages, self._tools)
        self.state.update(handoff=True, handoff_reason="an unverified answer was blocked")
        return prompts.UNVERIFIED[self.lang]

    async def _say(self, text: str, lat: dict | None = None, t0: float | None = None) -> None:
        await self._record("assistant", text)
        first = True
        for sentence in filter(None, _SENTENCE.split(text)):
            audio = await self._tts(sentence, self.lang, self.out_rate)
            if first and lat is not None and t0 is not None and "first_audio_ms" not in lat:
                lat["first_audio_ms"] = round((time.perf_counter() - t0) * 1000)
            first = False
            self._speak_until = max(self._speak_until, time.monotonic()) + len(audio) / (2 * self.out_rate)
            await self._send_audio(audio)
        if lat is not None and "first_audio_ms" in lat:
            self.latencies.append(lat)
            log.info("turn latency %s", json.dumps(lat))
            await self._send_event({"type": "latency", **lat})

    async def _record(self, role: str, text: str) -> None:
        self.transcript.append({"role": role, "text": text, "at": datetime.now(timezone.utc).isoformat()})
        await self._send_event({"type": "transcript", "role": role, "text": text})

    async def _finish(self) -> None:
        await asyncio.sleep(max(0.0, self._speak_until - time.monotonic()))  # let the last audio play out
        await self._send_event({"type": "ended"})
        self._done.set()

    def _call_log(self) -> dict:
        s = self.state
        outcome = ("emergency" if s.get("emergency") else "booked" if s.get("appointment_id")
                   else "handed_off" if s.get("handoff") else "info_given" if s.get("facility_id") else None)
        summary = "; ".join(f"{k}: {s[k]}" for k in ("name", "village", "reason", "department", "handoff_reason")
                            if s.get(k))
        return {"language": self.lang, "transcript": self.transcript, "summary": summary or None,
                "outcome": outcome, "emergency": bool(s.get("emergency")), "handoff": bool(s.get("handoff")),
                "started_at": self._started.isoformat(),
                "duration_s": round((datetime.now(timezone.utc) - self._started).total_seconds()),
                "patient_phone": s.get("phone"), "facility_id": s.get("facility_id")}

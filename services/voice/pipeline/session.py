"""One call: PCM16 in, PCM16 out, plus events. Transport-agnostic: the browser page and the phone bridge both feed it.

Half duplex on purpose: while we are speaking, mic audio is replaced by silence so the call never hears itself.
# ponytail: no barge-in; add it by cutting playback when the caller's level rises mid-reply.
"""
import array
import asyncio
import audioop
import difflib
import json
import logging
import math
import re
import time
import unicodedata
import uuid
from datetime import datetime, timezone
from typing import Awaitable, Callable

import httpx

from . import config, llm, prompts
from .digits import digits_from_words
from .gate import check
from .grounding import ungrounded
from .llm import run_agent
from .sarvam import SarvamStt, synthesize as synthesize_ta
from .stt import TranscribeStt
from .tools import Tools, nearest_place
from .trace import Trace
from .tts import synthesize

log = logging.getLogger("sahay.call")
END_SILENCE_S = 0.9  # quiet time after the last transcript result before an utterance counts as finished
TAIL_S = 0.4  # keep muting the mic this long after our audio ends
BEEP_HZ, BEEP_S = 880, 0.25  # played when we finish talking: the caller's cue to speak
_BEEPS: dict[int, bytes] = {}
_AUDIO_CACHE: dict[tuple[str, str, int], bytes] = {}
_SENTENCE = re.compile(r"(?<=[.!?।])\s+")
KEPT_SCRIPTS = ("LATIN", "DEVANAGARI", "TAMIL")  # the three languages the helpline speaks; the detector also emits Gurmukhi etc. for noise
MIN_WORDS_TO_SWITCH = 3  # a one or two word utterance is too short to trust its detected language
STRIKES_TO_HANG_UP = 3  # unclear sentences or repeated questions in a row before the call is handed to a person
NO_INPUT_S = 12.0  # silence after the beep before the caller is prompted again
FILLER_AFTER_S = 3.0  # a turn this slow gets a spoken "one moment" so the caller does not sit in silence
REPEAT_RATIO = 0.85
ECHO_RATIO = 0.7
_CLOSING = re.compile(r"thank|bye|that's all|that is all|nothing else|no thanks|நன்றி|போதும்|வேறு எதுவும் இல்லை|பை$|"
                      r"धन्यवाद|शुक्रिया|अलविदा|बाय|और कुछ नहीं|बस इतना", re.I)
CLOSING_MAX_WORDS = 6  # a longer sentence is a new request that merely contains a thanks


def _clean(text: str) -> str:
    """Drop letters of scripts we do not speak; detection on noise emits Gurmukhi or Gujarati fragments."""
    def keep(c: str) -> bool:
        name = unicodedata.name(c, "")
        if name.startswith(KEPT_SCRIPTS):
            return True
        return not c.isalpha() and not unicodedata.category(c).startswith("M")
    return " ".join("".join(c for c in text if keep(c)).split())


def _norm(text: str) -> str:
    return "".join(c for c in text.lower() if c.isalnum())


def _similar(a: str, b: str, ratio: float) -> bool:
    a, b = _norm(a), _norm(b)
    return bool(a) and bool(b) and (a == b or difflib.SequenceMatcher(None, a, b).ratio() >= ratio)


class CallSession:
    def __init__(self, lang: str, send_audio: Callable[[bytes], Awaitable[None]],
                 send_event: Callable[[dict], Awaitable[None]], in_rate: int = 16000, out_rate: int = 16000,
                 *, stt=None, agent=run_agent, tts=synthesize, http: httpx.AsyncClient | None = None):
        self.auto = lang == "auto"  # language is detected per utterance and may change mid-call
        lang = "en" if self.auto else lang
        self.lang, self.in_rate, self.out_rate = lang, in_rate, out_rate
        self._send_audio, self._send_event = send_audio, send_event
        self._stt = stt or (SarvamStt if lang == "ta" or self.auto else TranscribeStt)("auto" if self.auto else lang, in_rate)
        self._agent = agent
        self._tts_override = tts if tts is not synthesize else None
        self._end_silence = getattr(self._stt, "end_silence", END_SILENCE_S)
        self._http = http or httpx.AsyncClient(base_url=config.API_BASE_URL, timeout=10)
        self.state: dict = {}
        self.trace = Trace(uuid.uuid4().hex[:8])
        self.transcript: list[dict] = []
        self.latencies: list[dict] = []
        self._messages: list = []
        self._tools = Tools(self._http, lang, self.state, self._switch_language if self.auto else None)
        self._tools.trace = self.trace.add  # llm.run_agent reports every model round and tool call through this
        self._profile_task: asyncio.Task | None = None
        self._audio_q: asyncio.Queue = asyncio.Queue()
        self._window = {"bytes": 0, "rms": 0, "muted_bytes": 0, "muted_rms": 0}
        self._pending: list[str] = []  # finished utterances; "" stands for one that was only noise
        self._strikes = 0  # consecutive turns that made no progress
        self._last_reply = ""
        self._filling = False
        self._listening_since = 0.0
        self._last_result = 0.0
        self._speak_until = 0.0
        self._started = datetime.now(timezone.utc)
        self._done = asyncio.Event()
        self._tasks: list[asyncio.Task] = []
        self._closed = False

    # --- transport side ---------------------------------------------------
    def feed_audio(self, pcm: bytes) -> None:
        muted = self._speaking()
        self._level(pcm, muted)
        self._audio_q.put_nowait(bytes(len(pcm)) if muted else pcm)

    def _level(self, pcm: bytes, muted: bool) -> None:
        """Every two seconds of caller audio: the loudest frame and how much of it arrived while we were speaking.
        Loud audio while muted is the caller's line echoing our own voice back."""
        w = self._window
        w["bytes"] += len(pcm)
        level = audioop.rms(pcm, 2) if len(pcm) > 1 else 0
        w["rms"] = max(w["rms"], level)
        if muted:
            w["muted_bytes"] += len(pcm)
            w["muted_rms"] = max(w["muted_rms"], level)
        if w["bytes"] >= 4 * self.in_rate:
            self.trace.add("audio_in", rms_max=w["rms"], muted_s=round(w["muted_bytes"] / (2 * self.in_rate), 1),
                           muted_rms_max=w["muted_rms"])
            w.update(bytes=0, rms=0, muted_bytes=0, muted_rms=0)

    async def run(self) -> None:
        self.trace.add("call_start", lang=self.lang, auto=self.auto, phone=self.state.get("phone"),
                       in_rate=self.in_rate, out_rate=self.out_rate, stt=type(self._stt).__name__)
        self._tasks = [asyncio.create_task(self._stt_task()), asyncio.create_task(self._turn_loop())]
        self._profile_task = asyncio.create_task(self._load_profile())
        if self.auto:
            for code, line in prompts.AUTO_GREETING:
                await self._say(line, lang=code)
        else:
            await self._say(prompts.GREETING[self.lang])
        await self._beep()
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
        self.trace.add("call_end", turns=len(self.latencies), outcome=self._call_log()["outcome"])
        await self._save()
        await self._http.aclose()

    async def _save(self) -> None:
        """Store the call. A rejected record is retried without the optional links, so the trace is never lost."""
        body = self._call_log()
        for attempt in range(2):
            try:
                r = await self._http.post("/calls", json=body)
                r.raise_for_status()
                log.info("call %s saved as call id %s", self.trace.call_id, r.json().get("id"))
                return
            except Exception as e:
                detail = getattr(getattr(e, "response", None), "text", "")[:300]
                log.exception("call %s could not be saved (attempt %d) %s", self.trace.call_id, attempt + 1, detail)
                self.trace.add("save_failed", attempt=attempt + 1, error=repr(e), detail=detail)
                body = {**self._call_log(), "patient_phone": None, "facility_id": None}
        log.error("call %s lost: %s", self.trace.call_id, json.dumps(body, ensure_ascii=False, default=str))

    # --- internals ----------------------------------------------------------
    def _speaking(self) -> bool:
        return time.monotonic() < self._speak_until + TAIL_S

    async def _stt_task(self) -> None:
        try:
            await self._stt.run(self._audio_q, self._on_result)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            log.exception("speech-to-text failed")
            self.trace.add("error", where="stt", error=repr(e))
            await self._finish()

    async def _tts(self, sentence: str, lang: str, rate: int) -> bytes:
        if self._tts_override:
            return await self._tts_override(sentence, lang, rate)
        key = (sentence, lang, rate)
        cached = key in _AUDIO_CACHE
        t0 = time.perf_counter()
        if not cached:  # greetings repeat on every call; synthesising them costs seconds of silence
            try:
                _AUDIO_CACHE[key] = await (synthesize_ta if lang == "ta" else synthesize)(sentence, lang, rate)
            except Exception as e:
                self.trace.add("error", where="tts", lang=lang, chars=len(sentence), error=repr(e))
                raise
        self.trace.add("tts", lang=lang, chars=len(sentence), cached=cached, ms=round((time.perf_counter() - t0) * 1000))
        return _AUDIO_CACHE[key]

    @staticmethod
    async def prewarm(rate: int) -> None:
        sentences = [(s, lang) for lang, g in prompts.GREETING.items() for s in _SENTENCE.split(g)]
        sentences += [(s, lang) for lang, line in prompts.AUTO_GREETING for s in _SENTENCE.split(line)]
        sentences += [(s, lang) for table in (prompts.FILLER, prompts.GIVE_UP) for lang, g in table.items()
                      for s in _SENTENCE.split(g)]
        sentences += [(s, lang) for lang, lines in prompts.UNCLEAR.items() for g in lines for s in _SENTENCE.split(g)]
        for s, lang in sentences:
            if s.strip() and (s, lang, rate) not in _AUDIO_CACHE:
                try:
                    _AUDIO_CACHE[(s, lang, rate)] = await (synthesize_ta if lang == "ta" else synthesize)(s, lang, rate)
                except Exception:
                    log.exception("could not prewarm %s greeting", lang)
        try:  # the first model call of a process pays for connection set-up; make that happen before a caller waits
            await asyncio.to_thread(llm._converse, "Reply with OK.", [{"role": "user", "content": [{"text": "hi"}]}])
        except Exception:
            log.exception("could not prewarm the model")

    def _system_prompt(self) -> str:
        greeting = " ".join(t for _, t in prompts.AUTO_GREETING) if self.auto else prompts.GREETING[self.lang]
        return prompts.SYSTEM.format(language=prompts.LANG_NAME[self.lang], greeting=greeting,
                                     caller=prompts.caller_block(self.state))

    def _switch_language(self, lang: str) -> None:
        if lang != self.lang:
            log.info("language switched %s -> %s", self.lang, lang)
        self.lang, self._tools.lang = lang, lang

    async def _load_profile(self) -> None:
        """Is this number registered in the Sahay app, and where is the patient right now?"""
        phone = self.state.get("phone")
        if not phone:
            return
        try:
            r = await self._http.get(f"/patients/{phone}")
            r.raise_for_status()
            p = r.json()
        except Exception:
            log.exception("could not look up the caller")
            return
        if not p.get("registered"):
            return
        live = bool(p.get("location_live") and p.get("lat") is not None)
        self.state["profile"] = {"name": p.get("name"), "village": p.get("village"), "live": live,
                                 "lat": p.get("lat"), "lng": p.get("lng"),
                                 "place": nearest_place(p["lat"], p["lng"]) if live else None}
        if self.state["profile"]["name"]:
            self.state.setdefault("name", self.state["profile"]["name"])
        log.info("caller is registered; live location %s", live)

    async def _beep(self) -> None:
        if self.out_rate not in _BEEPS:
            n = int(self.out_rate * BEEP_S)
            fade = int(self.out_rate * 0.02)
            samples = [int(9000 * math.sin(2 * math.pi * BEEP_HZ * i / self.out_rate)
                           * min(1.0, i / fade, (n - i) / fade)) for i in range(n)]
            _BEEPS[self.out_rate] = array.array("h", samples).tobytes()
        audio = _BEEPS[self.out_rate]
        self._speak_until = max(self._speak_until, time.monotonic()) + len(audio) / (2 * self.out_rate)
        await self._send_audio(audio)
        await asyncio.sleep(max(0.0, self._speak_until + TAIL_S - time.monotonic()))  # audio is queued ahead of real time
        self.trace.add("listening")
        self._listening_since = time.monotonic()
        await self._send_event({"type": "listening"})

    async def _on_result(self, text: str, final: bool) -> None:
        self._last_result = time.monotonic()
        detected = getattr(self._stt, "detected", None)
        self.trace.add("stt_result", text=text, final=final, detected=detected,
                       speaking=self._speaking(), pending=len(self._pending))
        if final:
            kept = _clean(text)
            own_voice = kept
            kept = self._without_echo(kept)  # our own voice coming back on the line, possibly glued to the caller's words
            if kept != own_voice:
                self.trace.add("echo_stripped", heard=own_voice, kept=kept)
            if own_voice and not kept:
                pass  # only our own words came back
            elif not any(c.isalnum() for c in kept):
                self.trace.add("noise", raw=text)
                self._pending.append("")
            else:
                if self.auto and detected in prompts.LANG_NAME and detected != self.lang:
                    if len(kept.split()) >= MIN_WORDS_TO_SWITCH:
                        self._switch_language(detected)
                    else:
                        self.trace.add("language_kept", detected=detected, words=len(kept.split()))
                self._pending.append(kept)
        await self._send_event({"type": "heard", "text": text, "final": final})

    async def _turn_loop(self) -> None:
        while not self._done.is_set():
            await asyncio.sleep(0.1)
            if (not self._pending and self._listening_since and not self._speaking()
                    and time.monotonic() - max(self._listening_since, self._last_result) > NO_INPUT_S):
                self._listening_since = 0.0
                self.trace.add("no_input")
                await self._unclear()  # nothing heard for a while: ask again, hang up on the third silence
                if not self._done.is_set():
                    await self._beep()
                continue
            if self._pending and not self._speaking() and time.monotonic() - self._last_result >= self._end_silence:
                text, self._pending = " ".join(p for p in self._pending if p), []
                try:
                    await (self._turn(text) if text else self._unclear())
                except Exception as e:
                    log.exception("turn failed")
                    self.trace.add("error", where="turn", error=repr(e))
                    await self._say(prompts.GREETING_FALLBACK[self.lang])
                if not self._done.is_set():
                    await self._beep()

    def _without_echo(self, text: str) -> str:
        said = [s for t in self.transcript if t["role"] == "assistant" for s in _SENTENCE.split(t["text"])][-8:]
        keep = []
        for part in filter(None, _SENTENCE.split(text)):
            n = _norm(part)
            if len(n) >= 8 and any(n in _norm(s) or _similar(part, s, ECHO_RATIO) for s in said):
                continue
            keep.append(part)
        return " ".join(keep)

    async def _unclear(self) -> None:
        self._strikes += 1
        self.trace.add("unclear", strikes=self._strikes)
        if self._strikes >= STRIKES_TO_HANG_UP:
            await self._give_up("the caller could not be understood")
        else:
            await self._say(prompts.UNCLEAR[self.lang][min(self._strikes - 1, 1)])

    async def _give_up(self, reason: str) -> None:
        self.trace.add("give_up", reason=reason)
        self.state.update(handoff=True, handoff_reason=reason)
        await self._say(prompts.GIVE_UP[self.lang])
        await self._finish()

    async def _think(self) -> str:
        """The model's reply, with a spoken "one moment" if it takes too long."""
        filler = asyncio.create_task(self._filler())
        try:
            return await self._grounded_reply()
        finally:
            if self._filling:
                await filler  # let the sentence finish; the reply is queued behind it
            else:
                filler.cancel()

    async def _filler(self) -> None:
        await asyncio.sleep(FILLER_AFTER_S)
        self._filling = True
        self.trace.add("filler")
        try:
            await self._say(prompts.FILLER[self.lang])
        finally:
            self._filling = False

    async def _turn(self, text: str) -> None:
        t0 = time.perf_counter()
        self.trace.add("turn_start", text=text, lang=self.lang, messages=len(self._messages))
        await self._record("user", text)
        self.state["last_text"] = text
        gate, gate_lang = check(text, self.lang), self.lang
        if self.auto and gate.flag != "emergency":
            for other in prompts.LANG_NAME:  # a code-switched sentence can hide the emergency words from the detected language
                alt = check(text, other)
                if alt.flag == "emergency":
                    gate, gate_lang = alt, other
                    break
        lat = {"gate": gate.flag}
        self.trace.add("gate", flag=gate.flag, lang=gate_lang)
        if gate.flag == "emergency":
            self.state.update(emergency=True, handoff=True)
            await self._say(gate.reply, lat, t0, lang=gate_lang)
            await self._finish()
            return
        if self.state.get("appointment_id") and len(text.split()) <= CLOSING_MAX_WORDS and _CLOSING.search(text):
            await self._say(prompts.GOODBYE[self.lang], lat, t0)  # booked and thanked: greet back and hang up
            await self._finish()
            return
        note = ""
        if gate.flag == "symptom":
            await self._say(gate.reply, lat, t0, lang=gate_lang)
            note = ("\n[System note: the caller asked a symptom question and was already given the fixed safe reply. "
                    "Give no medical information; continue with the booking steps.]")
        heard = digits_from_words(text) + note
        if self._messages and self._messages[-1]["role"] == "user":  # a failed turn left its question unanswered
            self._messages[-1]["content"].append({"text": heard})
        else:
            self._messages.append({"role": "user", "content": [{"text": heard}]})
        t1 = time.perf_counter()
        if self._profile_task:
            await self._profile_task
        reply = await self._think()
        lat["llm_ms"] = round((time.perf_counter() - t1) * 1000)
        if self.state.get("emergency"):
            self.state["handoff"] = True
            await self._say(reply, lat, t0)
            await self._finish()
            return
        for _ in range(2):  # the same question again means the caller is not answering it
            if not _similar(reply, self._last_reply, REPEAT_RATIO):
                break
            self._strikes += 1
            self.trace.add("repeat_reply", strikes=self._strikes, reply=reply)
            if self._strikes >= STRIKES_TO_HANG_UP:
                await self._give_up("the caller did not answer the same question three times")
                return
            self._messages.append({"role": "user", "content": [{"text": (
                "[System note: you just asked the caller this same thing again and they did not answer it. "
                "Do not repeat it. Say briefly that you did not catch it, and ask for just the one missing detail "
                "in different, simpler words.]")}]})
            reply = await self._think()
        if not _similar(reply, self._last_reply, REPEAT_RATIO):
            self._strikes = 0
        self._last_reply = reply
        await self._say(reply, lat, t0)

    async def _grounded_reply(self) -> str:
        """Ask the model; a reply that states anything no tool returned gets one correction, then a fixed fallback."""
        reply = await self._agent(self._system_prompt(), self._messages, self._tools)
        if not reply.strip():  # the model sometimes answers with only a tool call or a thinking block
            reply = prompts.GREETING_FALLBACK[self.lang]
        for attempt in range(2):
            known = self._tools.facts + [digits_from_words(t["text"]) for t in self.transcript if t["role"] == "user"]
            bad = ungrounded(reply, known)
            if not bad:
                return reply
            log.warning("blocked an ungrounded reply %s: %s", bad, reply)
            self.trace.add("blocked_reply", details=bad, reply=reply, attempt=attempt)
            if attempt == 1:
                break
            self._messages.append({"role": "user", "content": [{"text": (
                f"[System note: your last reply stated details no tool returned ({', '.join(bad)}). Do not say them. "
                "Use only tool results; call find_facilities if you need hospital information, "
                "or ask the caller for what is missing.]")}]})
            reply = await self._agent(self._system_prompt(), self._messages, self._tools)
        self.state.update(handoff=True, handoff_reason="an unverified answer was blocked")
        return prompts.UNVERIFIED[self.lang]

    async def _say(self, text: str, lat: dict | None = None, t0: float | None = None, lang: str | None = None) -> None:
        await self._record("assistant", text)
        first = True
        sentences = list(filter(None, _SENTENCE.split(text)))
        # Synthesise every sentence at once so the next one is ready when the previous finishes playing.
        jobs = [asyncio.create_task(self._tts(sentence, lang or self.lang, self.out_rate)) for sentence in sentences]
        for job in jobs:
            audio = await job
            if first and lat is not None and t0 is not None and "first_audio_ms" not in lat:
                lat["first_audio_ms"] = round((time.perf_counter() - t0) * 1000)
            first = False
            self._speak_until = max(self._speak_until, time.monotonic()) + len(audio) / (2 * self.out_rate)
            await self._send_audio(audio)
        self.trace.add("said", text=text, lang=lang or self.lang, sentences=len(sentences),
                       audio_s=round(self._speak_until - time.monotonic(), 2))
        if lat is not None and "first_audio_ms" in lat:
            self.latencies.append(lat)
            self.trace.add("latency", **lat)
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
        summary = "; ".join(f"{k}: {s[k]}" for k in ("name", "village", "reason", "department", "hospital", "handoff_reason")
                            if s.get(k))
        return {"language": self.lang, "transcript": self.transcript, "summary": summary or None,
                "outcome": outcome, "emergency": bool(s.get("emergency")), "handoff": bool(s.get("handoff")),
                "started_at": self._started.isoformat(),
                "duration_s": round((datetime.now(timezone.utc) - self._started).total_seconds()),
                "patient_phone": s.get("phone"), "facility_id": s.get("facility_id"), "trace": self.trace.events}

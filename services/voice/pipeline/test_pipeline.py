"""Offline tests: the model, speech and the API are faked, so these cost nothing and need no network."""
import asyncio
import json

import httpx

from pipeline.gate import REPLIES
from pipeline.session import CallSession
from pipeline.tools import Tools, department_for, place_for


class FakeStt:
    async def run(self, q, on_result):
        while await q.get() is not None:
            pass


def make_session(agent, posted, lang="en"):
    audio, events = [], []

    async def send_audio(b):
        audio.append(b)

    async def send_event(e):
        events.append(e)

    async def tts(text, lang, rate):
        return b"\x00\x00" * 160  # 10 ms

    def api(req):
        posted.append(json.loads(req.content))
        return httpx.Response(201, json={})

    http = httpx.AsyncClient(base_url="http://api", transport=httpx.MockTransport(api))
    return CallSession(lang, send_audio, send_event, stt=FakeStt(), agent=agent, tts=tts, http=http), audio, events


def spoken(session):
    return [t["text"] for t in session.transcript if t["role"] == "assistant"]


def test_emergency_skips_the_model_says_108_and_queues_a_handoff():
    posted = []

    async def agent(*_):
        raise AssertionError("the model must not run on an emergency")

    async def go():
        s, audio, _ = make_session(agent, posted)
        await s._turn("I have chest pain and I cannot breathe")
        await s.close()
        return s

    s = asyncio.run(go())
    assert spoken(s) == [REPLIES["emergency"]["en"]]
    assert posted[0]["emergency"] is True and posted[0]["handoff"] is True and posted[0]["outcome"] == "emergency"


def test_symptom_question_gets_the_fixed_reply_then_the_model_continues_the_booking():
    posted, seen = [], []

    async def agent(system, messages, tools):
        seen.append(messages[-1]["content"][0]["text"])
        return "May I have your name?"

    async def go():
        s, _, _ = make_session(agent, posted)
        await s._turn("what is this pain in my stomach")
        await s.close()
        return s

    s = asyncio.run(go())
    assert spoken(s) == [REPLIES["symptom"]["en"], "May I have your name?"]
    assert "System note" in seen[0]


def test_normal_turn_speaks_only_the_model_reply_and_logs_latency():
    posted = []

    async def agent(system, messages, tools):
        return "Which village are you in?"

    async def go():
        s, audio, events = make_session(agent, posted)
        await s._turn("my name is Ravi")
        await s.close()
        return s, audio, events

    s, audio, events = asyncio.run(go())
    assert spoken(s) == ["Which village are you in?"] and len(audio) == 1
    assert {"first_audio_ms", "llm_ms"} <= set(s.latencies[0])
    assert any(e["type"] == "latency" for e in events)


def test_mic_audio_is_muted_while_the_bot_speaks():
    async def go():
        s, _, _ = make_session(None, [])
        s.feed_audio(b"\x01\x01")
        await s._say("Hello there.")
        s.feed_audio(b"\x01\x01")
        return [s._audio_q.get_nowait() for _ in range(2)]

    assert asyncio.run(go()) == [b"\x01\x01", b"\x00\x00"]


def test_department_comes_from_the_keyword_table_not_the_model():
    assert department_for("my child has a cold") == "Paediatrics"
    assert department_for("pregnancy checkup") == "Obstetrics"
    assert department_for("knee hurts") == "General Medicine"
    assert place_for("Paranur") == (12.728, 79.968)
    assert place_for("somewhere unknown") == (12.683, 79.977)


def test_grounding_flags_numbers_and_hospital_names_no_tool_returned():
    from pipeline.grounding import ungrounded

    assert ungrounded("Their phone is 9876543210.", []) == ["9876543210"]
    assert ungrounded("Government Primary Health Center is near.", []) == ["Government Primary Health Center"]
    assert ungrounded("Call 108 now.", []) == []
    facts = ['{"name": "Lotus Family Hospital", "phone": "044-0000-0204"}', "my number is nine eight seven six five"]
    assert ungrounded("Lotus Family Hospital, phone 044 0000 0204.", facts) == []
    assert ungrounded("Your number is 98765.", facts) == []


def test_a_hallucinated_reply_gets_one_correction_then_a_fixed_fallback_and_a_handoff():
    from pipeline.prompts import UNVERIFIED

    calls = []

    async def agent(system, messages, tools):
        calls.append(len(messages))
        messages.append({"role": "assistant", "content": [{"text": "x"}]})
        return "Lotus Family Hospital is at 123 Health Street, phone 9876543210."

    async def go():
        s, _, _ = make_session(agent, [])
        await s._turn("I want to book")
        return s

    s = asyncio.run(go())
    assert len(calls) == 2 and spoken(s) == [UNVERIFIED["en"]] and s.state["handoff"] is True


def test_a_corrected_reply_is_spoken():
    replies = iter(["Phone 9876543210.", "Which village are you in?"])

    async def agent(system, messages, tools):
        return next(replies)

    async def go():
        s, _, _ = make_session(agent, [])
        await s._turn("hello")
        return s

    assert spoken(asyncio.run(go())) == ["Which village are you in?"]


def test_booking_a_taken_slot_tells_the_model_to_offer_another():
    def api(req):
        return httpx.Response(409, json={"detail": "slot is taken"})

    async def go():
        http = httpx.AsyncClient(base_url="http://api", transport=httpx.MockTransport(api))
        return await Tools(http, "en", {}).call(
            "book_appointment", {"slot_id": 1, "name": "Ravi", "phone": "9876543210", "village": "Paranur", "reason_text": "fever"})

    assert asyncio.run(go())["error"] == "slot_taken"

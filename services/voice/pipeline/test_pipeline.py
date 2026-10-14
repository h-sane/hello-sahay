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


def _slots_api(slots, facilities=()):
    def api(req):
        if req.url.path.endswith("/slots"):
            day = req.url.params["date"]
            return httpx.Response(200, json=[s for s in slots if s["start"].startswith(day)])
        if req.url.path.endswith("/facilities"):
            return httpx.Response(200, json=list(facilities))
        if req.method == "POST":
            body = json.loads(req.content)
            return httpx.Response(201, json={"id": 9, "patient": {"phone": body["patient"]["phone"]},
                                             "facility": {"id": 7, "name": "H", "address": "A"},
                                             "doctor": {"name": "Dr A"}, "slot": {"start": slots[0]["start"]}})
        return httpx.Response(404)
    return httpx.AsyncClient(base_url="http://api", transport=httpx.MockTransport(api))


def _slot(i, doctor, hour, day_offset=1):
    from datetime import datetime, timedelta
    from pipeline.tools import IST
    t = (datetime.now(IST) + timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
    return {"slot_id": i, "start": t.isoformat(), "doctor_name": doctor}


def _get_slots(slots, **args):
    async def go():
        return await Tools(_slots_api(slots), "en", {}).call("get_slots", {"facility_id": 7, "department": "General Medicine", **args})
    return asyncio.run(go())


def test_preferred_doctor_and_time_free_is_an_exact_match():
    out = _get_slots([_slot(1, "Dr Meena", 10), _slot(2, "Dr Ravi", 10), _slot(3, "Dr Ravi", 15)],
                     doctor_name="Dr Ravi", preferred_time="15:00")
    assert out["result"] == "exact" and [s["slot_id"] for s in out["slots"]] == [3]


def test_busy_doctor_gets_their_next_slot_and_unknown_doctor_gets_others():
    slots = [_slot(1, "Dr Meena", 10), _slot(2, "Dr Ravi", 11), _slot(3, "Dr Ravi", 16)]
    nxt = _get_slots(slots, doctor_name="Ravi", preferred_time="14:00")
    assert nxt["result"] == "next_for_doctor" and nxt["slots"][0]["slot_id"] == 3
    other = _get_slots(slots, doctor_name="Dr Kumar")
    assert other["result"] == "other_doctor" and {s["doctor"] for s in other["slots"]} == {"Dr Meena", "Dr Ravi"}


def test_booking_uses_the_number_the_call_came_from():
    async def go():
        state = {"phone": "09876543210"}
        out = await Tools(_slots_api([_slot(1, "Dr A", 10)]), "en", state).call(
            "book_appointment", {"slot_id": 1, "name": "Ravi", "phone": "1111111111", "village": "P", "reason_text": "fever"})
        return out, state
    out, state = asyncio.run(go())
    assert out["appointment_id"] == 9 and state["phone"] == "09876543210"


def test_recommends_the_nearest_bookable_hospital_and_mentions_the_free_government_one():
    def fac(i, name, gov, partner, km):
        return {"id": i, "name": name, "type": "PHC" if gov else "private", "address": "", "phone": "", "hours": "",
                "departments": ["General Medicine"], "pmjay": False, "cmchis": False, "is_partner": partner,
                "is_government": gov, "distance_km": km}
    rows = [fac(1, "Paranur PHC", True, False, 2.0), fac(2, "Far Care Hospital", False, True, 9.0),
            fac(3, "Near Care Hospital", False, True, 4.0)]

    async def go():
        return await Tools(_slots_api([], rows), "en", {}).call("find_facilities", {"village": "Paranur", "reason": "fever"})
    out = asyncio.run(go())
    assert out["recommended"]["name"] == "Near Care Hospital" and out["recommended"]["can_book"]
    assert out["free_government_option"]["name"] == "Paranur PHC"


def test_dictated_digit_words_become_digits_but_ordinary_speech_is_left_alone():
    from pipeline.digits import digits_from_words as d
    assert d("मेरा नंबर नौ आठ सात छह पाँच चार तीन दो एक शून्य है") == "मेरा नंबर 9876543210 है"
    assert d("my number is nine eight seven six five four three two one zero") == "my number is 9876543210"
    assert d("one or two days") == "one or two days"

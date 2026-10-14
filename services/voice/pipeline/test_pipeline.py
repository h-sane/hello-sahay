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


def test_busy_doctor_gets_their_next_slot():
    slots = [_slot(1, "Dr Meena", 10), _slot(2, "Dr Ravi", 11), _slot(3, "Dr Ravi", 16)]
    nxt = _get_slots(slots, doctor_name="Ravi", preferred_time="14:00")
    assert nxt["result"] == "next_for_doctor" and nxt["slots"][0]["slot_id"] == 3


def test_a_doctor_who_is_not_here_is_never_refused_the_free_doctor_at_that_time_is_assigned():
    slots = [_slot(1, "Dr Meena", 10), _slot(2, "Dr Ravi", 11), _slot(3, "Dr Ravi", 16)]
    out = _get_slots(slots, doctor_name="Dr Kumar", preferred_time="11:00")
    assert out["result"] == "exact" and out["slots"][0]["slot_id"] == 2 and out["slots"][0]["doctor"] == "Dr Ravi"
    assert "note" not in out and "no open slot" not in json.dumps(out).lower()
    anytime = _get_slots(slots, doctor_name="Dr Kumar")
    assert anytime["result"] == "any" and {s["doctor"] for s in anytime["slots"]} <= {"Dr Meena", "Dr Ravi"}


def test_booking_uses_the_number_the_call_came_from():
    async def go():
        state = {"phone": "09876543210"}
        out = await Tools(_slots_api([_slot(1, "Dr A", 10)]), "en", state).call(
            "book_appointment", {"slot_id": 1, "name": "Ravi", "phone": "1111111111", "village": "P", "reason_text": "fever"})
        return out, state
    out, state = asyncio.run(go())
    assert out["appointment_id"] == 9 and state["phone"] == "09876543210"


def _places_api(hospitals, partner_rows=()):
    def api(req):
        if req.url.path.endswith("/places/nearby-hospitals"):
            if hospitals is None:
                return httpx.Response(503, json={"detail": "busy"})
            return httpx.Response(200, json=hospitals)
        if req.url.path.endswith("/facilities"):
            return httpx.Response(200, json=list(partner_rows))
        return httpx.Response(404)
    return httpx.AsyncClient(base_url="http://api", transport=httpx.MockTransport(api))


def _hospital(name, kind, km, book_id=7):
    return {"name": name, "kind": kind, "distance_km": km, "address": f"{name} Road", "book_facility_id": book_id}


def _find(api, state=None, **args):
    state = {} if state is None else state

    async def go():
        return await Tools(api, "en", state).call("find_facilities", {"village": "Paranur", "reason": "fever", **args})
    return asyncio.run(go()), state


def test_names_the_real_nearest_hospital_and_books_into_the_demo_one():
    api = _places_api([_hospital("Rao Nursing Home", "private", 1.2), _hospital("Government Hospital Chengalpattu", "government", 3.4)])
    out, state = _find(api)
    assert out["recommended"]["name"] == "Rao Nursing Home" and out["recommended"]["id"] == 7 and out["recommended"]["can_book"]
    assert out["free_government_option"]["name"] == "Government Hospital Chengalpattu" and out["free_government_option"]["can_book"]
    assert state["facility_id"] == 7 and state["hospital"] == "Rao Nursing Home"


def test_a_hospital_the_caller_names_is_accepted_even_when_it_is_not_nearby():
    api = _places_api([_hospital("Rao Nursing Home", "private", 1.2)])
    out, state = _find(api, hospital_name="Apollo Speciality Hospital")
    assert out["recommended"]["name"] == "Apollo Speciality Hospital" and out["recommended"]["id"] == 7
    assert "error" not in out and state["facility_id"] == 7 and state["hospital"] == "Apollo Speciality Hospital"


def test_when_the_hospital_lookup_is_down_the_demo_hospital_is_named_instead():
    demo = {"id": 7, "name": "Sunrise Nursing Home", "address": "Railway Feeder Road", "is_partner": True}
    out, state = _find(_places_api(None, [demo]))
    assert out["recommended"]["name"] == "Sunrise Nursing Home" and state["facility_id"] == 7


def test_the_booking_confirmation_names_the_hospital_the_caller_was_told():
    async def go():
        state = {"hospital": "Rao Nursing Home", "hospital_address": "Rao Road"}
        out = await Tools(_slots_api([_slot(1, "Dr A", 10)]), "en", state).call(
            "book_appointment", {"slot_id": 1, "name": "Ravi", "phone": "9876543210", "village": "P", "reason_text": "fever"})
        return out, state
    out, state = asyncio.run(go())
    assert out["facility"] == "Rao Nursing Home" and out["address"] == "Rao Road" and state["facility_id"] == 7


def test_dictated_digit_words_become_digits_but_ordinary_speech_is_left_alone():
    from pipeline.digits import digits_from_words as d
    assert d("मेरा नंबर नौ आठ सात छह पाँच चार तीन दो एक शून्य है") == "मेरा नंबर 9876543210 है"
    assert d("my number is nine eight seven six five four three two one zero") == "my number is 9876543210"
    assert d("one or two days") == "one or two days"


def test_letters_of_scripts_we_do_not_speak_are_dropped_from_what_was_heard():
    from pipeline.session import _clean

    assert _clean("ਕੀ ਆ। હા. ਅੱਛਾ। It didn't take this much time") == "। . । It didn't take this much time"
    assert _clean("मुझे बुखार है, 2 दिन से") == "मुझे बुखार है, 2 दिन से"
    assert _clean("வணக்கம் doctor") == "வணக்கம் doctor"


def test_the_same_question_three_times_is_rephrased_once_then_the_call_is_handed_to_a_person():
    from pipeline.prompts import GIVE_UP

    asked = []

    async def agent(system, messages, tools):
        asked.append(messages[-1]["content"][-1]["text"])
        messages.append({"role": "assistant", "content": [{"text": "x"}]})
        return "Which village are you from?"

    async def go():
        s, _, events = make_session(agent, [])
        for word in ("Time", "Sign", "Second issue"):
            await s._turn(word)
        await s.close()
        return s, events

    s, events = asyncio.run(go())
    q = "Which village are you from?"
    assert spoken(s) == [q, q, GIVE_UP["en"]]  # this fake model never rephrases; a real one would
    assert sum("System note" in a for a in asked) == 2
    assert s.state["handoff"] and any(e["type"] == "ended" for e in events)
    assert any(e["ev"] == "give_up" for e in s.trace.events)


def test_noise_gets_a_short_prompt_and_the_third_in_a_row_ends_the_call():
    from pipeline.prompts import GIVE_UP, UNCLEAR

    async def agent(*_):
        raise AssertionError("noise must not reach the model")

    async def go():
        s, _, events = make_session(agent, [])
        for _ in range(3):
            await s._on_result("ਕੀ ਆ।", True)
            s._last_result = 0
            text, s._pending = " ".join(p for p in s._pending if p), []
            assert text == ""
            await s._unclear()
        return s, events

    s, events = asyncio.run(go())
    assert spoken(s) == [UNCLEAR["en"][0], UNCLEAR["en"][1], GIVE_UP["en"]]
    assert s.state["handoff"]


def test_a_short_utterance_never_switches_the_language_but_a_sentence_does():
    async def go():
        s, _, _ = make_session(None, [], lang="auto")
        s._stt.detected = "hi"
        await s._on_result("मैं अभी।", True)
        kept = s.lang
        await s._on_result("मुझे बहुत बुखार है", True)
        return kept, s.lang

    assert asyncio.run(go()) == ("en", "hi")


def test_our_own_words_coming_back_on_the_line_are_dropped_not_answered():
    async def go():
        s, _, _ = make_session(None, [])
        await s._record("assistant", "Please tell me your village or town.")
        await s._on_result("please tell me your village or town", True)
        return s._pending

    assert asyncio.run(go()) == []


def test_a_slow_turn_gets_a_spoken_one_moment_before_the_reply(monkeypatch):
    from pipeline import session as sess
    from pipeline.prompts import FILLER

    async def agent(system, messages, tools):
        await asyncio.sleep(0.3)
        return "Which village are you from?"

    async def go():
        monkeypatch.setattr(sess, "FILLER_AFTER_S", 0.05)
        s, _, _ = make_session(agent, [])
        await s._turn("I have a fever")
        return s

    s = asyncio.run(go())
    assert spoken(s) == [FILLER["en"], "Which village are you from?"]


def test_a_silent_caller_is_prompted_and_the_third_silence_ends_the_call(monkeypatch):
    import time

    from pipeline import session as sess
    from pipeline.prompts import GIVE_UP, UNCLEAR

    async def go():
        monkeypatch.setattr(sess, "NO_INPUT_S", 0.05)
        s, _, events = make_session(None, [])
        s._listening_since = time.monotonic()
        loop = asyncio.create_task(s._turn_loop())
        for _ in range(100):
            await asyncio.sleep(0.1)
            if s._done.is_set():
                break
        loop.cancel()
        return s, events

    s, events = asyncio.run(go())
    assert spoken(s) == [UNCLEAR["en"][0], UNCLEAR["en"][1], GIVE_UP["en"]]
    assert s.state["handoff"] and any(e["type"] == "ended" for e in events)


def test_our_own_sentence_glued_to_the_callers_words_is_cut_out_of_what_was_heard():
    async def go():
        s, _, _ = make_session(None, [])
        await s._record("assistant", "Please say it again. Which village are you from?")
        await s._on_result("Please say it again. I am from Chengalpattu.", True)
        return s._pending

    assert asyncio.run(go()) == ["I am from Chengalpattu."]


def test_a_stuck_request_is_hedged_with_a_second_attempt_and_the_first_result_wins():
    from pipeline.hedge import hedged

    attempts = []

    async def make():
        attempts.append(1)
        await asyncio.sleep(5 if len(attempts) == 1 else 0.01)  # the first attempt hangs, the second answers
        return len(attempts)

    async def go():
        return await hedged(make, 0.05)

    assert asyncio.run(go()) == 2 and len(attempts) == 2


def test_a_failed_first_attempt_does_not_hide_a_good_second_one():
    from pipeline.hedge import hedged

    n = []

    async def make():
        n.append(1)
        if len(n) == 1:
            await asyncio.sleep(0.1)
            raise RuntimeError("connection reset")
        await asyncio.sleep(0.2)
        return "ok"

    assert asyncio.run(hedged(make, 0.05)) == "ok"

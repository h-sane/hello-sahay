"""Offline tests: the model, speech and the API are faked, so these cost nothing and need no network."""
import array
import asyncio
import json
import time

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
    s = CallSession(lang, send_audio, send_event, stt=FakeStt(), agent=agent, tts=tts, http=http)
    s._busy = False  # as after the greeting's beep: the caller has the floor
    return s, audio, events


def spoken(session):
    return [t["text"] for t in session.transcript if t["role"] == "assistant"]


def test_emergency_says_108_first_then_the_model_names_the_nearest_hospital_and_the_call_ends():
    posted = []

    async def agent(system, messages, tools):
        assert "EMERGENCY" in system  # the caller block tells the model what to do
        tools.state["emergency_shown"] = True  # as find_facilities does once it has a hospital to name
        return "Please go to the nearest hospital now."

    async def go():
        s, audio, _ = make_session(agent, posted)
        await s._turn("I have chest pain and I cannot breathe")
        ended = s._done.is_set()
        await s.close()
        return s, ended

    s, ended = asyncio.run(go())
    assert spoken(s) == [REPLIES["emergency"]["en"], "Please go to the nearest hospital now."]
    assert ended
    assert posted[0]["emergency"] is True and posted[0]["handoff"] is True and posted[0]["outcome"] == "emergency"
    assert posted[0]["severity"] == "serious"


def test_an_emergency_call_stays_open_until_the_hospital_is_named_but_never_past_three_turns():
    posted = []

    async def agent(system, messages, tools):
        return "Which area are you in?"

    async def go():
        s, _, _ = make_session(agent, posted)
        await s._turn("my father cannot breathe")
        first = s._done.is_set()
        await s._turn("Broadway")
        second = s._done.is_set()
        await s._turn("Broadway")
        third = s._done.is_set()
        await s.close()
        return first, second, third, s

    first, second, third, s = asyncio.run(go())
    assert (first, second, third) == (False, False, True)
    assert spoken(s)[0] == REPLIES["emergency"]["en"]


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


def test_mic_stays_muted_from_the_start_of_our_turn_until_the_beep():
    async def go():
        s, _, _ = make_session(None, [])
        s._busy = True  # thinking
        s.feed_audio(b"\x01\x01")
        await s._beep()
        s.feed_audio(b"\x01\x01")
        return [s._audio_q.get_nowait() for _ in range(2)]

    assert asyncio.run(go()) == [b"\x00\x00", b"\x01\x01"]


def test_words_heard_mid_turn_are_dropped_so_the_call_never_answers_one_turn_late():
    """Call 17: 'yes, book it' arrived while the bot was still answering an older sentence, and every reply after
    that answered the previous question."""
    heard, call = [], {}

    async def agent(system, messages, tools):
        heard.append(messages[-1]["content"][-1]["text"])
        if len(heard) == 1:
            await call["s"]._on_result("Hello hello", True)  # said while the model is still thinking
        return f"Reply {len(heard)}."

    async def go():
        s, _, _ = make_session(agent, [])
        call["s"] = s
        loop = asyncio.create_task(s._turn_loop())
        await s._on_result("I have stomach pain", True)
        s._last_result = 0
        await asyncio.sleep(1.5)
        await s._on_result("Maduravoyal", True)
        s._last_result = 0
        await asyncio.sleep(1.5)
        s._done.set()
        await loop
        return s

    s = asyncio.run(go())
    assert heard == ["I have stomach pain", "Maduravoyal"]
    assert any(e["ev"] == "ignored_mid_turn" for e in s.trace.events)


def test_a_sentence_still_being_transcribed_is_waited_for_not_split_into_two_turns():
    heard = []

    async def agent(system, messages, tools):
        heard.append(messages[-1]["content"][-1]["text"])
        return "Okay."

    async def go():
        s, _, _ = make_session(agent, [])
        s._stt.busy = True  # the caller's second half is still with Sarvam
        loop = asyncio.create_task(s._turn_loop())
        await s._on_result("I need a doctor", True)
        await asyncio.sleep(0.6)
        await s._on_result("for my mother", True)
        s._stt.busy = False
        await asyncio.sleep(1.5)
        s._done.set()
        await loop

    asyncio.run(go())
    assert heard == ["I need a doctor for my mother"]


def test_running_out_of_strikes_after_booking_says_goodbye_not_callback():
    from pipeline.prompts import GOODBYE

    async def go():
        s, _, _ = make_session(None, [])
        s.state["appointment_id"] = 5
        await s._give_up("noise")
        return s

    s = asyncio.run(go())
    assert spoken(s) == [GOODBYE["en"]] and not s.state.get("handoff")


def test_department_comes_from_the_keyword_table_not_the_model():
    assert department_for("my child has a cold") == "Paediatrics"
    assert department_for("pregnancy checkup") == "Obstetrics"
    assert department_for("knee hurts") == "General Medicine"
    assert place_for("Paranur") == (12.728, 79.968)
    assert place_for("Mannadi") == place_for("Mannady") and place_for("Paris Corner") == place_for("Parrys Corner")
    assert place_for("somewhere unknown") is None  # not guessed: the area is then looked up on the map


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


def _places_api(hospitals, partner_rows=(), clinics=(), geocode=None, seen=None):
    def api(req):
        if seen is not None:
            seen.append((req.url.path, dict(req.url.params)))
        if req.url.path.endswith("/places/nearby-hospitals"):
            if hospitals is None:
                return httpx.Response(503, json={"detail": "busy"})
            return httpx.Response(200, json=hospitals)
        if req.url.path.endswith("/places/geocode"):
            return httpx.Response(200, json=geocode or {"found": False, "reason": "not_found"})
        if req.url.path.endswith("/facilities"):
            return httpx.Response(200, json=list(clinics if req.url.params.get("kind") == "clinic" else partner_rows))
        return httpx.Response(404)
    return httpx.AsyncClient(base_url="http://api", transport=httpx.MockTransport(api))


def _hospital(name, kind, km, book_id=7):
    return {"name": name, "kind": kind, "distance_km": km, "address": f"{name} Road", "book_facility_id": book_id}


def _clinic(fid, name, km, departments=("General Medicine",)):
    return {"id": fid, "name": name, "type": "clinic", "address": f"{name} Street", "distance_km": km,
            "departments": list(departments), "is_partner": True}


def _find(api, state=None, **args):
    state = {} if state is None else state

    async def go():
        return await Tools(api, "en", state).call("find_facilities", {"village": "Paranur", "reason": "fever", "severity": "moderate", **args})
    return asyncio.run(go()), state


HOSPITALS = [_hospital("Rao Nursing Home", "private", 1.2), _hospital("Government Hospital Chengalpattu", "government", 3.4),
             _hospital("Lotus Family Hospital", "private", 5.0)]


def test_a_mild_problem_is_offered_the_two_nearest_partner_clinics_that_can_be_booked():
    seen = []
    api = _places_api(HOSPITALS, clinics=[_clinic(21, "Velan Clinic", 1.1), _clinic(22, "Anbu Health Clinic", 2.0),
                                          _clinic(23, "Lakshmi Family Clinic", 3.0)], seen=seen)
    out, state = _find(api, severity="mild")
    assert [c["name"] for c in out["clinics"]] == ["Velan Clinic", "Anbu Health Clinic"] and "hospitals" not in out
    assert all(c["can_book"] and c["department"] == "General Medicine" for c in out["clinics"])
    clinic_query = next(q for path, q in seen if path.endswith("/facilities"))
    assert clinic_query["partner_only"] == "true" and clinic_query["kind"] == "clinic" and clinic_query["max_km"] == "15"
    assert state["severity"] == "mild" and "emergency" not in state


def test_a_clinic_with_the_needed_department_comes_before_a_nearer_one_without_it():
    api = _places_api(HOSPITALS, clinics=[_clinic(21, "Velan Clinic", 1.0), _clinic(22, "Kids Clinic", 4.0, ("General Medicine", "Paediatrics"))])
    out, _ = _find(api, severity="mild", reason="my child has a cold")
    assert out["clinics"][0]["name"] == "Kids Clinic" and out["clinics"][0]["department"] == "Paediatrics"
    assert out["clinics"][1]["department"] == "General Medicine"  # a clinic without the department falls back to the default


def test_with_no_partner_clinic_nearby_a_mild_caller_is_given_the_hospitals_with_a_note():
    out, _ = _find(_places_api(HOSPITALS), severity="mild")
    assert "clinics" not in out and "No partner clinic" in out["note"] and out["show"] == "hospitals"
    assert [h["name"] for h in out["hospitals"]] == ["Rao Nursing Home", "Government Hospital Chengalpattu"]


def test_a_moderate_problem_gets_the_two_nearest_hospitals_and_the_government_one_is_information_only():
    out, state = _find(_places_api(HOSPITALS, clinics=[_clinic(21, "Velan Clinic", 1.1)]))
    private, government = out["hospitals"]
    assert private["can_book"] and private["id"] == 7 and private["department"] == "General Medicine"
    assert government["is_government"] and government["can_book"] is False and "id" not in government
    assert "clinics" not in out and "facility_id" not in state  # nothing is chosen until the caller picks


def test_free_government_hospitals_are_listed_on_request_and_never_bookable():
    out, _ = _find(_places_api(HOSPITALS), show="free_government")
    assert [h["name"] for h in out["free_government_hospitals"]] == ["Government Hospital Chengalpattu"]
    assert out["free_government_hospitals"][0]["can_book"] is False
    none, _ = _find(_places_api([_hospital("Rao Nursing Home", "private", 1.2)]), show="free_government")
    assert none["free_government_hospitals"] == [] and "No government hospital" in none["note"]


def test_a_caller_who_asks_for_clinics_after_a_moderate_answer_gets_the_clinics():
    out, _ = _find(_places_api(HOSPITALS, clinics=[_clinic(21, "Velan Clinic", 1.1)]), show="clinics")
    assert [c["name"] for c in out["clinics"]] == ["Velan Clinic"]


def test_a_serious_problem_gets_the_nearest_hospital_to_go_to_and_nothing_can_be_booked():
    out, state = _find(_places_api(HOSPITALS), severity="serious", show="clinics")
    assert out["show"] == "hospitals" and [h["name"] for h in out["hospitals"]][0] == "Rao Nursing Home"
    assert not any(h["can_book"] for h in out["hospitals"]) and "108" in out["say"]
    assert state["emergency"] and state["handoff"] and state["emergency_shown"] and state["severity"] == "serious"


def test_a_wrong_severity_value_is_refused_so_the_model_must_choose_one():
    out, _ = _find(_places_api(HOSPITALS), severity="urgent")
    assert "error" in out


def test_picking_a_listed_clinic_sets_the_booking_target_and_the_clinic_name_is_what_gets_confirmed():
    api = _places_api(HOSPITALS, clinics=[_clinic(21, "Velan Clinic", 1.1)])

    async def go():
        state = {}
        tools = Tools(api, "en", state)
        await tools.call("find_facilities", {"village": "Velachery", "reason": "fever", "severity": "mild"})
        picked = await tools.call("find_facilities", {"village": "Velachery", "reason": "fever", "severity": "mild", "hospital_name": "velan clinic"})
        return picked, state
    picked, state = asyncio.run(go())
    assert picked["selected"]["id"] == 21 and state["facility_id"] == 21 and state["hospital"] == "Velan Clinic"


def test_choosing_a_government_hospital_never_makes_it_the_booking_target():
    out, state = _find(_places_api(HOSPITALS), hospital_name="Government Hospital Chengalpattu")
    assert out["selected"]["name"] == "Government Hospital Chengalpattu" and out["selected"]["can_book"] is False
    assert "facility_id" not in state and "hospital" not in state


def test_choosing_a_private_hospital_books_into_the_demo_one_under_the_real_name():
    out, state = _find(_places_api(HOSPITALS), hospital_name="Rao Nursing Home")
    assert out["selected"]["id"] == 7 and state["facility_id"] == 7 and state["hospital"] == "Rao Nursing Home"


def test_a_hospital_the_caller_names_is_accepted_even_when_it_is_not_nearby():
    api = _places_api([_hospital("Rao Nursing Home", "private", 1.2)])
    out, state = _find(api, hospital_name="Apollo Speciality Hospital")
    assert out["selected"]["name"] == "Apollo Speciality Hospital" and out["selected"]["id"] == 7
    assert "error" not in out and state["facility_id"] == 7 and state["hospital"] == "Apollo Speciality Hospital"


def test_when_the_hospital_lookup_is_down_the_demo_hospital_is_named_instead():
    demo = {"id": 7, "name": "Sunrise Nursing Home", "address": "Railway Feeder Road", "type": "private", "is_partner": True}
    out, state = _find(_places_api(None, [demo]))
    assert out["hospitals"][0]["name"] == "Sunrise Nursing Home" and out["hospitals"][0]["id"] == 7


def test_a_whole_city_is_refused_and_the_caller_is_asked_for_an_area():
    out, state = _find(_places_api(HOSPITALS), village="Chennai")
    assert out["error"] == "area_too_general" and "hospitals" not in out
    out, _ = _find(_places_api(HOSPITALS), village="  chennai ")
    assert out["error"] == "area_too_general"


def test_an_area_in_the_local_table_needs_no_map_lookup_and_a_missing_area_is_asked_for():
    seen = []
    out, state = _find(_places_api(HOSPITALS, seen=seen), village="Broadway")
    assert "hospitals" in out and not any(path.endswith("/geocode") for path, _ in seen)
    assert (state["lat"], state["lng"]) == (13.088, 80.278)
    out, _ = _find(_places_api(HOSPITALS), village="")
    assert out["error"] == "location_needed"


def test_an_unknown_area_is_looked_up_on_the_map_and_a_city_or_a_miss_is_reported():
    seen = []
    found = {"found": True, "name": "Kolathur", "lat": 13.12, "lng": 80.22}
    out, state = _find(_places_api(HOSPITALS, geocode=found, seen=seen), village="Kolathur")
    assert "hospitals" in out and (state["lat"], state["lng"]) == (13.12, 80.22)
    assert any(p.endswith("/places/geocode") for p, _ in seen)
    city, _ = _find(_places_api(HOSPITALS, geocode={"found": False, "reason": "too_general"}), village="Salem")
    assert city["error"] == "area_too_general"
    missing, _ = _find(_places_api(HOSPITALS), village="Nowheresville")
    assert missing["error"] == "area_not_found"


def test_the_live_location_is_used_without_asking_and_remembered_for_the_next_call():
    state = {"profile": {"live": True, "lat": 13.01, "lng": 80.25, "place": "Adyar"}}

    async def go():
        tools = Tools(_places_api(HOSPITALS), "en", state)
        first = await tools.call("find_facilities", {"use_live_location": True, "reason": "fever", "severity": "moderate"})
        again = await tools.call("find_facilities", {"reason": "fever", "severity": "moderate", "show": "free_government"})
        return first, again
    first, again = asyncio.run(go())
    assert "hospitals" in first and "free_government_hospitals" in again and state["village"] == "Adyar"


def test_a_partner_clinic_is_booked_under_its_own_name_and_the_demo_hospital_label_is_not_used():
    api = _slots_api([_slot(1, "Dr A", 10)])

    async def go():
        state = {}
        tools = Tools(api, "en", state)
        tools._clinic_by_id[7] = {"name": "Velan Clinic", "address": "Velan Street"}
        await tools.call("get_slots", {"facility_id": 7, "department": "General Medicine"})
        return await tools.call("book_appointment", {"slot_id": 1, "name": "Ravi", "phone": "9876543210", "village": "P", "reason_text": "fever"})
    out = asyncio.run(go())
    assert out["facility"] == "Velan Clinic" and out["address"] == "Velan Street"


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


def test_background_noise_is_never_answered_and_never_counts_against_the_caller():
    async def agent(*_):
        raise AssertionError("noise must not reach the model")

    async def go():
        s, _, events = make_session(agent, [])
        s._listening_since = time.monotonic()
        for raw in ("ਹਾਂਜੀ।", "ਹਾਂ।", "ਅੱਛਾ।"):  # the fragments from the noisy demo-room call
            await s._on_result(raw, True)
        return s, events

    s, events = asyncio.run(go())
    assert s._pending == [] and spoken(s) == [] and s._strikes == 0
    assert not s.state.get("handoff")
    assert s._last_speech == 0.0  # the no-input prompt still fires if only noise is heard for a while


def test_real_words_after_noise_are_answered():
    async def go():
        s, _, _ = make_session(None, [])
        await s._on_result("ਹਾਂਜੀ।", True)
        await s._on_result("I need a doctor", True)
        return s

    s = asyncio.run(go())
    assert s._pending == ["I need a doctor"] and s._last_speech > 0


def _pcm(level: int, secs: float, rate: int = 8000) -> bytes:
    return array.array("h", [level if i % 2 else -level for i in range(int(rate * secs))]).tobytes()


def _listen(chunks: list[bytes]) -> list[bytes]:
    from pipeline.sarvam import SarvamStt

    sent = []
    stt = SarvamStt("auto", 8000)

    async def fake(pcm):
        sent.append(pcm)
        return "x"

    async def noop(*_):
        pass

    stt._transcribe = fake

    async def go():
        q = asyncio.Queue()
        for c in chunks:
            for i in range(0, len(c), 320):  # 20 ms frames, as the phone bridge sends them
                q.put_nowait(c[i:i + 320])
        q.put_nowait(None)
        await stt.run(q, noop)

    asyncio.run(go())
    return sent


def test_a_short_blip_is_not_sent_for_transcription():
    assert _listen([_pcm(0, 0.5), _pcm(4000, 0.1), _pcm(0, 1.0)]) == []


def test_speech_is_still_sent_on_a_quiet_line():
    assert len(_listen([_pcm(20, 0.5), _pcm(8000, 0.8), _pcm(20, 1.0)])) == 1


def test_steady_background_hum_is_not_speech_but_a_caller_over_it_is():
    hum = _pcm(450, 3.0)  # the noisy call's background level, just under the old fixed bar of 500
    assert _listen([hum, _pcm(700, 1.0), hum]) == []  # a louder stretch of the same room noise
    assert len(_listen([hum, _pcm(8000, 0.8), hum])) == 1


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


def test_thanks_after_a_booking_greets_back_and_ends_the_call_without_the_model():
    from pipeline.prompts import GOODBYE

    async def agent(*_):
        raise AssertionError("a thank-you after booking must not reach the model")

    async def go():
        s, _, events = make_session(agent, [])
        s.state["appointment_id"] = 9
        await s._turn("நன்றி.")
        return s, events

    s, events = asyncio.run(go())
    assert spoken(s)[-1] == GOODBYE["en"] and any(e["type"] == "ended" for e in events)


def test_thanks_before_any_booking_or_a_long_request_keeps_the_call_going():
    async def agent(system, messages, tools):
        messages.append({"role": "assistant", "content": [{"text": "x"}]})
        return "Which village are you from?"

    async def go():
        s, _, events = make_session(agent, [])
        await s._turn("thank you")
        s.state["appointment_id"] = 9
        await s._turn("thank you but I also need a doctor for my mother tomorrow morning")
        return s, events

    s, events = asyncio.run(go())
    assert spoken(s) == ["Which village are you from?"] * 2
    assert not any(e["type"] == "ended" for e in events)


def test_a_second_slot_choice_moves_the_booking_instead_of_making_another():
    calls = []

    def api(req):
        calls.append((req.method, req.url.path))
        return httpx.Response(200, json={"id": 9, "patient": {"phone": "09876543210"}, "facility": {"id": 7, "name": "F", "address": "A"},
                                         "doctor": {"name": "Dr A"}, "slot": {"start": "2026-10-16T10:00:00+05:30"}})

    async def go():
        http = httpx.AsyncClient(base_url="http://api", transport=httpx.MockTransport(api))
        state = {"phone": "09876543210", "appointment_id": 9}
        return await Tools(http, "en", state).call(
            "book_appointment", {"slot_id": 2, "name": "Ravi", "village": "P", "reason_text": "fever"})

    out = asyncio.run(go())
    assert calls == [("PATCH", "/appointments/9")] and out["appointment_id"] == 9


def test_after_the_first_sentence_only_a_whole_sentence_in_another_language_moves_the_call():
    async def go():
        s, _, _ = make_session(None, [], lang="auto")
        s._stt.detected = "en"
        await s._on_result("I have fever since two days", True)
        s._stt.detected = "ta"
        await s._on_result("சென்னை மதுரவாயல் பஸ்", True)  # a place named in Tamil letters: three words, still English
        a = s.lang
        await s._on_result("Maduravoyal near the bus stand please", True)  # detector says Tamil, the words are English
        b = s.lang
        await s._on_result("எனக்கு ரொம்ப காய்ச்சல் இருக்கு டாக்டர்", True)
        return a, b, s.lang

    assert asyncio.run(go()) == ("en", "en", "ta")


def test_malayalam_and_kannada_have_every_spoken_line_and_use_sarvam_for_speech():
    from pipeline import llm, prompts
    from pipeline.sarvam import CODES, SarvamStt

    assert set(CODES) == {"ta", "ml", "kn", "te"}
    for table in (prompts.GREETING, prompts.WELCOME, prompts.DISCLAIMER, prompts.ASK_PROBLEM, prompts.AFTER_LANGUAGE, prompts.UNVERIFIED, prompts.FILLER, prompts.UNCLEAR, prompts.GIVE_UP,
                  prompts.GOODBYE, prompts.GREETING_FALLBACK, llm.FALLBACK, REPLIES["emergency"], REPLIES["symptom"]):
        assert {"ml", "kn", "te"} <= set(table), table
    assert {"ml", "kn", "te"} <= {code for code, _ in prompts.AUTO_GREETING}
    for lang in ("ml", "kn", "te"):
        async def nothing(*a):
            return None

        s = CallSession(lang, nothing, nothing)
        assert isinstance(s._stt, SarvamStt) and s._stt.code == CODES[lang]


def test_an_emergency_in_malayalam_or_kannada_is_answered_in_that_language_without_the_model():
    for lang, text in (("ml", "അച്ഛന് നെഞ്ചുവേദന ഉണ്ട്"), ("kn", "ಅಪ್ಪನಿಗೆ ಎದೆ ನೋವು ಬರುತ್ತಿದೆ"),
                       ("te", "నాన్నకు ఛాతి నొప్పి వస్తోంది"),
                       ("ta", "நெஞ்சு வலி")):
        posted: list = []

        async def agent(*a):
            return "ok"

        async def go():
            s, _, _ = make_session(agent, posted, lang="auto")  # a short first sentence has not moved the language yet
            await s._turn(text)
            return s

        s = asyncio.run(go())
        assert spoken(s)[0] == REPLIES["emergency"][lang] and s.state["emergency"] and s.lang == lang


def test_a_malayalam_or_kannada_sentence_moves_an_auto_call_and_the_script_check_accepts_it():
    from pipeline.session import _clean, _in_script

    assert _clean("എനിക്ക് പനി ഉണ്ട് doctor") == "എനിക്ക് പനി ഉണ്ട് doctor"
    assert _clean("ನನಗೆ ಜ್ವರ ಇದೆ") == "ನನಗೆ ಜ್ವರ ಇದೆ"
    assert _in_script("എനിക്ക് പനി ഉണ്ട്", "ml") and _in_script("ನನಗೆ ಜ್ವರ ಇದೆ", "kn")
    assert _clean("నాకు జ్వరం ఉంది") == "నాకు జ్వరం ఉంది" and _in_script("నాకు జ్వరం ఉంది", "te")
    assert not _in_script("fever since two days", "ml")

    async def go():
        s, _, _ = make_session(None, [], lang="auto")
        s._stt.detected = "en"
        await s._on_result("I have fever since two days", True)
        s._stt.detected = "ml"
        await s._on_result("എനിക്ക് രണ്ട് ദിവസമായി പനി ഉണ്ട്", True)
        a = s.lang
        s._stt.detected = "kn"
        await s._on_result("ನನಗೆ ಎರಡು ದಿನದಿಂದ ಜ್ವರ ಇದೆ", True)
        b = s.lang
        s._stt.detected = "te"
        await s._on_result("నాకు రెండు రోజులుగా జ్వరం ఉంది", True)
        return a, b, s.lang

    assert asyncio.run(go()) == ("ml", "kn", "te")


def test_dictated_digit_words_in_malayalam_and_kannada_become_digits():
    from pipeline.digits import digits_from_words as d
    assert d("ഒമ്പത് എട്ട് ഏഴ് ആറ് അഞ്ച്") == "98765"
    assert d("ಒಂಬತ್ತು ಎಂಟು ಏಳು ಆರು ಐದು") == "98765"
    assert d("తొమ్మిది ఎనిమిది ఏడు ఆరు ఐదు") == "98765"


def test_sarvam_moves_to_the_next_key_when_one_is_out_of_credit_and_stays_on_it(monkeypatch):
    from pipeline import config, sarvam

    used = []

    class Client:
        def __init__(self, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return None
        async def post(self, url, headers, **kw):
            key = headers["api-subscription-key"]
            used.append(key)
            return httpx.Response(402 if key in ("a", "b") else 200, json={}, request=httpx.Request("POST", url))

    monkeypatch.setattr(sarvam.httpx, "AsyncClient", Client)
    monkeypatch.setattr(config, "SARVAM_API_KEY", "a, b ,c")
    monkeypatch.setattr(sarvam, "_key", 0)
    assert asyncio.run(sarvam._post("/x", 5)).status_code == 200
    assert used == ["a", "b", "c"] and sarvam._key == 2
    asyncio.run(sarvam._post("/x", 5))
    assert used[3:] == ["c"]

    monkeypatch.setattr(config, "SARVAM_API_KEY", "a,b")  # every key exhausted: the error reaches the caller
    monkeypatch.setattr(sarvam, "_key", 0)
    try:
        asyncio.run(sarvam._post("/x", 5))
        raise AssertionError("should have raised")
    except httpx.HTTPStatusError as e:
        assert e.response.status_code == 402


def test_the_language_named_by_the_caller_is_found_in_any_script_and_the_first_one_wins():
    from pipeline.languages import language_named

    for text, code in (("Tamil", "ta"), ("தமிழ்", "ta"), ("hindi please", "hi"), ("हिंदी", "hi"), ("English", "en"),
                       ("മലയാളം", "ml"), ("Kannada", "kn"), ("ಕನ್ನಡ", "kn"), ("తెలుగు", "te"), ("telugu or english", "te")):
        assert language_named(text) == code, text
    assert language_named("my stomach hurts") is None


def test_an_auto_call_hears_the_disclaimer_in_the_language_the_caller_named_and_the_model_waits():
    from pipeline import prompts

    async def agent(*a):
        raise AssertionError("naming a language must not reach the model")

    async def go():
        s, _, _ = make_session(agent, [], lang="auto")
        await s._turn("Tamil")
        return s

    s = asyncio.run(go())
    assert spoken(s) == [prompts.AFTER_LANGUAGE["ta"]] and s.lang == "ta" and s._lang_chosen
    assert "108" in spoken(s)[0] and "transcribed" not in spoken(s)[0]  # in Tamil, not English


def test_a_caller_who_skips_the_language_question_and_describes_the_problem_still_hears_the_disclaimer_first():
    from pipeline import prompts

    async def agent(system, messages, tools):
        return "Which area are you in?"

    async def go():
        s, _, _ = make_session(agent, [], lang="auto")
        await s._turn("my stomach has been paining since morning")
        await s._turn("Broadway")
        return s

    s = asyncio.run(go())
    assert spoken(s) == [prompts.AFTER_LANGUAGE["en"], "Which area are you in?", "Which area are you in?"]


def test_the_disclaimer_is_said_only_once_and_a_call_with_a_fixed_language_opens_with_it_in_the_greeting():
    from pipeline import prompts

    async def agent(system, messages, tools):
        return "ok"

    async def go():
        s, _, _ = make_session(agent, [], lang="hi")  # fixed language: the greeting already carried the disclaimer
        await s._turn("मुझे बुखार है")
        return s

    s = asyncio.run(go())
    assert spoken(s) == ["ok"] and prompts.DISCLAIMER["hi"] in prompts.GREETING["hi"]
    assert prompts.GREETING["ta"].startswith(prompts.WELCOME["ta"])


def test_the_call_log_carries_the_severity_the_model_read():
    posted = []

    async def agent(system, messages, tools):
        tools.state["severity"] = "mild"
        return "ok"

    async def go():
        s, _, _ = make_session(agent, posted)
        await s._turn("I have a cold")
        await s.close()

    asyncio.run(go())
    assert posted[-1]["severity"] == "mild" and posted[-1]["outcome"] == "info_given"


def test_a_stray_capital_before_a_real_hospital_name_is_not_a_hallucination_but_an_invented_name_still_is():
    from pipeline.grounding import ungrounded

    known = ['{"name": "Government Stanley Hospital", "address": "Old Jail Road"}']
    assert ungrounded("The Government Stanley Hospital is 1.4 km away.", known) == []
    assert ungrounded("Please Visit Government Stanley Hospital today.", known) == []
    assert ungrounded("Visit Apollo Hospital instead.", known) == ["Visit Apollo Hospital"]
    assert ungrounded("Visit Stanley Clinic", known) == ["Visit Stanley Clinic"]


def test_booking_with_a_placeholder_name_is_refused_so_the_model_has_to_ask():
    async def go():
        return await Tools(_slots_api([_slot(1, "Dr A", 10)]), "en", {"phone": "9876543210"}).call(
            "book_appointment", {"slot_id": 1, "name": "Anonymous", "village": "P", "reason_text": "fever"})
    assert asyncio.run(go())["error"] == "name_needed"

from datetime import date, datetime, timedelta

from .common import IST
from .slots import _day_off, _day_slots, _taken, day_plan


def test_every_doctor_has_one_day_off_a_week_and_some_slots_taken_but_evenings_stay_bookable():
    start = datetime(2026, 11, 2, tzinfo=IST).date()
    week = [start + timedelta(days=i) for i in range(7)]
    for doctor in range(1, 30):
        assert sum(_day_off(doctor, d) for d in week) == 1
        slots = [s for d in week if not _day_off(doctor, d) for s, _ in _day_slots(d)]
        taken = sum(_taken(doctor, s) for s in slots)
        assert 0.15 < taken / len(slots) < 0.45
        assert any(not _taken(doctor, s) and s.hour >= 16 for s in slots)


def test_partial_timetable_leaves_the_break_without_slots():
    plan = {"mode": "partial", "slot_minutes": 20, "run": 3, "break_minutes": 20,
            "windows": [["17:00", "19:00"]], "days_off": []}
    pieces = [(s.strftime("%H:%M"), e.strftime("%H:%M"), k) for s, e, k in day_plan(plan, date(2026, 11, 9))]
    assert pieces == [("17:00", "17:20", "appointment"), ("17:20", "17:40", "appointment"),
                      ("17:40", "18:00", "appointment"), ("18:00", "18:20", "walk_in"),
                      ("18:20", "18:40", "appointment"), ("18:40", "19:00", "appointment")]


def test_appointments_only_timetable_is_back_to_back_and_honours_days_off():
    plan = {"mode": "appointments", "slot_minutes": 30, "run": 1, "break_minutes": 0,
            "windows": [["09:00", "10:30"]], "days_off": [6]}
    assert [k for *_, k in day_plan(plan, date(2026, 11, 9))] == ["appointment"] * 3
    assert list(day_plan(plan, date(2026, 11, 8))) == []  # a Sunday

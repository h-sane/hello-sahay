from datetime import datetime, timedelta

from .common import IST
from .slots import _day_off, _day_slots, _taken


def test_every_doctor_has_one_day_off_a_week_and_some_slots_taken_but_evenings_stay_bookable():
    start = datetime(2026, 11, 2, tzinfo=IST).date()
    week = [start + timedelta(days=i) for i in range(7)]
    for doctor in range(1, 30):
        assert sum(_day_off(doctor, d) for d in week) == 1
        slots = [s for d in week if not _day_off(doctor, d) for s, _ in _day_slots(d)]
        taken = sum(_taken(doctor, s) for s in slots)
        assert 0.15 < taken / len(slots) < 0.45
        assert any(not _taken(doctor, s) and s.hour >= 16 for s in slots)

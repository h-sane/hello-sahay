"""Clinic search and area lookup, with no database or network: a stub session and a faked OpenStreetMap reply."""
import io
import json

import pytest
from fastapi import HTTPException

from .models import Facility
from .routers import places
from .routers.facilities import list_facilities


class Rows:
    def __init__(self, rows):
        self.rows = rows

    def scalars(self, _query):
        return self.rows


def _f(id, name, type, lat, lng, partner=True, departments=("General Medicine",)):
    return Facility(id=id, name=name, type=type, address=name, lat=lat, lng=lng, departments=list(departments),
                    pmjay=False, cmchis=False, is_partner=partner)


ROWS = [_f(1, "Sunrise Nursing Home", "private", 12.69, 79.98), _f(2, "Govt Hospital", "GH", 13.09, 80.28, False),
        _f(3, "Velan Clinic", "clinic", 12.98, 80.22), _f(4, "Anbu Clinic", "clinic", 13.096, 80.287),
        _f(5, "Far Clinic", "clinic", 11.0, 77.0), _f(6, "Not Partner Clinic", "clinic", 13.09, 80.28, False)]


def _call(**kw):
    args = dict(lat=None, lng=None, department=None, scheme=None, kind=None, partner_only=False, max_km=None,
                nearest_first=False, use_demo_distance=False, limit=20, session=Rows(ROWS))
    return list_facilities(**{**args, **kw})


def test_only_partner_clinics_within_the_radius_come_back_nearest_first():
    out = _call(lat=13.0937, lng=80.2866, kind="clinic", partner_only=True, max_km=15, nearest_first=True)
    assert [f["name"] for f in out] == ["Anbu Clinic", "Velan Clinic"]
    assert out[0]["distance_km"] < out[1]["distance_km"] <= 15


def test_without_the_new_filters_the_old_order_stands_government_first():
    out = _call(lat=13.0937, lng=80.2866)
    assert out[0]["name"] == "Govt Hospital" and len(out) == len(ROWS)


def test_a_radius_without_a_position_matches_nothing_instead_of_everything():
    assert _call(kind="clinic", max_km=15) == []


def _osm(monkeypatch, hits):
    calls = []

    def urlopen(req, timeout):
        calls.append(req.full_url)
        return io.StringIO(json.dumps(hits))
    monkeypatch.setattr(places.urllib.request, "urlopen", urlopen)
    places._geocoded.clear()
    return calls


def test_a_named_area_is_geocoded_once_and_cached(monkeypatch):
    calls = _osm(monkeypatch, [{"name": "Kolathur", "lat": "13.12", "lon": "80.22", "addresstype": "suburb"}])
    assert places.geocode("Kolathur") == {"found": True, "name": "Kolathur", "lat": 13.12, "lng": 80.22}
    places.geocode("kolathur")
    assert len(calls) == 1 and "bounded=1" in calls[0] and "countrycodes=in" in calls[0]


def test_a_whole_city_or_an_unknown_name_is_reported_not_guessed(monkeypatch):
    _osm(monkeypatch, [{"name": "Chennai", "lat": "13.08", "lon": "80.27", "addresstype": "city"}])
    assert places.geocode("Chennai") == {"found": False, "reason": "too_general", "name": "Chennai"}
    _osm(monkeypatch, [])
    assert places.geocode("Nowheresville") == {"found": False, "reason": "not_found"}


def test_a_map_outage_is_a_503_not_a_wrong_place(monkeypatch):
    def down(req, timeout):
        raise OSError("blocked")
    monkeypatch.setattr(places.urllib.request, "urlopen", down)
    places._geocoded.clear()
    with pytest.raises(HTTPException) as e:
        places.geocode("Kolathur")
    assert e.value.status_code == 503


def test_prototype_clinics_are_that_far_from_any_caller_so_three_are_under_three_km_anywhere():
    clinics = [_f(10 + i, f"Clinic {i}", "clinic", 13.0 + i, 80.0, departments=("General Medicine",)) for i in range(5)]
    for f, km in zip(clinics, (0.8, 1.6, 2.4, 3.6, 4.2)):
        f.demo_distance_km = km
    for lat, lng in ((12.92, 80.12), (11.0, 77.0), (13.09, 80.28)):  # Tambaram, Coimbatore, George Town
        out = _call(session=Rows(clinics), lat=lat, lng=lng, kind="clinic", partner_only=True, max_km=3,
                    nearest_first=True, use_demo_distance=True)
        assert [f["distance_km"] for f in out] == [0.8, 1.6, 2.4]
    real = _call(session=Rows(clinics), lat=13.0, lng=80.0, kind="clinic", max_km=3, nearest_first=True)
    assert [f["name"] for f in real] == ["Clinic 0"]  # without the flag the real coordinates decide

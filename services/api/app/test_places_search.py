"""The "Where are you?" place search: Nominatim and Photon merged, either one enough, duplicates folded."""
import pytest
from fastapi import HTTPException

from .routers import places


@pytest.fixture(autouse=True)
def fresh_cache():
    places._suggested.clear()
    yield
    places._suggested.clear()


def test_search_folds_duplicates(monkeypatch):
    row = {"name": "Manali", "detail": "Thiruvottiyur, Tamil Nadu", "lat": 13.16, "lng": 80.26}
    monkeypatch.setattr(places, "_nominatim_places", lambda q: [row])
    monkeypatch.setattr(places, "_photon", lambda q: [dict(row), {**row, "detail": "Thrissur, Kerala"}])
    assert [p["detail"] for p in places.search_places("Manadi")] == ["Thiruvottiyur, Tamil Nadu", "Thrissur, Kerala"]


def test_search_works_with_photon_down(monkeypatch):
    def down(q):
        raise OSError("photon down")

    monkeypatch.setattr(places, "_photon", down)
    monkeypatch.setattr(places, "_nominatim_places", lambda q: [{"name": "Mannady", "detail": "Chennai, Tamil Nadu", "lat": 13.09, "lng": 80.29}])
    assert places.search_places("Mannady")[0]["name"] == "Mannady"


def test_search_says_busy_when_both_are_down(monkeypatch):
    def down(q):
        raise OSError("down")

    monkeypatch.setattr(places, "_photon", down)
    monkeypatch.setattr(places, "_nominatim_places", down)
    with pytest.raises(HTTPException) as e:
        places.search_places("Anywhere")
    assert e.value.status_code == 503


def test_jan_aushadhi_stores_sorted_nearest_first_and_deduplicated(monkeypatch):
    places._stores_cache.clear()
    el = lambda name, lat: {"tags": {"name": name, "phone": "+91 44 0000 0000"}, "lat": lat, "lon": 80.27}
    monkeypatch.setattr(places, "_stores_around", lambda lat, lng, radius: [el("Jan Aushadhi Kendra", 13.12), el("Jan Aushadhi Kendra", 13.12), el("Janaushadhi Store", 13.09)])
    out = places.nearby_jan_aushadhi(lat=13.08, lng=80.27, limit=5)
    assert [s["name"] for s in out] == ["Janaushadhi Store", "Jan Aushadhi Kendra"]
    assert out[0]["distance_km"] < out[1]["distance_km"]
    places._stores_cache.clear()

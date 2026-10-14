import pytest

from app.medicine_parse import brand_composition, form_of, parse_composition, unit_count


@pytest.mark.parametrize("name,expected", [
    ("Paracetamol Tablets IP 650 mg", ["paracetamol 650mg"]),
    ("Aceclofenac 100mg and Paracetamol 325mg Tablets", ["aceclofenac 100mg", "paracetamol 325mg"]),
    ("Aspirin Gastro-resistant Tablets IP 150 mg", ["aspirin 150mg"]),
    ("Telmisartan + Rosuvastatin Tablet (40/10 Mg)", ["rosuvastatin 10mg", "telmisartan 40mg"]),
    ("Metformin Hydrochloride Tablets IP 500 mg", ["metformin 500mg"]),
    ("Chlorzoxazone 500mg, Diclofenac 50mg and Paracetamol 325mg Tablets",
     ["chlorzoxazone 500mg", "diclofenac 50mg", "paracetamol 325mg"]),
    ("Medicated Corn Remover", []),
])
def test_jan_aushadhi_names(name, expected):
    assert parse_composition(name) == expected


def test_a_brand_and_its_generic_get_the_same_key():
    brand = brand_composition("Amoxycillin (500mg)", "Clavulanic Acid (125mg)")
    generic = parse_composition("Amoxicillin 500mg and Clavulanic Acid 125mg Tablets")
    assert brand == generic == ["amoxicillin 500mg", "clavulanic acid 125mg"]
    assert brand_composition("Paracetamol (650mg)") == parse_composition("Paracetamol Tablets IP 650 mg")
    assert brand_composition("Telmisartan (40mg)", "Amlodipine (5mg)") == ["amlodipine 5mg", "telmisartan 40mg"]


def test_different_strengths_never_match():
    assert brand_composition("Paracetamol (500mg)") != parse_composition("Paracetamol Tablets IP 650 mg")


@pytest.mark.parametrize("texts,form", [
    (("Calpol 650 Tablet", "strip of 15 tablets"), "tablet"),
    (("Pan-D Capsule SR",), "capsule-modified"),
    (("Cetzine Syrup",), "liquid"),
    (("Nothing here",), None),
])
def test_form(texts, form):
    assert form_of(*texts) == form


@pytest.mark.parametrize("pack,expected", [
    ("10's", (10, "unit")), ("strip of 15 tablets", (15, "unit")), ("200 ml", (200, "ml")),
    ("bottle of 100 ml syrup", (100, "ml")), ("30's Bottle", (30, "unit")), ("Four Strips in Mono-Pack", None),
])
def test_unit_count(pack, expected):
    assert unit_count(pack) == expected


def test_alternate_names_in_one_label_collapse():
    assert brand_composition("Paracetamol / Acetaminophen (325mg)", "Tramadol (37.5mg)") ==         ["paracetamol 325mg", "tramadol 37.5mg"]

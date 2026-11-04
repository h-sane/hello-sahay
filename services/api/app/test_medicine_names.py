from app import medicine_names


def test_misspelling_finds_the_real_brand_first():
    names = ["telmikind", "telmisartan", "cilaht", "crocin"]
    medicine_names._cache = (sorted(names), {n: n.capitalize() for n in names})
    assert medicine_names.suggest(None, "Talmikind")[0] == "Telmikind"
    assert medicine_names.suggest(None, "telm")[:2] == ["Telmikind", "Telmisartan"]
    assert medicine_names.suggest(None, "silahat")[0] == "Cilaht"
    medicine_names._cache = None

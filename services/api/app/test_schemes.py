from .schemes import cmchis_match


def test_listed_hospitals_match_despite_different_spelling():
    hit = cmchis_match("Government Hospital Thirukalukundram", "Chengalpattu district, Tamil Nadu")
    assert hit and hit["government"] and "Thirukalukundram" in hit["name"]
    hit = cmchis_match("Tagore Medical College and Hospital", "Chennai")
    assert hit and not hit["government"]


def test_unknown_or_generic_names_stay_unmatched():
    assert cmchis_match("Zzyzx Care Centre") is None
    assert cmchis_match("Government Hospital") is None
    assert cmchis_match("") is None


def test_a_listed_name_in_another_region_is_not_a_match():
    assert cmchis_match("PSG Hospitals", "Coimbatore")
    assert cmchis_match("PSG Hospitals", "Madurai") is None

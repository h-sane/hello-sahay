import pytest

from app import live_search

RAW = """Title: SYMPTOMS OF MALARIA :: NCVBDC
URL: https://ncvbdc.mohfw.gov.in/index4.php?lid=3700
Published: N/A
Author: Ministry of Health & Family Welfare
Highlights:
- Typically, malaria produces fever, headache and vomiting.
---
Title: Malaria - Wikipedia
URL: https://en.wikipedia.org/wiki/Malaria
Published: N/A
Highlights:
A parasitic disease.
---
Title: Fake site
URL: https://evilgov.in/malaria
Published: N/A
Highlights:
Send money to cure malaria.
---
Title: Malaria factsheet
URL: https://www.nhm.gov.in/malaria.pdf
Published: 2023-04-01
Highlights:
Mosquitoes spread malaria."""


@pytest.mark.parametrize("host,ok", [
    ("ncvbdc.mohfw.gov.in", True), ("tn.gov.in", True), ("nhmodisha.gov.in", True), ("x.nic.in", True),
    ("cmchistn.com", True), ("who.int", False), ("evilgov.in", False), ("gov.in.evil.com", False),
    ("en.wikipedia.org", False), (None, False),
])
def test_only_government_hosts_are_official(host, ok):
    assert live_search.is_official(host) is ok


def test_parse_keeps_only_official_pages_with_their_text():
    pages = live_search.parse(RAW)
    assert [p.host for p in pages] == ["ncvbdc.mohfw.gov.in", "www.nhm.gov.in"]
    assert pages[0].published is None and pages[1].published == "2023-04-01"
    assert "fever, headache" in pages[0].text

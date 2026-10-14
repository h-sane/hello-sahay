from types import SimpleNamespace

import pytest

from app.chat import bedrock, service
from app.chat.chunking import MAX_CHARS, chunk_text

CHUNKS = [SimpleNamespace(text=f"excerpt {i}") for i in range(1, 4)]


def ask(monkeypatch, raw):
    monkeypatch.setattr(bedrock, "generate", lambda system, user: raw)
    return service._ask_model("q", "en", CHUNKS)


@pytest.mark.parametrize("raw,expected", [
    ("Cover water tanks.\nSOURCES: 1,3", ("Cover water tanks.", [1, 3])),
    ("Stay hydrated. Avoid the sun. SOURCES: 2", ("Stay hydrated. Avoid the sun.", [2])),
    ("पानी के टैंक ढकें।\n\nस्रोत: 1", ("पानी के टैंक ढकें।", [1])),
    ("Wear light clothes.\n**SOURCES:** 1", ("Wear light clothes.", [1])),
])
def test_sources_are_split_off_whatever_the_label(monkeypatch, raw, expected):
    assert ask(monkeypatch, raw) == expected


@pytest.mark.parametrize("raw", [
    "NO_ANSWER\nSOURCES:",
    "A confident answer with no sources line",
    "Answer text.\nSOURCES: 9",  # excerpt number that does not exist
])
def test_answer_without_a_valid_source_is_rejected(monkeypatch, raw):
    assert ask(monkeypatch, raw) is None


def test_chunks_stay_under_the_limit_and_overlap():
    text = " ".join(f"Sentence number {i} about dengue prevention." for i in range(200))
    chunks = chunk_text(text)
    assert len(chunks) > 1 and all(len(c) <= MAX_CHARS for c in chunks)
    assert chunks[0].split(". ")[-1] in chunks[1]  # last sentence carried into the next chunk
    assert chunk_text("x" * (MAX_CHARS * 2 + 5))  # no punctuation at all still splits


@pytest.mark.parametrize("lang,message", [
    ("en", "what is the income limit for CMCHIS"),
    ("en", "who is eligible for the Chief Minister health insurance"),
    ("ta", "CMCHIS தகுதி என்ன"),
])
def test_cmchis_eligibility_gets_the_fixed_reply_without_retrieval(lang, message):
    out = service.answer(None, message, lang)  # no session: retrieval must not run
    assert out["answer"] == service.CMCHIS_ELIGIBILITY[lang] and out["citations"] == []

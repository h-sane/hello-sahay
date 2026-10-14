import re

# ~500 tokens: Hindi and Tamil run about 3 characters per token, English about 4.
MAX_CHARS = 1500
OVERLAP_CHARS = 250

_SENTENCE_END = re.compile(r"(?<=[.!?।])\s+|\n{2,}")


def chunk_text(text: str) -> list[str]:
    sentences = []
    for part in _SENTENCE_END.split(text.strip()):
        part = " ".join(part.split())
        while len(part) > MAX_CHARS:  # no punctuation for a long stretch
            sentences.append(part[:MAX_CHARS])
            part = part[MAX_CHARS:]
        if part:
            sentences.append(part)

    chunks, current = [], []
    for sentence in sentences:
        if current and sum(len(s) + 1 for s in current) + len(sentence) > MAX_CHARS:
            chunks.append(" ".join(current))
            tail, size = [], 0
            for s in reversed(current):  # carry the last sentences into the next chunk
                if size + len(s) > OVERLAP_CHARS:
                    break
                tail.insert(0, s)
                size += len(s) + 1
            current = tail
        current.append(sentence)
    if current:
        chunks.append(" ".join(current))
    return chunks

"""Chunk, embed (Titan v2) and store the advisory corpus in advisory_chunk. Safe to re-run.

Reads <dir>/sources.csv with columns doc_id,file,issuer,title,url,published,lang
(doc_id may be omitted; the file name is used). Each document's old chunks are
replaced, so edit a text file and run again.

    AWS_PROFILE=personal-bedrock python scripts/ingest_advisories.py [--dir DIR] [--only DOC_ID ...]
"""
import argparse
import csv
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "api"))

from sqlalchemy import delete  # noqa: E402

from app.chat.bedrock import embed  # noqa: E402
from app.chat.chunking import chunk_text  # noqa: E402
from app.db import SessionLocal, init_db  # noqa: E402
from app.models import AdvisoryChunk  # noqa: E402


def parse_date(value: str):
    value = (value or "").strip()
    for candidate in (value, value + "-01" if len(value) == 7 else ""):
        try:
            return date.fromisoformat(candidate)
        except ValueError:
            continue
    if value:
        print(f"  warning: unreadable published date {value!r}, stored empty")
    return None


def read_sources(directory: Path) -> list[dict]:
    with open(directory / "sources.csv", encoding="utf-8-sig", newline="") as f:
        lines = (line for line in f if line.strip() and not line.startswith("#"))
        return list(csv.DictReader(lines))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", type=Path, default=ROOT / "data" / "advisories")
    parser.add_argument("--only", nargs="*", help="doc_ids to (re)ingest; default all")
    args = parser.parse_args()

    init_db()
    total = 0
    for row in read_sources(args.dir):
        doc_id = (row.get("doc_id") or Path(row["file"]).stem).strip()
        if args.only and doc_id not in args.only:
            continue
        path = args.dir / row["file"].strip()
        if not path.exists():
            print(f"{doc_id}: missing file {path.name}, skipped")
            continue
        published = parse_date(row["published"])
        chunks = chunk_text(path.read_text(encoding="utf-8-sig"))
        with ThreadPoolExecutor(2) as pool:
            vectors = list(pool.map(embed, chunks))
        with SessionLocal() as session:
            session.execute(delete(AdvisoryChunk).where(AdvisoryChunk.doc_id == doc_id))
            session.add_all(
                AdvisoryChunk(doc_id=doc_id, text=text, lang=row["lang"].strip(), embedding=vec,
                              issuer=row["issuer"].strip(), title=row["title"].strip(),
                              url=row["url"].strip(), published=published)
                for text, vec in zip(chunks, vectors)
            )
            session.commit()
        total += len(chunks)
        print(f"{doc_id}: {len(chunks)} chunks")
    print(f"done, {total} chunks")


if __name__ == "__main__":
    main()

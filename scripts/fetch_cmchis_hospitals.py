"""Download the official CMCHIS empanelled-hospital list (cmchistn.com) into data/schemes/cmchis_hospitals.json.

Tamil Nadu publishes it as an open JSON API behind its public site. Re-run to refresh; the API loads the file at start.
"""
import json
import time
import urllib.request
from datetime import date
from pathlib import Path

BASE = "https://chtn.cmchistn.com/api/v1"
# The full empanelled list first (it carries addresses), then the smaller official lists to fill any gaps.
LISTS = ["tpa-hospitals-v2", "tpa-hospitals", "district-wise-multi-speciality", "district-wise-single-speciality",
         "nk48-hospitals", "ppt-hospitals"]
OUT = Path(__file__).resolve().parent.parent / "data" / "schemes" / "cmchis_hospitals.json"


def pages(url: str):
    while url:
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 HelloSahay"})
                with urllib.request.urlopen(req, timeout=60) as r:
                    page = json.load(r)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2)
        yield from page["results"]
        url = page.get("next")


def main() -> None:
    seen: dict[str, dict] = {}
    for name in LISTS:
        for row in pages(f"{BASE}/{name}/?json=1"):
            hospital = (row.get("hospital_name") or "").strip()
            if not hospital:
                continue
            code = (row.get("entity_code") or "").strip() or hospital
            seen.setdefault(code, {
                "code": code, "name": hospital, "district": (row.get("district") or "").strip(),
                "type": (row.get("pvt_govt") or row.get("hospital_type") or row.get("directrate")
                         or row.get("directorate") or "").strip(),
                "address": (row.get("address") or "").strip(),
            })
    rows = sorted(seen.values(), key=lambda r: (r["district"].lower(), r["name"].lower()))
    OUT.write_text(json.dumps({
        "source": "Chief Minister's Comprehensive Health Insurance Scheme, Tamil Nadu (cmchistn.com)",
        "fetched": date.today().isoformat(), "hospitals": rows}, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"{len(rows)} hospitals -> {OUT}")


if __name__ == "__main__":
    main()

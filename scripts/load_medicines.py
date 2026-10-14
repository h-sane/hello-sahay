"""Build and load the medicine price data used by GET /medicines/search and POST /medicines/scan.

  python scripts/load_medicines.py build   # raw downloads -> data/medicines/brands.csv.gz + janaushadhi_mrp.csv
  python scripts/load_medicines.py load    # committed files -> Postgres (replaces both tables)
  python scripts/load_medicines.py load --if-empty   # same, but does nothing when the tables already hold data

`build` needs the Jan Aushadhi CSV that PMBI's site offers (data/medicines/raw/Product List*.csv) and downloads
the Indian Medicine Dataset. `load` needs only the two committed files.
"""
import csv
import glob
import gzip
import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "api"))

from app.medicine_parse import brand_composition, form_of, parse_composition  # noqa: E402

DATA = ROOT / "data" / "medicines"
RAW = DATA / "raw"
BRANDS = DATA / "brands.csv.gz"
JAN = DATA / "janaushadhi_mrp.csv"
DATASET_URL = "https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/indian_medicine_data.csv"


def build() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    raw_brands = RAW / "indian_medicine_data.csv"
    if not raw_brands.exists():
        print("downloading brand dataset (32 MB)...")
        urllib.request.urlretrieve(DATASET_URL, raw_brands)
    jan_files = sorted(glob.glob(str(RAW / "Product List*.csv")))
    if not jan_files:
        sys.exit("Put the Jan Aushadhi product list CSV (janaushadhi.gov.in > Product MRP list) in data/medicines/raw/")
    shutil.copy(jan_files[-1], JAN)
    kept = 0
    with open(raw_brands, encoding="utf-8-sig", newline="") as src, gzip.open(BRANDS, "wt", encoding="utf-8", newline="") as out:
        writer = csv.writer(out)
        writer.writerow(["brand", "key", "form", "manufacturer", "pack", "price"])
        for r in csv.DictReader(src):
            try:
                price = float(r["price(₹)"])
            except ValueError:
                continue
            if r["Is_discontinued"].strip().upper() == "TRUE" or r["type"] != "allopathy" or price <= 0:
                continue
            key = brand_composition(r["short_composition1"], r["short_composition2"])
            form = form_of(r["name"], r["pack_size_label"])
            writer.writerow([r["name"].strip(), "|".join(key), form or "", r["manufacturer_name"].strip(),
                             r["pack_size_label"].strip(), price])
            kept += 1
    print(f"brands: {kept} rows -> {BRANDS.name} ({BRANDS.stat().st_size // 1024} KB); jan aushadhi -> {JAN.name}")


def load() -> None:
    from sqlalchemy import delete
    from sqlalchemy.orm import Session

    from app.db import engine, init_db
    from app.models_patient_app import BrandMedicine, JanAushadhiItem

    init_db()
    with Session(engine) as session:
        if "--if-empty" in sys.argv and session.query(JanAushadhiItem).count() > 0:
            print("medicine tables already loaded")
            return
        session.execute(delete(BrandMedicine))
        session.execute(delete(JanAushadhiItem))
        jan = 0
        with open(JAN, encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                mrp = float(r["MRP"] or 0)
                key = parse_composition(r["Generic Name"])
                if mrp <= 0:
                    continue
                session.add(JanAushadhiItem(
                    drug_code=r["Drug Code"], generic_name=r["Generic Name"].replace("\xa0", " ").strip(),
                    key=key, form=form_of(r["Generic Name"]), pack=r["Unit Size"], mrp=mrp, group_name=r["Group Name"]))
                jan += 1
        session.commit()
        batch = []
        with gzip.open(BRANDS, "rt", encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                batch.append({"brand": r["brand"], "key": [k for k in r["key"].split("|") if k], "form": r["form"] or None,
                              "manufacturer": r["manufacturer"] or None, "pack": r["pack"] or None, "price": float(r["price"])})
                if len(batch) == 5000:
                    session.bulk_insert_mappings(BrandMedicine, batch)
                    batch = []
        if batch:
            session.bulk_insert_mappings(BrandMedicine, batch)
        session.commit()
        total = session.query(BrandMedicine).count()
    print(f"loaded {jan} Jan Aushadhi products and {total} brands")


if __name__ == "__main__":
    {"build": build, "load": load}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()

"""Medicine search and label scan. Prices come from the loaded datasets or the label itself, never from the model.

The vision model only reads the printed text off the photo; a fixed program then matches composition, strength
and form against the official Jan Aushadhi price list.
"""
import base64
import json
import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from ..chat import bedrock
from ..db import get_session
from ..medicine_parse import brand_composition, form_of, unit_count
from ..models_patient_app import BrandMedicine, JanAushadhiItem
from ..security import optional_claims

router = APIRouter()
log = logging.getLogger("sahay.medicines")

MAX_IMAGE_BYTES = 6 * 1024 * 1024
PRICE_NOTE = "Brand price from the Indian Medicine Dataset (about 2022, indicative). Jan Aushadhi price from the PMBI list."
READ_SYSTEM = (
    "You read printed text from a photo of a medicine strip, box or bottle. Reply with one JSON object only, no other text:\n"
    '{"readable": true|false, "brand": string|null, "composition": [{"salt": string, "strength": string}], '
    '"form": string|null, "mrp": number|null, "pack": string|null, "manufacturer": string|null}\n'
    "Rules: copy only text that is visibly printed. Use null or [] for anything you cannot see. Never guess and never "
    "add information from your own knowledge. If the photo is not a medicine label, set readable to false. "
    'A strength is a number with its unit, for example "500 mg". "mrp" is the printed maximum retail price in rupees.'
)


def human(key_item: str) -> str:
    salt, _, strength = key_item.rpartition(" ")
    spaced = re.sub(r"(\d)([a-z%]+)$", r"\1 \2", strength)
    return f"{salt.capitalize()} {spaced}"


def composition_text(key: list[str]) -> str:
    return " + ".join(human(k) for k in key)


def _per_unit(price: float, pack: str | None) -> tuple[float, str] | None:
    count = unit_count(pack)
    return (price / count[0], count[1]) if count and count[0] > 0 else None


def equivalent(session: Session, key: list[str], form: str | None, price: float | None, pack: str | None) -> dict | None:
    """The cheapest Jan Aushadhi product with the same salts, strengths and form, and the saving per tablet/ml."""
    if not key:
        return None
    rows = session.scalars(select(JanAushadhiItem).where(JanAushadhiItem.key == key)).all()
    rows = [r for r in rows if form is None or r.form is None or r.form == form]
    if not rows:
        return None
    best = min(rows, key=lambda r: float(r.mrp))
    out = {"name": best.generic_name, "pack": best.pack, "price_rs": float(best.mrp), "saving_percent": None}
    brand_unit = _per_unit(price, pack) if price else None
    jan_unit = _per_unit(float(best.mrp), best.pack)
    if brand_unit and jan_unit and brand_unit[1] == jan_unit[1] and brand_unit[0] > jan_unit[0]:
        out["saving_percent"] = round((1 - jan_unit[0] / brand_unit[0]) * 100)
    return out


def _item(session: Session, row: BrandMedicine, price: float | None = None, pack: str | None = None) -> dict:
    price = price if price is not None else (float(row.price) if row.price is not None else None)
    pack = pack or row.pack
    return {
        "id": row.id, "brand": row.brand, "composition": composition_text(row.key) or None, "form": row.form,
        "manufacturer": row.manufacturer, "pack": pack, "price_rs": price,
        "jan_aushadhi": equivalent(session, list(row.key), row.form, price, pack),
    }


@router.get("/medicines/search")
def search(q: str = Query(min_length=2, max_length=80), limit: int = Query(12, ge=1, le=30),
           session: Session = Depends(get_session)):
    """Brands by name first, then by salt. Generic Jan Aushadhi products matching the words are listed too."""
    term = q.strip()
    brands = session.scalars(
        select(BrandMedicine).where(BrandMedicine.brand.ilike(f"%{term}%"))
        .order_by(case((BrandMedicine.brand.ilike(f"{term}%"), 0), else_=1), func.length(BrandMedicine.brand))
        .limit(limit)).all()
    if len(brands) < limit:
        seen = {b.id for b in brands}
        by_salt = session.scalars(
            select(BrandMedicine).where(func.array_to_string(BrandMedicine.key, " ").ilike(f"%{term}%"))
            .order_by(func.length(BrandMedicine.brand)).limit(limit * 2)).all()
        brands += [b for b in by_salt if b.id not in seen][: limit - len(brands)]
    generics = session.scalars(
        select(JanAushadhiItem).where(JanAushadhiItem.generic_name.ilike(f"%{term}%"), JanAushadhiItem.mrp > 0)
        .order_by(JanAushadhiItem.mrp).limit(8)).all()
    return {
        "query": term, "note": PRICE_NOTE,
        "brands": [_item(session, b) for b in brands],
        "generics": [{"name": g.generic_name, "pack": g.pack, "price_rs": float(g.mrp), "group": g.group_name} for g in generics],
    }


class ScanIn(BaseModel):
    image: str = Field(min_length=100, description="base64 of the photo, with or without a data: prefix")


def _read_label(raw: bytes, fmt: str) -> dict:
    text = bedrock.read_image(READ_SYSTEM, "Read this medicine label.", raw, fmt)
    found = re.search(r"\{.*\}", text, re.S)
    if not found:
        return {"readable": False}
    return json.loads(found.group(0))


def _number(value) -> float | None:
    try:
        n = float(re.sub(r"[^\d.]", "", str(value))) if value is not None else None
    except ValueError:
        return None
    return n if n and n > 0 else None


@router.post("/medicines/scan")
def scan(body: ScanIn, session: Session = Depends(get_session), claims: dict | None = Depends(optional_claims)):
    if claims is None or claims.get("role") != "patient":
        raise HTTPException(401, "sign in to scan a label")
    data = body.image.split(",", 1)[-1]
    try:
        raw = base64.b64decode(data, validate=True)
    except ValueError:
        raise HTTPException(422, "image is not valid base64")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "photo is too large, try a smaller one")
    fmt = "png" if raw[:4] == b"\x89PNG" else "webp" if raw[8:12] == b"WEBP" else "jpeg" if raw[:3] == b"\xff\xd8\xff" else None
    if fmt is None:
        raise HTTPException(422, "send a JPEG, PNG or WebP photo")
    try:
        read = _read_label(raw, fmt)
    except Exception:
        log.exception("label read failed")
        raise HTTPException(502, "could not read the photo right now, please try again")

    brand = (read.get("brand") or "").strip() or None
    parts = [f"{c.get('salt', '')} ({c.get('strength', '')})" for c in read.get("composition") or []]
    key = brand_composition(*parts)
    form = form_of(read.get("form"), brand, read.get("pack"))
    label_price, label_pack = _number(read.get("mrp")), (read.get("pack") or None)
    seen = {"brand": brand, "composition": composition_text(key) or None, "form": read.get("form"),
            "pack": label_pack, "manufacturer": read.get("manufacturer"), "price_rs": label_price}
    if not read.get("readable") or not (brand or key):
        return {"status": "unreadable", "read": seen, "matches": []}

    known = None
    if brand:
        known = session.scalars(select(BrandMedicine).where(BrandMedicine.brand.ilike(brand))).first() or \
            session.scalars(select(BrandMedicine).where(BrandMedicine.brand.ilike(f"{brand}%")).order_by(func.length(BrandMedicine.brand))).first()
    if not key and known and known.key:
        key = list(known.key)
        seen["composition"] = composition_text(key)
    if not key:
        return {"status": "brand_only", "read": seen, "matches": []}
    price = label_price if label_price is not None else (float(known.price) if known and known.price else None)
    pack = label_pack if label_price is not None and unit_count(label_pack) else (known.pack if known else None)
    item = {"brand": brand, "composition": composition_text(key), "form": form, "pack": pack,
            "manufacturer": read.get("manufacturer") or (known.manufacturer if known else None), "price_rs": price,
            "price_from": "label" if label_price is not None else ("dataset" if price else None),
            "jan_aushadhi": equivalent(session, key, form or (known.form if known else None), price, pack)}
    return {"status": "found" if item["jan_aushadhi"] else "no_equivalent", "read": seen, "matches": [item], "note": PRICE_NOTE}

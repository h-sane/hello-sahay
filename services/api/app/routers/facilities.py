import math
from datetime import date as Date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import IST, day_range, today_ist
from ..db import get_session
from ..models import Doctor, Facility, Slot

router = APIRouter()
GOVERNMENT_TYPES = {"PHC", "CHC", "GH"}


def _km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lng2 - lng1) / 2) ** 2)
    return 6371 * 2 * math.asin(math.sqrt(a))


@router.get("/facilities")
def list_facilities(
    lat: float | None = Query(None, ge=-90, le=90),
    lng: float | None = Query(None, ge=-180, le=180),
    department: str | None = None,
    scheme: Literal["pmjay", "cmchis"] | None = None,
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    if (lat is None) != (lng is None):
        raise HTTPException(422, "lat and lng go together")
    out = []
    for f in session.scalars(select(Facility)):
        if department and department.lower() not in {d.lower() for d in f.departments or []}:
            continue
        if scheme and not getattr(f, scheme):
            continue
        near = lat is not None and f.lat is not None and f.lng is not None
        out.append({
            "id": f.id, "name": f.name, "type": f.type, "address": f.address,
            "lat": f.lat, "lng": f.lng, "phone": f.phone, "hours": f.hours,
            "departments": f.departments or [], "pmjay": f.pmjay, "cmchis": f.cmchis,
            "is_partner": f.is_partner, "is_government": f.type in GOVERNMENT_TYPES,
            "distance_km": round(_km(lat, lng, f.lat, f.lng), 1) if near else None,
        })
    # Free government options before private ones, then nearest first.
    out.sort(key=lambda r: (not r["is_government"],
                            r["distance_km"] if r["distance_km"] is not None else math.inf,
                            r["name"]))
    return out[:limit]


@router.get("/facilities/{facility_id}/slots")
def facility_slots(
    facility_id: int,
    on: Date | None = Query(None, alias="date"),
    department: str | None = None,
    session: Session = Depends(get_session),
):
    facility = session.get(Facility, facility_id)
    if facility is None:
        raise HTTPException(404, "facility not found")
    if not facility.is_partner:
        raise HTTPException(404, "not a partner facility; booking is not available here")
    start, end = day_range(on or today_ist())
    start = max(start, datetime.now(IST))
    query = (select(Slot, Doctor).join(Doctor, Doctor.id == Slot.doctor_id)
             .where(Doctor.facility_id == facility_id, Slot.status == "open",
                    Slot.start >= start, Slot.start < end)
             .order_by(Slot.start))
    if department:
        query = query.where(Doctor.department.ilike(department))
    return [{"slot_id": s.id, "start": s.start, "end": s.end, "doctor_id": d.id,
             "doctor_name": d.name, "department": d.department}
            for s, d in session.execute(query)]

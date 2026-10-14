"""The one demo hospital.

Demo wiring (Hussain, 2026-10-15): patients and callers are shown the real nearest hospital by name, but every
booking, doctor and call log lands on a single partner facility with seeded doctors. That facility is the first
partner by id, so a second partner never changes where demo traffic goes unless the first is removed.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Facility


def demo_facility(session: Session) -> Facility | None:
    return session.scalars(select(Facility).where(Facility.is_partner.is_(True)).order_by(Facility.id)).first()

"""Tables the patient app added: medicine price data, family members, the Care plan and in-app notifications.

Kept apart from models.py so these can change without touching tables the helpline and Desk share.
Imported by main.py, which registers them on Base before init_db() creates the tables.
"""
from datetime import date, datetime

from sqlalchemy import ARRAY, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class BrandMedicine(Base):
    __tablename__ = "brand_medicine"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand: Mapped[str] = mapped_column(String(200), index=True)
    key: Mapped[list[str]] = mapped_column(ARRAY(String), index=True)  # sorted "salt strength", [] when not parsed
    form: Mapped[str | None] = mapped_column(String(30))
    manufacturer: Mapped[str | None] = mapped_column(String(200))
    pack: Mapped[str | None] = mapped_column(String(100))
    price: Mapped[float | None] = mapped_column(Numeric(10, 2))


class JanAushadhiItem(Base):
    __tablename__ = "janaushadhi_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    drug_code: Mapped[str | None] = mapped_column(String(20))
    generic_name: Mapped[str] = mapped_column(String(300))
    key: Mapped[list[str]] = mapped_column(ARRAY(String), index=True)
    form: Mapped[str | None] = mapped_column(String(30))
    pack: Mapped[str | None] = mapped_column(String(100))
    mrp: Mapped[float] = mapped_column(Numeric(10, 2))
    group_name: Mapped[str | None] = mapped_column(String(100))


class FamilyMember(Base):
    __tablename__ = "family_member"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_phone: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(20))
    relation: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CarePlan(Base):
    """One paid Care plan: `payer_phone` pays so `parent_phone` is upgraded and watched over. Demo payment."""
    __tablename__ = "care_plan"

    id: Mapped[int] = mapped_column(primary_key=True)
    payer_phone: Mapped[str] = mapped_column(String(20), index=True)
    parent_phone: Mapped[str] = mapped_column(String(20), index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    payment_id: Mapped[int | None] = mapped_column(ForeignKey("payment.id"))
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Notification(Base):
    __tablename__ = "app_notification"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    kind: Mapped[str] = mapped_column(String(20))  # care_plan / medicine_taken / appointment
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False)


class ReminderTaken(Base):
    """The patient tapped 'I took it' for one reminder time on one day."""
    __tablename__ = "reminder_taken"

    id: Mapped[int] = mapped_column(primary_key=True)
    reminder_id: Mapped[int] = mapped_column(ForeignKey("reminder.id"), index=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    at_time: Mapped[str] = mapped_column(String(5))  # "08:00"
    taken_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

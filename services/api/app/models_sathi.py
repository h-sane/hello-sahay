"""Database models for Sahay Sathi (Helper Application) and Hello Sahay customer service bookings.

Registers on Base before init_db() creates the tables in PostgreSQL.
"""
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Helper(Base):
    __tablename__ = "helper"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    gender: Mapped[str] = mapped_column(String(10), default="male")  # male / female / other
    email: Mapped[str | None] = mapped_column(String(200))
    profile_photo_url: Mapped[str | None] = mapped_column(String(500))

    # Address Breakdown
    house_no: Mapped[str | None] = mapped_column(String(100))
    street: Mapped[str | None] = mapped_column(String(200))
    area: Mapped[str | None] = mapped_column(String(200))
    city: Mapped[str | None] = mapped_column(String(100))
    district: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100), default="Tamil Nadu")
    pincode: Mapped[str | None] = mapped_column(String(20))

    # Government Identity Verification
    id_type: Mapped[str | None] = mapped_column(String(50))  # Aadhaar / Voter ID / PAN / Driving License
    id_number: Mapped[str | None] = mapped_column(String(100))
    id_document_url: Mapped[str | None] = mapped_column(String(500))
    id_status: Mapped[str] = mapped_column(String(30), default="pending")  # not_submitted / pending / verified / rejected

    # Skills & Description
    categories: Mapped[list[str]] = mapped_column(JSON, default=list)  # Personal Caretaker, House Cleaning, Technical Support
    description: Mapped[str | None] = mapped_column(Text)
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    experience_years: Mapped[int] = mapped_column(Integer, default=1)
    languages: Mapped[list[str]] = mapped_column(JSON, default=list)
    emergency_contact: Mapped[str | None] = mapped_column(String(100))
    password_hash: Mapped[str | None] = mapped_column(String(200))

    # Availability & Status
    is_online: Mapped[bool] = mapped_column(Boolean, default=True)
    working_days: Mapped[list[str]] = mapped_column(JSON, default=lambda: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
    working_hours_start: Mapped[str] = mapped_column(String(10), default="08:00")
    working_hours_end: Mapped[str] = mapped_column(String(10), default="18:00")
    unavailable_dates: Mapped[list[str]] = mapped_column(JSON, default=list)

    # Performance
    rating: Mapped[float] = mapped_column(Float, default=4.9)
    completed_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ServiceBooking(Base):
    __tablename__ = "service_booking"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_ref: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("patient.id"), index=True)
    helper_id: Mapped[int | None] = mapped_column(ForeignKey("helper.id"), index=True)

    service_category: Mapped[str] = mapped_column(String(100))
    service_title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)

    booking_date: Mapped[date] = mapped_column(Date, index=True)
    booking_time: Mapped[str] = mapped_column(String(50))  # e.g., "10:00 AM - 12:00 PM"
    location_address: Mapped[str] = mapped_column(Text)
    location_lat: Mapped[float | None] = mapped_column(Float)
    location_lng: Mapped[float | None] = mapped_column(Float)

    # Status: new_request, upcoming, in_progress, completed, cancelled, rejected
    status: Mapped[str] = mapped_column(String(30), default="new_request", index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending / completed
    payment_method: Mapped[str] = mapped_column(String(30), default="cash")  # cash / upi

    customer_notes: Mapped[str | None] = mapped_column(Text)
    helper_notes: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HelperNotification(Base):
    __tablename__ = "helper_notification"

    id: Mapped[int] = mapped_column(primary_key=True)
    helper_id: Mapped[int] = mapped_column(ForeignKey("helper.id"), index=True)
    kind: Mapped[str] = mapped_column(String(30))  # new_request, booking_accepted, reminder, completed, payment_update
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str | None] = mapped_column(Text)
    booking_id: Mapped[int | None] = mapped_column(Integer)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


"""Tables from docs/ARCHITECTURE.md section 4. Names match the doc exactly.

Additions beyond section 4: call.facility_id (so GET /calls?facility_id can
filter), call.callback_done, doctor.on_duty and desk_user (logins for Sahay Desk
and the Hello Sahay admin console).
"""
from datetime import date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    ARRAY,
    JSON,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Facility(Base):
    __tablename__ = "facility"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(20))  # PHC / CHC / GH / private
    address: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    phone: Mapped[str | None] = mapped_column(String(30))
    hours: Mapped[str | None] = mapped_column(String(200))
    departments: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    pmjay: Mapped[bool] = mapped_column(Boolean, default=False)
    cmchis: Mapped[bool] = mapped_column(Boolean, default=False)
    is_partner: Mapped[bool] = mapped_column(Boolean, default=False)
    plan: Mapped[str | None] = mapped_column(String(30))


class Doctor(Base):
    __tablename__ = "doctor"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facility.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    department: Mapped[str] = mapped_column(String(100))
    languages: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    on_duty: Mapped[bool] = mapped_column(Boolean, default=True)  # false: no new bookings (leave, day off)


class Slot(Base):
    __tablename__ = "slot"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctor.id"), index=True)
    start: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(10), default="open")  # open/booked/blocked


class Patient(Base):
    __tablename__ = "patient"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(200))
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    language: Mapped[str | None] = mapped_column(String(10))
    village: Mapped[str | None] = mapped_column(String(200))
    age: Mapped[int | None] = mapped_column(Integer)
    gender: Mapped[str | None] = mapped_column(String(10))  # female / male / other
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    family_phone: Mapped[str | None] = mapped_column(String(20))
    lat: Mapped[float | None] = mapped_column(Float)  # last live location pushed by the patient app
    lng: Mapped[float | None] = mapped_column(Float)
    location_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Appointment(Base):
    __tablename__ = "appointment"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient.id"), index=True)
    slot_id: Mapped[int] = mapped_column(ForeignKey("slot.id"), index=True)
    source: Mapped[str] = mapped_column(String(10))  # helpline / app / desk
    reason_text: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(12), default="booked")  # booked/arrived/completed/no_show/cancelled
    arrived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Demo wiring: the real hospital the patient chose or was told. The slot itself is at the demo hospital's Desk.
    hospital_label: Mapped[str | None] = mapped_column(String(200))


class Call(Base):
    __tablename__ = "call"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int | None] = mapped_column(ForeignKey("patient.id"))
    facility_id: Mapped[int | None] = mapped_column(ForeignKey("facility.id"), index=True)
    language: Mapped[str | None] = mapped_column(String(10))
    transcript: Mapped[list | dict | str | None] = mapped_column(JSON)
    summary: Mapped[str | None] = mapped_column(Text)
    outcome: Mapped[str | None] = mapped_column(String(20))  # booked/info_given/emergency/handed_off
    emergency: Mapped[bool] = mapped_column(Boolean, default=False)
    handoff: Mapped[bool] = mapped_column(Boolean, default=False)
    callback_done: Mapped[bool] = mapped_column(Boolean, default=False)  # a person rang the caller back
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    duration_s: Mapped[int | None] = mapped_column(Integer)
    trace: Mapped[list | None] = mapped_column(JSON)  # timestamped events from the voice service: what was heard, said, called and how long it took


class AdvisoryChunk(Base):
    __tablename__ = "advisory_chunk"

    id: Mapped[int] = mapped_column(primary_key=True)
    doc_id: Mapped[str] = mapped_column(String(100), index=True)
    text: Mapped[str] = mapped_column(Text)
    lang: Mapped[str] = mapped_column(String(10))
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1024))
    issuer: Mapped[str | None] = mapped_column(String(200))
    title: Mapped[str | None] = mapped_column(String(300))
    url: Mapped[str | None] = mapped_column(Text)
    published: Mapped[date | None] = mapped_column(Date)


class Medicine(Base):
    __tablename__ = "medicine"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand: Mapped[str] = mapped_column(String(200), index=True)
    salts: Mapped[list[str]] = mapped_column(ARRAY(String))  # normalized, sorted
    strength: Mapped[str | None] = mapped_column(String(100))
    form: Mapped[str | None] = mapped_column(String(50))
    manufacturer: Mapped[str | None] = mapped_column(String(200))
    source: Mapped[str | None] = mapped_column(Text)


class MedicinePrice(Base):
    __tablename__ = "medicine_price"

    id: Mapped[int] = mapped_column(primary_key=True)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicine.id"), index=True)
    mrp: Mapped[float] = mapped_column(Numeric(10, 2))
    pack: Mapped[str | None] = mapped_column(String(100))
    source: Mapped[str | None] = mapped_column(Text)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class JanAushadhiProduct(Base):
    __tablename__ = "jan_aushadhi_product"

    id: Mapped[int] = mapped_column(primary_key=True)
    generic_name: Mapped[str] = mapped_column(String(200))
    salts: Mapped[list[str]] = mapped_column(ARRAY(String))
    strength: Mapped[str | None] = mapped_column(String(100))
    form: Mapped[str | None] = mapped_column(String(50))
    mrp: Mapped[float | None] = mapped_column(Numeric(10, 2))
    source: Mapped[str | None] = mapped_column(Text)


class Reminder(Base):
    __tablename__ = "reminder"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient.id"), index=True)
    medicine_name: Mapped[str] = mapped_column(String(200))
    times: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)  # "08:00"
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class DoseLog(Base):
    __tablename__ = "dose_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    reminder_id: Mapped[int] = mapped_column(ForeignKey("reminder.id"), index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(10), default="missed")  # taken/missed/snoozed


class Payment(Base):
    __tablename__ = "payment"

    id: Mapped[int] = mapped_column(primary_key=True)
    payer_type: Mapped[str] = mapped_column(String(10))  # hospital / patient
    payer_id: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(20))  # subscription / arrival_fee / premium
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(15), default="created")
    razorpay_ref: Mapped[str | None] = mapped_column(String(100))


class DeskUser(Base):
    __tablename__ = "desk_user"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(20))  # admin (Hello Sahay team) / hospital_admin / receptionist / nurse / doctor
    name: Mapped[str | None] = mapped_column(String(200))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    facility_id: Mapped[int | None] = mapped_column(ForeignKey("facility.id"))
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("doctor.id"))  # set: the account sees only this doctor's appointments

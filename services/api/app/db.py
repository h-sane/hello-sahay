import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg2://sahay:sahay@localhost:5433/sahay"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_session():
    """FastAPI dependency: one session per request."""
    with SessionLocal() as session:
        yield session


def init_db() -> None:
    """Create the pgvector extension and every table. Safe to call repeatedly."""
    from . import models  # noqa: F401  (registers tables on Base.metadata)

    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(engine)
    with engine.begin() as conn:  # create_all never adds columns to a table that already exists
        for ddl in ("ALTER TABLE patient ADD COLUMN IF NOT EXISTS lat double precision",
                    "ALTER TABLE patient ADD COLUMN IF NOT EXISTS lng double precision",
                    "ALTER TABLE patient ADD COLUMN IF NOT EXISTS location_at timestamptz",
                    "ALTER TABLE desk_user ADD COLUMN IF NOT EXISTS doctor_id integer REFERENCES doctor(id)"):
            conn.execute(text(ddl))

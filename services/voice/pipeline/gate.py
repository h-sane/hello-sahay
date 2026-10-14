"""The safety gate lives in services/api (another agent owns it); import it, never copy it."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "api"))

from app.safety import REPLIES, check  # noqa: E402

__all__ = ["check", "REPLIES"]

import re
from datetime import date, datetime, time, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))


def today_ist() -> date:
    return datetime.now(IST).date()


def day_range(day: date) -> tuple[datetime, datetime]:
    """Start (inclusive) and end (exclusive) of an IST calendar day."""
    start = datetime.combine(day, time.min, tzinfo=IST)
    return start, start + timedelta(days=1)


def normalize_phone(raw: str) -> str:
    """'98765 43210', '09876543210' and '+919876543210' all become '+919876543210'."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        digits = "91" + digits
    elif len(digits) == 11 and digits.startswith("0"):
        digits = "91" + digits[1:]
    if not re.fullmatch(r"\d{11,15}", digits):
        raise ValueError("invalid phone number")
    return "+" + digits

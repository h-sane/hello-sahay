"""Razorpay Orders API. Test-mode keys (rzp_test_...) charge nothing; with no keys the Care plan uses the demo payment."""
import hashlib
import hmac
import os

import httpx

ORDERS_URL = "https://api.razorpay.com/v1/orders"


def enabled() -> bool:
    return bool(os.getenv("RAZORPAY_KEY_ID") and os.getenv("RAZORPAY_KEY_SECRET"))


def create_order(amount_rs: int, receipt: str) -> dict:
    res = httpx.post(ORDERS_URL, timeout=15, auth=(os.environ["RAZORPAY_KEY_ID"], os.environ["RAZORPAY_KEY_SECRET"]),
                     json={"amount": amount_rs * 100, "currency": "INR", "receipt": receipt})
    res.raise_for_status()
    return res.json()


def signature_ok(order_id: str, payment_id: str, signature: str) -> bool:
    expected = hmac.new(os.environ["RAZORPAY_KEY_SECRET"].encode(), f"{order_id}|{payment_id}".encode(),
                        hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

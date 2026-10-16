import hashlib
import hmac

from . import payments


def test_signature_checks_order_and_payment_ids(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_x")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "secret")
    good = hmac.new(b"secret", b"order_1|pay_1", hashlib.sha256).hexdigest()
    assert payments.enabled()
    assert payments.signature_ok("order_1", "pay_1", good)
    assert not payments.signature_ok("order_1", "pay_2", good)


def test_disabled_without_keys(monkeypatch):
    monkeypatch.delenv("RAZORPAY_KEY_ID", raising=False)
    assert not payments.enabled()


class FakeSession:
    def __init__(self, payment=None):
        self.payment, self.added = payment, []

    def add(self, row):
        self.added.append(row)

    def flush(self):
        for row in self.added:
            row.id = 7

    def scalar(self, _query):
        return self.payment


def test_care_pay_needs_a_valid_signature_when_keys_are_set(monkeypatch):
    import pytest
    from fastapi import HTTPException

    from .models import Patient, Payment
    from .routers.care import PayIn, _paid_payment

    patient = Patient(phone="+919000000001")
    patient.id = 3
    body = PayIn(parent_phone="9000000002")

    monkeypatch.delenv("RAZORPAY_KEY_ID", raising=False)
    demo = _paid_payment(FakeSession(), patient, body)
    assert demo.status == "paid" and demo.razorpay_ref == "DEMO-PAY-7"

    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_x")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "secret")
    with pytest.raises(HTTPException) as e:
        _paid_payment(FakeSession(), patient, body)
    assert e.value.status_code == 402

    sig = hmac.new(b"secret", b"order_1|pay_1", hashlib.sha256).hexdigest()
    proof = PayIn(parent_phone="9000000002", razorpay_order_id="order_1", razorpay_payment_id="pay_1", razorpay_signature=sig)
    row = Payment(payer_type="patient", payer_id=3, kind="premium", amount=149, status="created", razorpay_ref="order_1")
    assert _paid_payment(FakeSession(row), patient, proof).status == "paid" and row.razorpay_ref == "pay_1"
    with pytest.raises(HTTPException):
        _paid_payment(FakeSession(None), patient, proof)

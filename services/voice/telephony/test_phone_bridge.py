import audioop
import base64
import json

import pytest
from fastapi.testclient import TestClient

import phone_bridge
from phone_bridge import app

client = TestClient(app)


class FakeSession:
    """Records the audio it is fed and replies with one second of a known PCM tone."""
    made: list = []

    def __init__(self, lang, send_audio, send_event, in_rate=16000, out_rate=16000):
        self.lang, self.in_rate, self.out_rate, self.send_audio = lang, in_rate, out_rate, send_audio
        self.fed, self.closed, self.state = [], False, {}
        self._done = None
        FakeSession.made.append(self)

    def feed_audio(self, pcm):
        self.fed.append(pcm)

    async def run(self):
        import asyncio
        await self.send_audio(b"\x10\x20" * 8000)  # 1 s at 8 kHz
        await asyncio.sleep(3600)

    async def close(self):
        self.closed = True


@pytest.fixture(autouse=True)
def fake(monkeypatch):
    FakeSession.made = []
    monkeypatch.setattr(phone_bridge, "CallSession", FakeSession)


def test_incoming_returns_stream_twiml_with_language():
    r = client.post("/incoming?lang=hi", headers={"x-forwarded-host": "demo.example.com"}, data={"From": "+919876543210"})
    assert r.headers["content-type"].startswith("text/xml")
    assert ('<Stream url="wss://demo.example.com/media"><Parameter name="lang" value="hi"/>'
            '<Parameter name="from" value="+919876543210"/></Stream>') in r.text


def test_twilio_audio_is_decoded_for_the_session_and_replies_come_back_as_20ms_mulaw_frames():
    ulaw = audioop.lin2ulaw(b"\x05\x00" * 160, 2)
    with client.websocket_connect("/media") as ws:
        ws.send_text(json.dumps({"event": "start", "start": {"streamSid": "MZ1", "customParameters": {"lang": "ta"}}}))
        ws.send_text(json.dumps({"event": "media", "media": {"payload": base64.b64encode(ulaw).decode()}}))
        frames = [json.loads(ws.receive_text()) for _ in range(50)]  # 1 s = 50 frames
        ws.send_text(json.dumps({"event": "stop"}))
    s = FakeSession.made[0]
    assert (s.lang, s.in_rate, s.out_rate, s.closed) == ("ta", 8000, 8000, True)
    assert s.fed == [audioop.ulaw2lin(ulaw, 2)]
    assert all(f["streamSid"] == "MZ1" and len(base64.b64decode(f["media"]["payload"])) == 160 for f in frames)


def test_exotel_replies_are_padded_to_whole_100ms_frames_on_the_same_stream():
    chunk = b"\x01\x02" * 160
    with client.websocket_connect("/exotel?lang=hi") as ws:
        ws.send_text(json.dumps({"event": "start", "stream_sid": "EX1", "start": {}}))
        ws.send_text(json.dumps({"event": "media", "stream_sid": "EX1", "media": {"payload": base64.b64encode(chunk).decode()}}))
        frames = [json.loads(ws.receive_text()) for _ in range(5)]  # 16000 bytes = 5 x 3200
        ws.send_text(json.dumps({"event": "stop", "stream_sid": "EX1"}))
    s = FakeSession.made[0]
    assert s.lang == "hi" and s.fed == [chunk] and s.closed
    for f in frames:
        out = base64.b64decode(f["media"]["payload"])
        assert f["stream_sid"] == "EX1" and len(out) == 3200 and len(out) % 320 == 0
        assert set(f) == {"event", "stream_sid", "media"} and set(f["media"]) == {"payload"}  # Exotel parses fields as strings


def test_unknown_language_falls_back_to_english():
    with client.websocket_connect("/exotel?lang=xx") as ws:
        ws.send_text(json.dumps({"event": "start", "stream_sid": "E", "start": {}}))
        ws.send_text(json.dumps({"event": "stop"}))
    assert FakeSession.made[0].lang == "en"

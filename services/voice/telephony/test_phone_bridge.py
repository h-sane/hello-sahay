import audioop
import base64
import json
import math
import struct

from fastapi.testclient import TestClient

from phone_bridge import app

client = TestClient(app)


def _frame() -> bytes:
    # 20 ms of a 440 Hz tone at 8 kHz, as mu-law
    pcm = b"".join(struct.pack("<h", int(8000 * math.sin(2 * math.pi * 440 * i / 8000))) for i in range(160))
    return audioop.lin2ulaw(pcm, 2)


def test_incoming_returns_stream_twiml_for_forwarded_host():
    r = client.post("/incoming", headers={"x-forwarded-host": "demo.example.com"})
    assert r.headers["content-type"].startswith("text/xml")
    assert '<Connect><Stream url="wss://demo.example.com/media"/></Connect>' in r.text


def test_media_echoes_frames_back_on_the_same_stream():
    frame = _frame()
    with client.websocket_connect("/media") as ws:
        ws.send_text(json.dumps({"event": "connected"}))
        ws.send_text(json.dumps({"event": "start", "start": {"streamSid": "MZ123"}}))
        ws.send_text(json.dumps({"event": "media", "media": {"payload": base64.b64encode(frame).decode()}}))
        reply = json.loads(ws.receive_text())
        ws.send_text(json.dumps({"event": "stop"}))
    assert reply["event"] == "media" and reply["streamSid"] == "MZ123"
    assert base64.b64decode(reply["media"]["payload"]) == frame


def test_exotel_buffers_20ms_chunks_into_one_100ms_frame_on_the_same_stream():
    chunk = b"\x01\x02" * 160  # 320 bytes = 20 ms
    with client.websocket_connect("/exotel?sample-rate=8000") as ws:
        ws.send_text(json.dumps({"event": "connected"}))
        ws.send_text(json.dumps({"event": "start", "stream_sid": "EX1", "start": {}}))
        for i in range(10):
            ws.send_text(json.dumps({"event": "media", "stream_sid": "EX1", "media": {"payload": base64.b64encode(chunk).decode()}}))
        reply = json.loads(ws.receive_text())
        ws.send_text(json.dumps({"event": "stop", "stream_sid": "EX1"}))
    out = base64.b64decode(reply["media"]["payload"])
    assert reply["event"] == "media" and reply["stream_sid"] == "EX1"
    assert len(out) == 3200 and len(out) % 320 == 0 and out == chunk * 10

"""A synthetic phone caller for the Exotel bridge: speaks scripted sentences (Polly), listens, optionally adds line echo.

    AWS_PROFILE=personal-bedrock python scripts/sim_call.py --say "I have a fever" --say "Chengalpattu"
    python scripts/sim_call.py --echo 0.4 --say "I have a fever"      # the caller's line returns our voice 0.4 s late
    python scripts/sim_call.py --silent --say "..."                   # say nothing after the first prompt

Prints what the caller experienced: when the agent spoke and how long it stayed silent after each sentence.
"""
import argparse
import asyncio
import base64
import collections
import contextlib
import json
import sys
import time
from pathlib import Path

import websockets

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "voice"))
from pipeline import aws  # noqa: E402

RATE = 8000
FRAME = 320  # 20 ms of 8 kHz 16-bit mono
VOICES = {"en": ("Kajal", "en-IN"), "hi": ("Kajal", "hi-IN")}


def speech(text: str, lang: str) -> bytes:
    voice, code = VOICES[lang]
    return aws.client("polly").synthesize_speech(Text=text, VoiceId=voice, Engine="neural", OutputFormat="pcm",
                                                 SampleRate=str(RATE), LanguageCode=code)["AudioStream"].read()


def mix(a: bytes, b: bytes) -> bytes:
    import array
    x, y = array.array("h", a), array.array("h", b)
    return array.array("h", (max(-32768, min(32767, p + q)) for p, q in zip(x, y))).tobytes()


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--bridge", default="ws://localhost:8020/exotel")
    ap.add_argument("--phone", default="09361660147")
    ap.add_argument("--lang", default="en", choices=["en", "hi"], help="language the caller speaks")
    ap.add_argument("--say", action="append", default=[], help="one sentence per turn, in order")
    ap.add_argument("--echo", type=float, default=0.0, help="seconds of line echo of the agent's voice (0 = none)")
    ap.add_argument("--echo-gain", type=float, default=0.5)
    ap.add_argument("--reply-wait", type=float, default=25.0, help="how long to wait for the last agent answer")
    a = ap.parse_args()
    utterances = [speech(s, a.lang) for s in a.say]

    out_frames: collections.deque = collections.deque()  # (due time, 20 ms of echo)
    state = {"last_out": 0.0, "out_since": 0, "bursts": [], "burst_open": None}
    speech_q = bytearray()
    t0 = time.monotonic()
    log = lambda m: print(f"{time.monotonic() - t0:7.2f}s  {m}", flush=True)

    async with websockets.connect(a.bridge, open_timeout=15, max_size=None) as ws:
        await ws.send(json.dumps({"event": "connected"}))
        await ws.send(json.dumps({"event": "start", "stream_sid": "SIM", "start": {"stream_sid": "SIM", "from": a.phone}}))
        log(f"connected as {a.phone}")

        async def rx() -> None:
            async for m in ws:
                d = json.loads(m)
                if d.get("event") != "media":
                    continue
                now = time.monotonic()
                pcm = base64.b64decode(d["media"]["payload"])
                if state["burst_open"] is None:
                    state["burst_open"] = now
                    log("agent audio starts")
                state["last_out"], state["out_since"] = now, state["out_since"] + 1
                if a.echo:
                    for i in range(0, len(pcm), FRAME):
                        out_frames.append((now + a.echo + i / 2 / RATE, pcm[i:i + FRAME].ljust(FRAME, b"\0")))

        async def watch_ends() -> None:
            while True:
                await asyncio.sleep(0.1)
                b = state["burst_open"]
                if b is not None and time.monotonic() - state["last_out"] > 1.2:
                    state["bursts"].append((b - t0, state["last_out"] - t0))
                    state["burst_open"] = None
                    log(f"agent audio ends ({state['last_out'] - b:.1f} s)")

        tasks = [asyncio.create_task(rx()), asyncio.create_task(watch_ends())]
        pending = list(utterances)
        spoke_at = None
        deadline = t0 + a.reply_wait if not pending else None
        while True:
            now = time.monotonic()
            frame = bytes(FRAME)
            if speech_q:
                frame, speech_q = bytes(speech_q[:FRAME]).ljust(FRAME, b"\0"), speech_q[FRAME:]
                if not speech_q:
                    spoke_at = now
                    log("caller finished speaking")
            if out_frames and out_frames[0][0] <= now:
                _, e = out_frames.popleft()
                frame = _echo(frame, e, a.echo_gain)
            try:
                await ws.send(json.dumps({"event": "media", "stream_sid": "SIM",
                                          "media": {"payload": base64.b64encode(frame).decode()}}))
            except websockets.ConnectionClosed:
                log("the helpline hung up")
                break
            agent_quiet = state["burst_open"] is None and state["out_since"] > 0 and now - state["last_out"] > 1.5
            if pending and not speech_q and agent_quiet and now - t0 > 1:
                speech_q.extend(pending.pop(0) + bytes(FRAME * 10))
                state["out_since"] = 0
                log(f"caller speaks: {a.say[len(a.say) - len(pending) - 1]!r}")
            if not pending and not speech_q and deadline is None and spoke_at:
                deadline = now + a.reply_wait
            if deadline and now > deadline or now - t0 > 240:
                break
            await asyncio.sleep(FRAME / 2 / RATE - 0.001)
        with contextlib.suppress(websockets.ConnectionClosed):
            await ws.send(json.dumps({"event": "stop", "stream_sid": "SIM"}))
        for t in tasks:
            t.cancel()
    log("call ended")
    print("\nagent speech bursts (start, end):", [(round(s, 1), round(e, 1)) for s, e in state["bursts"]])


def _echo(frame: bytes, echo: bytes, gain: float) -> bytes:
    import array
    scaled = array.array("h", (int(v * gain) for v in array.array("h", echo))).tobytes()
    return mix(frame, scaled)


if __name__ == "__main__":
    asyncio.run(main())

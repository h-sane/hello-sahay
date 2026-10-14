"""Read the saved trace of a call and flag what went wrong.

    python scripts/call_trace.py latest                       # newest call on the local API
    python scripts/call_trace.py 41 --base https://13-127-85-246.sslip.io/api/v1
    python scripts/call_trace.py latest --raw                 # every event as JSON

Needs a Sahay Desk or admin login (defaults to the demo hospital admin). Only the standard library is used.
"""
import argparse
import json
import sys
import urllib.request

SLOW_TURN_S = 4.0  # caller-side wait from end of speech to first audio that counts as a pause
SLOW_STEP_MS = 3000


def fetch(url: str, token: str | None = None, body: dict | None = None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"content-type": "application/json", **({"authorization": f"Bearer {token}"} if token else {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def norm(text: str) -> str:
    return "".join(c for c in text.lower() if c.isalnum())


def findings(events: list[dict]) -> list[str]:
    out = []
    said = [(e["t"], e["text"]) for e in events if e["ev"] == "said"]
    for (t1, a), (t2, b) in zip(said, said[1:]):
        if norm(a) and norm(a) == norm(b):
            out.append(f"LOOP: the agent said the same thing at {t1:.1f}s and {t2:.1f}s: {b!r}")
    heard = [(e["t"], e["text"]) for e in events if e["ev"] == "stt_result" and e.get("final")]
    for (t1, a), (t2, b) in zip(heard, heard[1:]):
        if norm(a) and norm(a) == norm(b):
            out.append(f"LOOP: the same caller sentence was heard at {t1:.1f}s and {t2:.1f}s: {b!r}")
    spoken = [norm(t) for _, t in said if len(norm(t)) > 12]
    for e in events:
        if e["ev"] == "stt_result" and e.get("final") and len(norm(e["text"])) > 12:
            if any(norm(e["text"]) in s or s in norm(e["text"]) for s in spoken):
                out.append(f"ECHO: at {e['t']:.1f}s the transcriber heard the agent's own words: {e['text']!r}")
    loud = [e for e in events if e["ev"] == "audio_in" and e.get("muted_rms_max", 0) > 500]
    if loud:
        out.append(f"ECHO?: {len(loud)} of {sum(e['ev'] == 'audio_in' for e in events)} two-second windows carried sound "
                   f"(up to level {max(e['muted_rms_max'] for e in loud)}) while the agent was speaking: line echo, "
                   "or the caller talking over the agent")
    turns = {}
    for e in events:
        if e["ev"] == "turn_start":
            turns[round(e["t"], 3)] = e
    starts = sorted(turns)
    for i, s in enumerate(starts):
        nxt = starts[i + 1] if i + 1 < len(starts) else 1e9
        lat = next((e for e in events if e["ev"] == "latency" and s <= e["t"] < nxt + 60), None)
        if lat and lat.get("first_audio_ms", 0) / 1000 > SLOW_TURN_S:
            out.append(f"PAUSE: turn at {s:.1f}s was silent for {lat['first_audio_ms'] / 1000:.1f}s "
                       f"(model {lat.get('llm_ms', 0) / 1000:.1f}s)")
    for e in events:
        if e["ev"] in ("llm_round", "tool", "tts") and e.get("ms", 0) > SLOW_STEP_MS and not e.get("cached"):
            out.append(f"SLOW: {e['ev']} {e.get('name', '')} took {e['ms']} ms at {e['t']:.1f}s")
        if e["ev"] in ("error", "save_failed", "llm_retry", "llm_gave_up", "blocked_reply"):
            out.append(f"{e['ev'].upper()}: at {e['t']:.1f}s {({k: v for k, v in e.items() if k not in ('t', 'ev')})}")
    return out


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("call", help="call id or 'latest'")
    ap.add_argument("--base", default="http://localhost:8001/api/v1")
    ap.add_argument("--email", default="desk7@sahay.demo")
    ap.add_argument("--password", default="demo1234")
    ap.add_argument("--raw", action="store_true")
    a = ap.parse_args()
    token = fetch(f"{a.base}/auth/login", body={"email": a.email, "password": a.password})["token"]
    call_id = a.call
    if call_id == "latest":
        calls = fetch(f"{a.base}/calls?limit=1", token)
        if not calls:
            print("no calls saved yet")
            return 1
        call_id = calls[0]["id"]
    c = fetch(f"{a.base}/calls/{call_id}/trace", token)
    events = c["trace"]
    print(f"call {c['id']}  {c['started_at']}  {c['duration_s']} s  lang={c['language']}  outcome={c['outcome']}  "
          f"phone={c['patient_phone']}  events={len(events)}")
    if not events:
        print("this call has no trace (recorded before call logging existed)")
        return 0
    for e in events:
        if a.raw:
            print(json.dumps(e, ensure_ascii=False))
            continue
        rest = {k: v for k, v in e.items() if k not in ("t", "ev")}
        print(f"{e['t']:8.2f}s  {e['ev']:<14} {json.dumps(rest, ensure_ascii=False)[:230]}")
    print("\nFINDINGS")
    for line in findings(events) or ["none"]:
        print(" -", line)
    return 0


if __name__ == "__main__":
    sys.exit(main())

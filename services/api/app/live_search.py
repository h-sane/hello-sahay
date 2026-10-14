"""Live search of official Indian government websites, used when the local corpus has no answer.

Exa's public search endpoint finds pages and returns their text; this module keeps only pages whose
host is an official government site, so a private clinic, a news site or WHO can never be cited.
"""
import json
import os
import re
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx

EXA_URL = "https://mcp.exa.ai/mcp"
TIMEOUT_S = 15
MAX_PAGES = 5
MAX_EXCERPT = 1400

# Everything under gov.in and nic.in, plus Tamil Nadu's CMCHIS site which is official but a .com.
OFFICIAL_SUFFIXES = (".gov.in", ".nic.in")
OFFICIAL_HOSTS = {"gov.in", "nic.in", "cmchistn.com", "www.cmchistn.com", "chtn.cmchistn.com"}


@dataclass
class Page:
    url: str
    host: str
    title: str
    published: str | None
    text: str


def is_official(host: str | None) -> bool:
    host = (host or "").lower().rstrip(".")
    return host in OFFICIAL_HOSTS or host.endswith(OFFICIAL_SUFFIXES)


def parse(raw: str) -> list[Page]:
    """Exa returns blocks of 'Title: / URL: / Published: / Author: / Highlights:' separated by '---'."""
    pages = []
    for block in re.split(r"\n---+\n", raw):
        url = re.search(r"^URL:\s*(\S+)", block, re.M)
        if not url:
            continue
        host = urlparse(url.group(1)).hostname
        if urlparse(url.group(1)).scheme not in ("http", "https") or not is_official(host):
            continue
        title = re.search(r"^Title:\s*(.+)$", block, re.M)
        published = re.search(r"^Published:\s*(\S+)", block, re.M)
        body = re.split(r"^(?:Highlights|Text):\s*$", block, maxsplit=1, flags=re.M)
        text = re.sub(r"\s+", " ", body[1] if len(body) == 2 else "").strip()[:MAX_EXCERPT]
        if text:
            pub = published.group(1) if published and published.group(1) != "N/A" else None
            pages.append(Page(url.group(1), host, title.group(1).strip() if title else host, pub, text))
    return pages[:MAX_PAGES]


def search(question: str) -> list[Page]:
    """Official government pages relevant to the question, most relevant first. Raises on network errors."""
    url = EXA_URL + (f"?exaApiKey={os.environ['EXA_API_KEY']}" if os.environ.get("EXA_API_KEY") else "")
    body = {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "web_search_exa", "arguments": {
        "query": f"{question} site:gov.in OR site:nic.in",
        "objective": ("An official Indian government web page (gov.in or nic.in, health ministry or state health "
                      f"department) that answers: {question}. Exclude WHO, Wikipedia, news and private hospitals."),
        "numResults": 10,
    }}}
    res = httpx.post(url, json=body, timeout=TIMEOUT_S,
                     headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream"})
    res.raise_for_status()
    text = res.text
    if "data:" in text:  # server-sent-events framing
        text = [ln[5:].strip() for ln in text.splitlines() if ln.startswith("data:")][-1]
    content = json.loads(text)["result"]["content"]
    return parse("\n---\n".join(c.get("text", "") for c in content))

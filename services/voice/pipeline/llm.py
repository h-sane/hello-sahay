"""Bedrock Converse with tools (Nova). One call may loop through several tool rounds."""
import asyncio
import re

from . import aws, config
from .tools import TOOL_SPECS, Tools

MAX_ROUNDS = 6
FALLBACK = {"en": "Sorry, I am having trouble. Please say that again.",
            "hi": "माफ़ कीजिए, कुछ गड़बड़ हो गई। कृपया फिर से कहें।",
            "ta": "மன்னிக்கவும், ஒரு சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் சொல்லுங்கள்."}


def _converse(system: str, messages: list) -> dict:
    return aws.client("bedrock-runtime").converse(
        modelId=config.LLM_MODEL, system=[{"text": system}], messages=messages,
        toolConfig={"tools": TOOL_SPECS}, inferenceConfig={"maxTokens": 400, "temperature": 0.2})


async def run_agent(system: str, messages: list, tools: Tools) -> str:
    """Appends the assistant and tool turns to `messages` and returns the text to speak."""
    for _ in range(MAX_ROUNDS):
        msg = (await asyncio.to_thread(_converse, system, messages))["output"]["message"]
        messages.append(msg)
        uses = [b["toolUse"] for b in msg["content"] if "toolUse" in b]
        if not uses:
            text = " ".join(b["text"] for b in msg["content"] if "text" in b)
            return re.sub(r"<thinking>.*?</thinking>", "", text, flags=re.S).strip()
        results = [{"toolResult": {"toolUseId": u["toolUseId"],
                                   "content": [{"json": await tools.call(u["name"], u["input"])}]}} for u in uses]
        messages.append({"role": "user", "content": results})
    return FALLBACK[tools.lang]

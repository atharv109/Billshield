import json
from typing import Any

from agents.safe import safe_agent_call

FALLBACK = {
    "document_type": "unknown",
    "confidence": 0.0,
    "notes": "stub",
}
PROMPT = "Classify healthcare document. JSON only."


async def _stub(_p: str, _c: str) -> str:
    return json.dumps(FALLBACK)


async def classify(doc: dict[str, Any]) -> dict[str, Any]:
    text = doc.get("raw_text") or ""
    if doc.get("kind") == "image":
        text = f"[image:{doc.get('mime')}]"
    out = await safe_agent_call(PROMPT, text[:12000], dict(FALLBACK), _stub)
    return out if isinstance(out, dict) else dict(FALLBACK)

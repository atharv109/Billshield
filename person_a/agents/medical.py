import json
from typing import Any

from agents.safe import safe_agent_call

FALLBACK = {
    "conditions": [],
    "procedures": [],
    "visit_summary": "",
    "medications_noted": [],
}
PROMPT = "Extract only stated clinical facts. JSON only."


async def _stub(_p: str, _c: str) -> str:
    return json.dumps(FALLBACK)


async def run_medical_agent(docs: list[dict[str, Any]]) -> dict[str, Any]:
    chunks = [(d.get("raw_text") or "")[:8000] for d in docs]
    body = "\n\n---\n\n".join(c for c in chunks if c) or "none"
    out = await safe_agent_call(PROMPT, body, dict(FALLBACK), _stub)
    return out if isinstance(out, dict) else dict(FALLBACK)

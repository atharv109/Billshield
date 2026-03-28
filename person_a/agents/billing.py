import json
from typing import Any

from agents.safe import safe_agent_call

FALLBACK: dict[str, Any] = {
    "summary": {
        "total_billed": 0.0,
        "insurer_paid": 0.0,
        "patient_owes": 0.0,
        "due_date": "",
        "provider": "",
    },
    "flags": [],
}
PROMPT = "Analyze billing. JSON only."


async def _stub(_p: str, _c: str) -> str:
    return json.dumps(FALLBACK)


async def run_billing_agent(docs: list[dict[str, Any]]) -> dict[str, Any]:
    chunks = [(d.get("raw_text") or "")[:8000] for d in docs]
    body = "\n\n---\n\n".join(c for c in chunks if c) or "{}"
    out = await safe_agent_call(PROMPT, body, dict(FALLBACK), _stub)
    return out if isinstance(out, dict) else dict(FALLBACK)

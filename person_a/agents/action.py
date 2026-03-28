import json
from typing import Any

from agents.safe import safe_agent_call

FALLBACK: dict[str, Any] = {"actions": [], "doctor_suggestions": [], "narrative": ""}
PROMPT = "Synthesize actions. JSON only."


async def _stub(_p: str, _c: str) -> str:
    return json.dumps(FALLBACK)


async def run_action_agent(bundle: dict[str, Any]) -> dict[str, Any]:
    content = json.dumps(bundle, default=str)[:24000]
    out = await safe_agent_call(PROMPT, content, dict(FALLBACK), _stub)
    return out if isinstance(out, dict) else dict(FALLBACK)

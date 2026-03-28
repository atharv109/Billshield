import json
from pathlib import Path
from typing import Any

from agents.safe import safe_agent_call
from core import database as db

FALLBACK = {
    "merged_conditions": [],
    "total_billed_lifetime": 0.0,
    "past_flag_types": [],
    "recurring_conditions": [],
}
PROMPT = "Merge patient history. JSON only."


async def _stub(_p: str, _c: str) -> str:
    return json.dumps(FALLBACK)


async def run_history_agent(db_path: Path, patient_id: str) -> dict[str, Any]:
    analyses = await db.list_analyses_for_patient(db_path, patient_id)
    docs = await db.get_documents_for_patient(db_path, patient_id)
    payload = json.dumps(
        {"analyses": len(analyses), "documents": len(docs)},
        default=str,
    )[:12000]
    out = await safe_agent_call(PROMPT, payload, dict(FALLBACK), _stub)
    return out if isinstance(out, dict) else dict(FALLBACK)


def merge_patient_profile(
    existing: dict[str, Any] | None,
    analysis_result: dict[str, Any],
) -> dict[str, Any]:
    profile = dict(existing or {})
    med = analysis_result.get("medical") or {}
    new_conds = list(med.get("conditions") or [])
    merged = list(profile.get("merged_conditions") or [])
    seen = {c.strip().lower() for c in merged}
    recurring: list[str] = list(profile.get("recurring_conditions") or [])

    for c in new_conds:
        key = c.strip().lower()
        if key in seen:
            if c not in recurring:
                recurring.append(c)
            continue
        seen.add(key)
        merged.append(c)

    summ = analysis_result.get("summary") or {}
    prev = float(profile.get("total_billed_across_visits") or 0.0)
    visit = float(summ.get("total_billed") or 0.0)
    profile["merged_conditions"] = merged
    profile["total_billed_across_visits"] = prev + visit
    profile["recurring_conditions"] = recurring

    past: list[str] = list(profile.get("past_flag_types") or [])
    for f in analysis_result.get("flags") or []:
        if isinstance(f, dict):
            t = f.get("type")
            if isinstance(t, str) and t not in past:
                past.append(t)
    profile["past_flag_types"] = past
    profile["last_analysis_summary"] = summ
    return profile

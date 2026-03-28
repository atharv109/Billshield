import asyncio
import uuid
from pathlib import Path
from typing import Any

from agents.action import run_action_agent
from agents.billing import run_billing_agent
from agents.classifier import classify
from agents.history import merge_patient_profile, run_history_agent
from agents.medical import run_medical_agent
from core import database as db


def _summary_from_billing(billing: dict[str, Any]) -> dict[str, Any]:
    s = billing.get("summary")
    return s if isinstance(s, dict) else {}


async def orchestrate(
    docs: list[dict[str, Any]],
    patient_id: str,
    db_path: Path,
) -> dict[str, Any]:
    classifications = await asyncio.gather(*[classify(d) for d in docs])
    billing, medical, history_ctx = await asyncio.gather(
        run_billing_agent(docs),
        run_medical_agent(docs),
        run_history_agent(db_path, patient_id),
    )
    action_out = await run_action_agent(
        {
            "classifications": list(classifications),
            "billing": billing,
            "medical": medical,
            "history": history_ctx,
        }
    )

    summary = _summary_from_billing(billing if isinstance(billing, dict) else {})
    flags = billing.get("flags") if isinstance(billing, dict) else []
    if not isinstance(flags, list):
        flags = []

    actions = action_out.get("actions") if isinstance(action_out, dict) else []
    suggestions = (
        action_out.get("doctor_suggestions") if isinstance(action_out, dict) else []
    )
    if not isinstance(actions, list):
        actions = []
    if not isinstance(suggestions, list):
        suggestions = []

    med = medical if isinstance(medical, dict) else {}
    result: dict[str, Any] = {
        "analysis_id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "summary": summary,
        "flags": flags,
        "medical": {
            "conditions": med.get("conditions") or [],
            "procedures": med.get("procedures") or [],
            "visit_summary": med.get("visit_summary") or "",
            "medications_noted": med.get("medications_noted") or [],
        },
        "doctor_suggestions": suggestions,
        "actions": actions,
        "classifications": list(classifications),
        "history_context": history_ctx,
    }

    row = await db.get_patient_row(db_path, patient_id)
    prev = row.get("profile") if row else None
    profile = merge_patient_profile(prev, result)
    await db.update_patient_profile(db_path, patient_id, profile)
    result["patient_profile"] = profile

    return result

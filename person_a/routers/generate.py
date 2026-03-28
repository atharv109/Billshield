from typing import Any

from fastapi import APIRouter, HTTPException, Request

from core.database import get_analysis
from models.schemas import GenerateRequest

router = APIRouter(tags=["generate"])


@router.post("/generate")
async def generate(request: Request, body: GenerateRequest, demo: bool = False) -> dict[str, Any]:
    if demo and getattr(request.app.state, "demo_cache", None):
        g = request.app.state.demo_cache.get("generate")
        full = request.app.state.demo_cache.get("analyze")
        if isinstance(g, dict) and isinstance(full, dict):
            return {
                "analysis_id": body.analysis_id,
                "letters_packet": g,
                "actions": full.get("actions") or [],
            }
        if isinstance(g, dict):
            return g

    row = await get_analysis(request.app.state.db_path, body.analysis_id)
    if not row:
        raise HTTPException(status_code=404, detail="analysis not found")
    result = row.get("result") or {}
    actions = result.get("actions") or []
    letters = [a for a in actions if isinstance(a, dict) and a.get("type") == "letter"]
    calls = [a for a in actions if isinstance(a, dict) and a.get("type") == "call"]
    checklists = [a for a in actions if isinstance(a, dict) and a.get("type") == "checklist"]
    return {
        "analysis_id": body.analysis_id,
        "letters": letters,
        "call_scripts": calls,
        "checklists": checklists,
        "raw_actions": actions,
    }

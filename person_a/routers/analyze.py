from typing import Any

from fastapi import APIRouter, HTTPException, Request

from agents.orchestrator import orchestrate
from core.database import ensure_patient, get_document, insert_analysis
from models.schemas import AnalyzeRequest

router = APIRouter(tags=["analyze"])


def _doc_for_agents(stored: dict[str, Any]) -> dict[str, Any]:
    extracted = stored.get("extracted") or {}
    inner = extracted.get("extract") or {}
    text = inner.get("raw_text") or stored.get("raw_text") or ""
    kind = inner.get("kind") or extracted.get("kind")
    return {"raw_text": text, "kind": kind, "normalized": extracted.get("normalized")}


@router.post("/analyze")
async def analyze(request: Request, body: AnalyzeRequest, demo: bool = False) -> dict[str, Any]:
    if demo and getattr(request.app.state, "demo_cache", None):
        cached = request.app.state.demo_cache.get("analyze")
        if isinstance(cached, dict):
            return cached

    await ensure_patient(request.app.state.db_path, body.patient_id)
    docs: list[dict[str, Any]] = []
    for did in body.document_ids:
        row = await get_document(request.app.state.db_path, did)
        if not row:
            raise HTTPException(status_code=404, detail=f"document not found: {did}")
        docs.append(_doc_for_agents(row))

    result = await orchestrate(docs, body.patient_id, request.app.state.db_path)
    await insert_analysis(
        request.app.state.db_path,
        result["analysis_id"],
        body.patient_id,
        result,
    )
    return result

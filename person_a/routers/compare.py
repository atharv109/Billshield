from fastapi import APIRouter, HTTPException, Request

from core.database import get_document
from models.schemas import CompareRequest

router = APIRouter(tags=["compare"])


def _norm(row: dict) -> dict:
    ext = row.get("extracted") or {}
    n = ext.get("normalized")
    return n if isinstance(n, dict) else {}


@router.post("/compare")
async def compare(request: Request, body: CompareRequest, demo: bool = False) -> dict:
    if demo and getattr(request.app.state, "demo_cache", None):
        c = request.app.state.demo_cache.get("compare")
        if isinstance(c, dict):
            return c

    bill = await get_document(request.app.state.db_path, body.bill_id)
    eob = await get_document(request.app.state.db_path, body.eob_id)
    if not bill or not eob:
        raise HTTPException(status_code=404, detail="bill_id or eob_id not found")
    bn, en = _norm(bill), _norm(eob)
    overlap = sorted(set(bn.get("cpt_codes") or []) & set(en.get("cpt_codes") or []))
    return {
        "bill_id": body.bill_id,
        "eob_id": body.eob_id,
        "bill_cpt_codes": bn.get("cpt_codes") or [],
        "eob_cpt_codes": en.get("cpt_codes") or [],
        "cpt_overlap": overlap,
        "bill_amounts_sample": (bn.get("amounts") or [])[:20],
        "eob_is_eob": bool(en.get("is_eob")),
    }

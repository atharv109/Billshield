from fastapi import APIRouter, HTTPException, Request

from core import database as db

router = APIRouter(tags=["history"])


@router.get("/history/{patient_id}")
async def history(patient_id: str, request: Request, demo: bool = False) -> dict:
    if demo and getattr(request.app.state, "demo_cache", None):
        h = request.app.state.demo_cache.get("history")
        if isinstance(h, dict):
            return h

    row = await db.get_patient_row(request.app.state.db_path, patient_id)
    if not row:
        raise HTTPException(status_code=404, detail="patient not found")

    documents = await db.get_documents_for_patient(request.app.state.db_path, patient_id)
    analyses = await db.list_analyses_for_patient(request.app.state.db_path, patient_id)
    return {
        "patient": {
            "id": row["id"],
            "created_at": row.get("created_at"),
            "profile": row.get("profile"),
        },
        "documents": [
            {"id": d["id"], "type": d.get("type"), "uploaded_at": d.get("uploaded_at")}
            for d in documents
        ],
        "analyses": [
            {
                "id": a["id"],
                "created_at": a.get("created_at"),
                "summary": (a.get("result") or {}).get("summary"),
            }
            for a in analyses
        ],
    }

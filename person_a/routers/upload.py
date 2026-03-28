import uuid
from typing import Annotated, Any

from fastapi import APIRouter, File, Form, Request, UploadFile

from core.database import insert_document
from core.extractor import extract
from core.normalizer import BillNormalizer
from models.schemas import UploadResponse

router = APIRouter(tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    request: Request,
    file: Annotated[UploadFile, File()],
    patient_id: Annotated[str, Form()] = "demo-patient",
    demo: bool = False,
) -> UploadResponse:
    if demo and getattr(request.app.state, "demo_cache", None):
        u = request.app.state.demo_cache.get("upload")
        if isinstance(u, dict) and u.get("doc_id"):
            norm = u.get("normalized") or {}
            return UploadResponse(
                doc_id=str(u["doc_id"]),
                patient_id=str(u.get("patient_id", patient_id)),
                extracted_text=str(u.get("extracted_text_preview", "")),
                normalized=norm if isinstance(norm, dict) else {},
                kind="demo",
            )

    raw = await file.read()
    name = file.filename or "upload"
    extracted = extract(raw, name)
    text = extracted.get("raw_text") or ""
    norm: dict[str, Any] = BillNormalizer().normalize(text) if text else {}
    if extracted.get("kind") == "image":
        norm["image_base64_prefix"] = (extracted.get("base64") or "")[:80]

    doc_id = str(uuid.uuid4())
    payload = {"extract": extracted, "normalized": norm}
    await insert_document(
        request.app.state.db_path,
        doc_id,
        patient_id,
        str(extracted.get("kind")),
        text or None,
        payload,
    )
    return UploadResponse(
        doc_id=doc_id,
        patient_id=patient_id,
        extracted_text=text[:200000],
        normalized=norm,
        kind=str(extracted.get("kind", "unknown")),
    )

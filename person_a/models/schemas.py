from typing import Any

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    doc_id: str
    patient_id: str
    extracted_text: str
    normalized: dict[str, Any]
    kind: str


class AnalyzeRequest(BaseModel):
    patient_id: str
    document_ids: list[str] = Field(min_length=1)


class CompareRequest(BaseModel):
    patient_id: str | None = None
    bill_id: str
    eob_id: str


class GenerateRequest(BaseModel):
    analysis_id: str

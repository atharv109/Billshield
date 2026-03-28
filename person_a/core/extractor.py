import base64
import io
from pathlib import Path
from typing import Any

import pdfplumber


def _guess_image_mime(filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    if lower.endswith(".webp"):
        return "image/webp"
    if lower.endswith(".gif"):
        return "image/gif"
    return "application/octet-stream"


def extract(content: bytes, filename: str) -> dict[str, Any]:
    """PDF → text/tables via pdfplumber; images → base64; else UTF-8 text."""
    name = filename or "upload"
    suffix = Path(name.lower()).suffix

    if suffix == ".pdf":
        parts: list[str] = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                txt = page.extract_text()
                if txt:
                    parts.append(txt)
                for table in page.extract_tables() or []:
                    for row in table or []:
                        if row:
                            parts.append(
                                "\t".join(
                                    str(c) if c is not None else "" for c in row
                                )
                            )
        raw_text = "\n\n".join(parts)
        return {"kind": "pdf", "raw_text": raw_text, "filename": name}

    if suffix in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
        return {
            "kind": "image",
            "base64": base64.b64encode(content).decode("ascii"),
            "mime": _guess_image_mime(name),
            "filename": name,
            "raw_text": "",
        }

    raw_text = content.decode("utf-8", errors="replace")
    return {"kind": "text", "raw_text": raw_text, "filename": name}

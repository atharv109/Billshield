import re
from typing import Any


class BillNormalizer:
    CPT = re.compile(r"\b\d{5}\b")
    DOLLAR = re.compile(r"\$[\d,]+\.?\d*")
    DATE = re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b")

    def normalize(self, text: str) -> dict[str, Any]:
        return {
            "cpt_codes": self.CPT.findall(text),
            "amounts": self.extract_amounts(text),
            "dates": self.DATE.findall(text),
            "is_eob": self.detect_eob(text),
            "has_denial": "denied" in text.lower(),
            "has_out_of_network": "out-of-network" in text.lower()
            or "out of network" in text.lower(),
            "raw": text,
        }

    def extract_amounts(self, text: str) -> list[float]:
        out: list[float] = []
        for a in self.DOLLAR.findall(text):
            try:
                out.append(float(a.replace("$", "").replace(",", "")))
            except ValueError:
                continue
        return out

    def detect_eob(self, text: str) -> bool:
        t = text.lower()
        markers = [
            "explanation of benefits",
            "eob",
            "allowed amount",
            "member responsibility",
        ]
        return any(m in t for m in markers)

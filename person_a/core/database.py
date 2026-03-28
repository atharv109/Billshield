import json
import sqlite3
from pathlib import Path
from typing import Any

import aiosqlite

SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    profile_json TEXT
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    type TEXT,
    raw_text TEXT,
    extracted_json TEXT NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
"""


def _db_uri(path: Path) -> str:
    return str(path.resolve())


async def init_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        await db.executescript(SCHEMA)
        await db.commit()


async def ensure_patient(db_path: Path, patient_id: str) -> None:
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        await db.execute(
            "INSERT OR IGNORE INTO patients (id) VALUES (?)",
            (patient_id,),
        )
        await db.commit()


async def insert_document(
    db_path: Path,
    doc_id: str,
    patient_id: str,
    doc_type: str | None,
    raw_text: str | None,
    extracted: dict[str, Any],
) -> None:
    await ensure_patient(db_path, patient_id)
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        await db.execute(
            """INSERT INTO documents (id, patient_id, type, raw_text, extracted_json)
               VALUES (?, ?, ?, ?, ?)""",
            (doc_id, patient_id, doc_type, raw_text, json.dumps(extracted)),
        )
        await db.commit()


async def get_document(db_path: Path, doc_id: str) -> dict[str, Any] | None:
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT id, patient_id, type, raw_text, extracted_json, uploaded_at FROM documents WHERE id = ?",
            (doc_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["extracted"] = json.loads(d.pop("extracted_json"))
        return d


async def get_documents_for_patient(db_path: Path, patient_id: str) -> list[dict[str, Any]]:
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT id, patient_id, type, raw_text, extracted_json, uploaded_at FROM documents WHERE patient_id = ? ORDER BY uploaded_at",
            (patient_id,),
        )
        out: list[dict[str, Any]] = []
        for row in await cur.fetchall():
            d = dict(row)
            d["extracted"] = json.loads(d.pop("extracted_json"))
            out.append(d)
        return out


async def insert_analysis(
    db_path: Path,
    analysis_id: str,
    patient_id: str,
    result: dict[str, Any],
) -> None:
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        await db.execute(
            "INSERT INTO analyses (id, patient_id, result_json) VALUES (?, ?, ?)",
            (analysis_id, patient_id, json.dumps(result)),
        )
        await db.commit()


async def get_analysis(db_path: Path, analysis_id: str) -> dict[str, Any] | None:
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT id, patient_id, result_json, created_at FROM analyses WHERE id = ?",
            (analysis_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["result"] = json.loads(d.pop("result_json"))
        return d


async def list_analyses_for_patient(db_path: Path, patient_id: str) -> list[dict[str, Any]]:
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT id, patient_id, result_json, created_at FROM analyses WHERE patient_id = ? ORDER BY created_at",
            (patient_id,),
        )
        out: list[dict[str, Any]] = []
        for row in await cur.fetchall():
            d = dict(row)
            d["result"] = json.loads(d.pop("result_json"))
            out.append(d)
        return out


async def update_patient_profile(
    db_path: Path,
    patient_id: str,
    profile: dict[str, Any],
) -> None:
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        await db.execute(
            "UPDATE patients SET profile_json = ? WHERE id = ?",
            (json.dumps(profile), patient_id),
        )
        await db.commit()


async def get_patient_row(db_path: Path, patient_id: str) -> dict[str, Any] | None:
    async with aiosqlite.connect(_db_uri(db_path)) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        row = await cur.fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("profile_json"):
            d["profile"] = json.loads(d["profile_json"])
        else:
            d["profile"] = None
        return d


def sync_init(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()

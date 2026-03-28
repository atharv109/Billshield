import json
import logging
import os
import time
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from pathlib import Path

import aiosqlite
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from core.database import init_db
from routers import analyze, compare, generate, history, upload

BACKEND_ROOT = Path(__file__).resolve().parent
LOG_DIR = BACKEND_ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

_req = logging.getLogger("billshield.requests")
_req.setLevel(logging.INFO)
if not _req.handlers:
    _h = RotatingFileHandler(
        LOG_DIR / "requests.log",
        maxBytes=2_000_000,
        backupCount=3,
        encoding="utf-8",
    )
    _h.setFormatter(logging.Formatter("%(asctime)s\t%(message)s"))
    _req.addHandler(_h)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_path = Path(
        os.environ.get("BILLSHIELD_DB", str(BACKEND_ROOT / "data" / "billshield.db"))
    )
    await init_db(db_path)
    app.state.db_path = db_path

    cache = Path(
        os.environ.get(
            "BILLSHIELD_DEMO_CACHE",
            str(BACKEND_ROOT / "cache" / "demo_responses.json"),
        )
    )
    app.state.demo_cache = (
        json.loads(cache.read_text(encoding="utf-8")) if cache.is_file() else {}
    )
    yield


app = FastAPI(title="BillShield API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    _req.info("%s %s %s %.1fms", request.method, request.url.path, response.status_code, ms)
    return response


@app.get("/")
async def root():
    return {
        "service": "billshield",
        "docs": "/docs",
        "health": "/health",
        "openapi": "/openapi.json",
    }


@app.get("/health")
async def health(request: Request):
    database = "ok"
    db_path = getattr(request.app.state, "db_path", None)
    if db_path is None:
        database = "unconfigured"
    else:
        try:
            async with aiosqlite.connect(str(db_path)) as db:
                await db.execute("SELECT 1")
        except Exception:
            database = "error"
    return {
        "status": "ok",
        "service": "billshield",
        "database": database,
    }


app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(compare.router)
app.include_router(generate.router)
app.include_router(history.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        reload=os.environ.get("BILLSHIELD_RELOAD", "1") == "1",
    )

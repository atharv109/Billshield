# BillShield — Person A (API)

FastAPI service for uploads, analysis orchestration, and patient history.

## Setup (Hour 0–1)

Requires **Python 3.10+** (3.11+ recommended for the team).

```bash
cd person_a
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## Run

- **Dev (auto-reload):** `python main.py` or `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health:** `GET /health`
- **Demo JSON:** add `?demo=true` to supported routes when using `cache/demo_responses.json`

Optional env vars: see `.env.example`.

## Layout

`main.py`, `routers/`, `agents/`, `core/`, `models/`, `cache/demo_responses.json`

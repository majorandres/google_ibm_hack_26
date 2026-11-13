from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import granite
from app.config import get_settings

app = FastAPI(title="Commute Check API")


@app.get("/api/health")
def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "watsonx_configured": settings.watsonx_configured,
        "model": settings.watsonx_model_id,
    }


class AskRequest(BaseModel):
    prompt: str


@app.post("/api/granite/ask")
def granite_ask(body: AskRequest) -> dict:
    """Smoke test for the Granite connection. Replace with real endpoints."""
    try:
        return {"answer": granite.chat(body.prompt)}
    except granite.GraniteNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


# In the container the built frontend is copied to ./static and served from "/".
# In local dev this directory does not exist and Vite serves the frontend instead.
_static = Path(__file__).resolve().parents[1] / "static"
if _static.is_dir():
    app.mount("/", StaticFiles(directory=_static, html=True), name="static")

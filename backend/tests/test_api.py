from fastapi.testclient import TestClient

from app import granite
from app.config import Settings
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_granite_ask_returns_503_when_not_configured(monkeypatch):
    unconfigured = Settings(_env_file=None, ibmcloud_api_key="", watsonx_project_id="")
    monkeypatch.setattr(granite, "get_settings", lambda: unconfigured)
    granite._model.cache_clear()

    response = client.post("/api/granite/ask", json={"prompt": "hi"})

    assert response.status_code == 503

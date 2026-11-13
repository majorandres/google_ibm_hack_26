"""Thin wrapper around IBM Granite on watsonx.ai."""

from functools import lru_cache

from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

from app.config import get_settings


class GraniteNotConfigured(RuntimeError):
    pass


@lru_cache
def _model() -> ModelInference:
    settings = get_settings()
    if not settings.watsonx_configured:
        raise GraniteNotConfigured(
            "Set IBMCLOUD_API_KEY and WATSONX_PROJECT_ID (see .env.example)."
        )
    return ModelInference(
        model_id=settings.watsonx_model_id,
        credentials=Credentials(
            url=settings.watsonx_url, api_key=settings.ibmcloud_api_key
        ),
        project_id=settings.watsonx_project_id,
    )


def chat(prompt: str, system: str | None = None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    response = _model().chat(messages=messages)
    return response["choices"][0]["message"]["content"]

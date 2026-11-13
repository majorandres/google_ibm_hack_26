"""IBM Watson Speech to Text over its REST API (no SDK needed for one call)."""

import httpx

from app.config import get_settings


class SpeechNotConfigured(RuntimeError):
    pass


async def transcribe(audio: bytes, content_type: str) -> str:
    settings = get_settings()
    if not settings.stt_configured:
        raise SpeechNotConfigured("Set STT_URL (see .env.example).")
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{settings.stt_url.rstrip('/')}/v1/recognize",
            content=audio,
            headers={"Content-Type": content_type},
            auth=("apikey", settings.stt_api_key or settings.ibmcloud_api_key),
        )
    response.raise_for_status()
    return " ".join(
        r["alternatives"][0]["transcript"].strip() for r in response.json()["results"]
    )

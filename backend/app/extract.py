"""Granite turns a rider's spoken description into a structured incident."""

from pydantic import ValidationError

from app import granite, seed
from app.models import Extraction

PROMPT = """You extract paratransit ride incidents from a rider's spoken description.
Return ONLY valid JSON matching this schema, with no extra text:
{"provider": string|null, "direction": "outbound"|"return"|null,
 "incident_types": [one or more of: "late_pickup","no_show","trip_denied",
   "excessive_length","long_hold","wrong_vehicle","driver_conduct","other"],
 "minutes_late": integer|null, "date_mentioned": string|null,
 "summary": string (one plain-language sentence)}
Rules: Never guess numbers that were not said. If unsure, use null.
"provider" must be exactly one of the known providers, or null.
Known providers: <PROVIDERS>.
Rider said: "<TRANSCRIPT>\""""


def _json_part(text: str) -> str:
    """Models often wrap JSON in a code fence or a sentence; keep the object only."""
    return text[text.find("{") : text.rfind("}") + 1]


def extract(transcript: str) -> Extraction | None:
    """None means Granite's answer failed validation twice: fall back to the manual form."""
    prompt = PROMPT.replace(
        "<PROVIDERS>", ", ".join(seed.short_name(p) for p in seed.providers())
    ).replace("<TRANSCRIPT>", transcript.replace('"', "'"))
    for _ in range(2):  # one retry
        try:
            return Extraction.model_validate_json(_json_part(granite.chat(prompt)))
        except ValidationError:
            continue
    return None

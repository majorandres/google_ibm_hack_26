"""Real providers and complaint channels from seed_data.json.

Used for the provider picker and complaint routing only. Never join these to
dashboard statistics: the dashboard runs on synthetic data for fictional providers.
"""

import json
from functools import lru_cache

from app.config import data_file


@lru_cache
def _seed() -> dict:
    return json.loads(data_file("seed_data.json").read_text(encoding="utf-8"))


def providers() -> list[dict]:
    return _seed()["providers"]


def provider(provider_id: str) -> dict | None:
    return next((p for p in providers() if p["id"] == provider_id), None)


def short_name(p: dict) -> str:
    return p["name"].split(" (")[0]


def match_provider(name: str | None) -> str | None:
    """Provider id for a name Granite returned, or None so the rider picks."""
    wanted = (name or "").strip().lower()
    if not wanted:
        return None
    exact = [p["id"] for p in providers() if wanted in (p["name"].lower(), short_name(p).lower())]
    # "SMART ADA" or "SMART" is clear; "DDOT" could be two services, so it is not matched.
    starts = [p["id"] for p in providers() if p["name"].lower().startswith(wanted)]
    return exact[0] if exact else starts[0] if len(starts) == 1 else None


def channel(channel_id: str | None) -> dict | None:
    """Complaint channel, with verified=False for entries still marked TODO_VERIFY."""
    found = next((c for c in _seed()["complaint_channels"] if c["id"] == channel_id), None)
    return found and {**found, "verified": found.get("source") != "TODO_VERIFY"}

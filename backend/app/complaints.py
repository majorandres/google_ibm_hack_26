"""Complaint routing (deterministic) and drafting (Granite, with a template fallback).

Nothing here sends anything. The rider reviews the draft and files it themselves.
"""

import json
import logging
import re
from datetime import date

from app import granite, seed

log = logging.getLogger(__name__)

DISCLAIMER = (
    "This is a draft to help you file. It is not legal advice. Review before sending."
)

PROMPT = """Write a short, polite, factual complaint letter from a paratransit rider.
Use ONLY the facts in INCIDENTS. Do not invent names, times, or outcomes.
Reading level: 6th-8th grade. Plain text, no headings.
The first line is exactly "To: <CHANNEL>". Then a blank line and
"I am a paratransit rider (rider ID <RIDER>)."
Never add placeholders in square brackets such as [Your Name], [Address], [Phone] or [Date];
the rider ID is the only personal detail.
Then: what happened (one bullet per incident, with its date) -> how it affected me, ONLY
if a rider_notes entry says so (otherwise leave this out; never mention work, health or money
that the notes do not mention).
Then one or two sentences asking the office to look into these trips and tell me
what they will do so it stops happening.<LAW>
Do not cite any law or regulation that is not named above.
End with "[Rider signature]".
INCIDENTS: <INCIDENTS>"""

LAW = "Repeated late or missed trips may indicate a pattern prohibited under 49 CFR 37.131(f)."


def cites_ada_rule(provider: dict, trips: list[dict]) -> bool:
    """49 CFR 37.131(f) covers ADA paratransit, not Medicaid rides, and a pattern needs more than one trip."""
    return provider["type"].startswith("ada_paratransit") and len(trips) >= 2


_LABELS = {
    "late_pickup": "the pickup was late",
    "no_show": "the vehicle never arrived",
    "trip_denied": "the trip was denied when I tried to book",
    "excessive_length": "the ride took far too long",
    "long_hold": "I was kept on hold a long time when booking",
    "wrong_vehicle": "the vehicle sent could not carry me",
    "driver_conduct": "there was a problem with the driver's conduct or safety",
    "other": "there was a problem with the ride",
}


def route(trips: list[dict]) -> dict:
    """Channel and escalation for trips that all share one provider (caller checks)."""
    provider = seed.provider(trips[0]["provider_id"])
    return {
        "provider": provider,
        "channel": seed.channel(provider.get("complaint_channel_id")),
        "escalation": seed.channel(provider.get("escalation_channel_id")),
    }


def days_left(channel: dict, trips: list[dict], today: date) -> int | None:
    """Days until the oldest incident passes the channel's filing deadline. None: no known deadline."""
    if not channel.get("deadline_days"):
        return None
    oldest = min(date.fromisoformat(t["trip_date"]) for t in trips)
    return channel["deadline_days"] - (today - oldest).days


def _facts(trips: list[dict], provider_name: str) -> list[dict]:
    return [
        {
            "date": t["trip_date"],
            "provider": provider_name,
            "direction": t["direction"],
            "what_happened": t["incident_type"],
            "minutes_late": t["minutes_late"],
            "rider_notes": t["notes"],
        }
        for t in sorted(trips, key=lambda t: t["trip_date"])
    ]


def template_draft(channel_name: str, rider_id: str, facts: list[dict], cite: bool) -> str:
    lines = []
    for f in facts:
        line = f"- {f['date']}, {f['direction']} trip with {f['provider']}: {_LABELS[f['what_happened']]}"
        if f["minutes_late"]:
            line += f" ({f['minutes_late']} minutes late)"
        if f["rider_notes"]:
            line += f". My note: {f['rider_notes']}"
        lines.append(line)
    intro = f"I am a paratransit rider (rider ID {rider_id}). I am writing to report problems with my rides."
    ask = "I am asking you to look into these trips and tell me what will be done so this does not keep happening."
    law = [LAW, ""] if cite else []
    return "\n".join(
        [f"To: {channel_name}", "", intro, "", "What happened:", *lines, "", ask, "", *law, "[Rider signature]"]
    )


def draft(channel_name: str, rider_id: str, trips: list[dict], provider: dict) -> tuple[str, str]:
    """Returns (letter, drafted_by) where drafted_by is "granite" or "template"."""
    facts = _facts(trips, provider["name"])
    cite = cites_ada_rule(provider, trips)
    law = f"\nThen add this sentence, word for word: {LAW}" if cite else ""
    incidents = json.dumps({"rider_id": rider_id, "incidents": facts})
    prompt = PROMPT.replace("<CHANNEL>", channel_name).replace("<RIDER>", rider_id).replace("<LAW>", law).replace(
        "<INCIDENTS>", incidents
    )
    try:
        letter = granite.chat(prompt)
        # A "[Your Address]"-style blank would ask the rider for details we promise not to collect.
        # Brackets the rider wrote themselves (a note, the rider ID) are not blanks.
        blanks = [
            b
            for b in re.findall(r"\[[^\]]*\]", letter)
            if b.lower() != "[rider signature]" and b not in incidents
        ]
        if blanks:
            raise ValueError(f"Granite's letter has fill-in placeholders: {blanks}")
        return letter, "granite"
    except Exception:  # the demo must still produce a letter when watsonx is down
        log.exception("Granite draft failed; using the template")
        return template_draft(channel_name, rider_id, facts, cite), "template"

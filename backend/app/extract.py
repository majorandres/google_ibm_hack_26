"""Granite turns a rider's spoken description into a structured incident."""

import itertools
import re
from datetime import date

from pydantic import ValidationError

from app import clock, granite, seed
from app.models import Extraction

PROMPT = """You extract paratransit ride incidents from a rider's spoken description.
Return ONLY valid JSON matching this schema, with no extra text:
{"provider": string|null, "direction": "outbound"|"return"|null,
 "incident_types": [one or more of: "late_pickup","no_show","trip_denied",
   "excessive_length","long_hold","wrong_vehicle","driver_conduct","other"],
 "minutes_late": integer|null, "date_mentioned": "YYYY-MM-DD"|null,
 "summary": string (one plain-language sentence)}
What each incident type means:
- late_pickup: the vehicle came, but late.
- no_show: a booked ride never arrived.
- trip_denied: the rider asked to book a ride and was refused or told none was available.
- excessive_length: the rider was in the vehicle far too long. Waiting for a late ride or one
  that never came is late_pickup or no_show, never excessive_length.
- long_hold: the rider waited on hold on the phone to book.
- wrong_vehicle: the vehicle sent could not carry the rider (for example, no room for a wheelchair).
- driver_conduct: the driver was rude, unsafe, or did not secure the rider or wheelchair.
- other: anything else.
Use only the types the rider described.
Rules: Never guess numbers that were not said. If unsure, use null.
"date_mentioned" is the day of the ride. Today is <TODAY>, so turn "yesterday" or
"last Tuesday" into that date. Use null if the rider did not say which day.
"provider" is null unless the rider said the provider's name. Never guess it from a place,
a hospital, or a trip type. When named, use exactly one of the known providers.
Known providers: <PROVIDERS>.
Rider said: "<TRANSCRIPT>\""""


def _json_part(text: str) -> str:
    """Models often wrap JSON in a code fence or a sentence; keep the object only."""
    return text[text.find("{") : text.rfind("}") + 1]


# Same words on the same day get the same answer (temperature 0), so one rehearsal makes the demo
# sentences instant and the live demo does not wait on watsonx (plan §10). Only usable answers are kept.
_answers: dict[tuple[str, date], Extraction] = {}
MAX_ANSWERS = 500  # shortcut: per instance, cleared when full; use a real cache if traffic grows


def extract(transcript: str) -> Extraction | None:
    """None means Granite's answer failed validation: fall back to the manual form."""
    # Speech to Text and typing differ in case and punctuation, not in words.
    key = (" ".join(re.findall(r"\w+", transcript.lower())), clock.today())
    if key in _answers:
        return _answers[key]
    found = _ask(transcript)
    if found is not None:  # an unusable answer is not kept, so the next try asks Granite again
        if len(_answers) >= MAX_ANSWERS:
            _answers.clear()
        _answers[key] = found
    return found


def _ask(transcript: str) -> Extraction | None:
    """No retry: chat() runs at temperature 0, so asking again gives the same answer."""
    prompt = (
        PROMPT.replace("<TODAY>", f"{clock.today():%A %Y-%m-%d}")
        .replace("<PROVIDERS>", ", ".join(seed.short_name(p) for p in seed.providers()))
        .replace("<TRANSCRIPT>", transcript.replace('"', "'"))
    )
    try:
        found = Extraction.model_validate_json(_json_part(granite.chat(prompt)))
    except ValidationError:
        return None
    # Granite tends to fill in a provider the rider never named, and a wrong provider sends the
    # complaint to the wrong office. Keep it only if the rider said it.
    if found.provider and not _was_said(found.provider, transcript):
        found.provider = None
    return found


def _was_said(provider: str, transcript: str) -> bool:
    """The provider's first word must be in the transcript; two words when services share the
    first one ("DDOT Paratransit" / "DDOT Now"), because "DDOT" alone does not say which.

    shortcut: an ordinary word that is also a name ("smart") still counts as said.
    """
    name = provider.lower().split()
    if not name:
        return False
    words = re.findall(r"\w+", transcript.lower())
    # Speech to Text may split a name: "safe ride", "D dot", "Modiv care".
    said = set(words) | {a + b for a, b in itertools.pairwise(words)}
    shared = sum(seed.short_name(p).lower().split()[0] == name[0] for p in seed.providers()) > 1
    return all(word in said for word in name[: 2 if shared else 1])

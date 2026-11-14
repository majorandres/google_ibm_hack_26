"""Live check against real IBM Granite (plan §6, role C: "working on 10 test transcripts").

Skipped unless you ask for it, because every run bills the team's IBM key:

    cd backend
    RIDERECORD_LIVE=1 uv run pytest tests/test_live_granite.py -v

Needs IBMCLOUD_API_KEY and WATSONX_PROJECT_ID in the repo-root .env. Each case checks only what
the rider clearly said; a failure means the prompt in app/extract.py needs work before the demo.
"""

import os
from datetime import date, timedelta

import pytest

from app import clock, complaints, extract, seed
from app.config import get_settings

pytestmark = pytest.mark.skipif(
    not os.environ.get("RIDERECORD_LIVE"), reason="set RIDERECORD_LIVE=1 to call real Granite"
)

YESTERDAY = str(clock.today() - timedelta(days=1))

# (what the rider says, what must come back). Only fields the sentence states are checked.
CASES = [
    # The demo sentence from plan §8.
    ("My return ride from Henry Ford never came. I waited an hour and forty minutes.",
     {"type": "no_show", "direction": "return"}),
    # The same sentence as Speech to Text returns it from the demo .wav (no case, no punctuation).
    ("my return ride from Henry Ford never came I waited an hour and forty minutes",
     {"type": "no_show", "direction": "return"}),
    ("My return ride never came and I waited two hours.",
     {"type": "no_show", "direction": "return"}),
    ("DDOT Paratransit picked me up 45 minutes late this morning for my dialysis.",
     {"type": "late_pickup", "minutes_late": 45, "provider_id": "ddot-paratransit"}),
    ("The van SMART sent could not fit my power wheelchair, so I missed my appointment.",
     {"type": "wrong_vehicle", "provider_id": "smart-ada"}),
    ("I called DDOT Now to book a ride and they told me there were no rides available.",
     {"type": "trip_denied", "provider_id": "ddot-now"}),
    ("I was on hold for forty minutes just trying to book my ride.",
     {"type": "long_hold"}),
    ("The ride home took two and a half hours because the driver made so many stops.",
     {"type": "excessive_length", "direction": "return"}),
    ("The driver yelled at me and did not strap my wheelchair down.",
     {"type": "driver_conduct"}),
    ("Modivcare never showed up for my ride to the doctor yesterday.",
     {"type": "no_show", "provider_id": "modivcare-mi", "date_mentioned": YESTERDAY}),
    ("My ride was twenty minutes late picking me up from work to go home.",
     {"type": "late_pickup", "minutes_late": 20, "direction": "return"}),
]


@pytest.fixture(scope="module", autouse=True)
def granite_is_configured():
    if not get_settings().watsonx_configured:
        pytest.fail("RIDERECORD_LIVE is set but IBMCLOUD_API_KEY / WATSONX_PROJECT_ID are not (.env)")


@pytest.mark.parametrize(("said", "expected"), CASES, ids=[f"t{i:02d}" for i in range(1, len(CASES) + 1)])
def test_extraction(said, expected):
    extract._answers.clear()  # t01 and t02 share a cache key; without this t02 never reaches Granite
    found = extract.extract(said)
    assert found is not None, "Granite's answer did not validate; the rider would get the manual form"
    got = {
        "type": found.incident_types,
        "direction": found.direction,
        "minutes_late": found.minutes_late,
        "provider_id": seed.match_provider(found.provider),
        "date_mentioned": str(found.date_mentioned) if found.date_mentioned else None,
    }
    print(f"\n  {said}\n  -> {got} | {found.summary}")
    assert expected["type"] in got["type"]
    if expected["type"] == "no_show":  # a ride that never came cannot have taken too long
        assert "excessive_length" not in got["type"], "waiting for a no-show is not a long ride"
    for field in ("direction", "minutes_late", "date_mentioned"):
        if field in expected:
            assert got[field] == expected[field], field
    # A provider the rider never named must stay empty: a guess routes the complaint wrongly.
    assert got["provider_id"] == expected.get("provider_id"), "provider"


def test_complaint_draft():
    today = clock.today()
    trips = [
        {"trip_date": str(today - timedelta(days=d)), "direction": direction, "incident_type": kind,
         "minutes_late": minutes, "notes": notes}
        for d, direction, kind, minutes, notes in [
            (18, "return", "no_show", None, "Return ride from the clinic never came."),
            (9, "outbound", "late_pickup", 45, None),
            (3, "return", "late_pickup", 70, "Missed dinner medication time."),
        ]
    ]
    provider = seed.provider("ddot-paratransit")
    channel = seed.channel(provider["complaint_channel_id"])
    letter, drafted_by = complaints.draft(channel["name"], "demo-denise", trips, provider)
    print(f"\n{letter}")
    assert drafted_by == "granite", "Granite failed and the template was used; see the log above"
    assert "[Rider signature]" in letter
    assert letter.startswith("To: "), "the letter should open with the office it is for"
    assert any(w in letter.lower() for w in ("ask", "request", "please")), "the letter never says what the rider wants"
    for padding in ("employment", "work", "job"):
        # No note mentions work, so a letter that does has invented an effect.
        assert padding not in letter.lower().split(), f"invented effect: {padding!r}"
    for trip in trips:
        # Granite may write a date as 2026-11-10, November 10 or 11/10; any of them counts.
        day = date.fromisoformat(trip["trip_date"])
        forms = [day.isoformat(), f"{day:%B} {day.day}", f"{day:%b} {day.day}", f"{day.month}/{day.day}"]
        assert any(f in letter for f in forms), f"the ride on {day} is missing from the letter"

import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.staticfiles import StaticFiles

from app import complaints, extract, seed, speech, stats, store
from app.config import get_settings
from app.models import ComplaintRequest, ExtractRequest, Trip, TripIn

log = logging.getLogger(__name__)

DEMO_RIDER = "demo-denise"  # fictional rider used in the demo script
MAX_AUDIO_BYTES = 10 * 1024 * 1024
# The app is public and Granite / Speech to Text bill the team's IBM key. Per caller and
# per instance: loose enough for a room of judges, tight enough to stop a loop.
PAID_CALLS_PER_MINUTE = 20
_paid_calls: defaultdict[str, deque[float]] = defaultdict(deque)


def limit_paid_calls(request: Request) -> None:
    # Cloud Run appends the caller's address to X-Forwarded-For, so the last entry is the one
    # a client cannot fake. Locally there is no such header.
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[-1].strip()
    caller = forwarded or (request.client.host if request.client else "unknown")
    now = time.monotonic()
    calls = _paid_calls[caller]
    while calls and now - calls[0] > 60:
        calls.popleft()
    if len(calls) >= PAID_CALLS_PER_MINUTE:
        raise HTTPException(429, "Too many requests. Wait a minute and try again.")
    calls.append(now)


def _save(trip_in: TripIn) -> dict:
    trip = Trip(**trip_in.model_dump(), id=uuid4().hex, logged_at=datetime.now(UTC))
    data = trip.model_dump(mode="json")
    store.save(data)
    return data


def seed_demo() -> None:
    """Give the demo rider a short history so the complaint builder has something to select."""
    if store.by_rider(DEMO_RIDER):
        return
    today = date.today()
    for days_ago, direction, incident, minutes, notes in [
        (18, "return", "no_show", None, "Return ride from the clinic never came."),
        (9, "outbound", "late_pickup", 45, None),
        (6, "outbound", None, None, None),
        (3, "return", "late_pickup", 70, "Missed dinner medication time."),
    ]:
        _save(
            TripIn(
                rider_id=DEMO_RIDER,
                provider_id="ddot-paratransit",
                direction=direction,
                incident_type=incident,
                minutes_late=minutes,
                notes=notes,
                trip_date=today - timedelta(days=days_ago),
            )
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        seed_demo()
    except Exception:  # a storage hiccup must not stop the app from starting
        log.exception("Could not seed demo trips")
    yield


app = FastAPI(title="RideRecord API", lifespan=lifespan)


@app.get("/api/health")
def health() -> dict:
    s = get_settings()
    return {
        "status": "ok",
        "watsonx_configured": s.watsonx_configured,
        "model": s.watsonx_model_id,
        "stt_configured": s.stt_configured,
        "trip_store": "firestore" if s.use_firestore else "memory",
        "stats_source": "bigquery" if s.bigquery_table else "csv",
    }


@app.get("/api/providers")
def list_providers() -> list[dict]:
    return [{k: p[k] for k in ("id", "name", "type", "region")} for p in seed.providers()]


@app.post("/api/trips", status_code=201)
def log_trip(trip: TripIn) -> dict:
    if not seed.provider(trip.provider_id):
        raise HTTPException(422, f"Unknown provider: {trip.provider_id}")
    return _save(trip)


@app.get("/api/trips")
def list_trips(rider_id: str) -> list[dict]:
    today = date.today()
    return [{**t, "filing": _filing(t, today)} for t in store.by_rider(rider_id)]


def _filing(trip: dict, today: date) -> dict | None:
    """For a problem ride: the office a complaint would go to and the days left to file it."""
    provider = trip["incident_type"] and seed.provider(trip["provider_id"])
    channel = provider and seed.channel(provider.get("complaint_channel_id"))
    if not channel:
        return None
    return {
        "office": channel["name"],
        "deadline_days": channel.get("deadline_days"),
        "days_left": complaints.days_left(channel, [trip], today),
    }


def _extract(transcript: str) -> dict:
    """incident is None when Granite is off or its answer was unusable: the UI then shows the manual form."""
    try:
        found = extract.extract(transcript)
    except Exception:
        log.exception("Extraction failed")
        found = None
    incident = found and {
        **found.model_dump(exclude={"provider"}),
        "provider_id": seed.match_provider(found.provider),
    }
    return {"transcript": transcript, "incident": incident}


@app.post("/api/extract", dependencies=[Depends(limit_paid_calls)])
def extract_incident(body: ExtractRequest) -> dict:
    return _extract(body.transcript)


@app.post("/api/voice", dependencies=[Depends(limit_paid_calls)])
async def voice(request: Request) -> dict:
    """Raw audio in the request body (Content-Type from the browser's MediaRecorder or an uploaded file)."""
    content_type = request.headers.get("content-type", "audio/webm")
    if not speech.supported(content_type):
        raise HTTPException(
            415, "This audio type cannot be read. Upload WAV, MP3, OGG or WebM, or type what happened."
        )
    audio = await request.body()
    if not audio or len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(413 if audio else 400, "Send 1 byte to 10 MB of audio.")
    try:
        transcript = await speech.transcribe(audio, content_type)
    except speech.SpeechNotConfigured as exc:
        raise HTTPException(503, str(exc)) from exc
    except (httpx.HTTPError, KeyError) as exc:
        log.exception("Speech to Text failed")
        raise HTTPException(502, "Speech to Text failed. Type what happened instead.") from exc
    if not transcript:
        raise HTTPException(422, "No speech heard. Try again or type what happened.")
    return await run_in_threadpool(_extract, transcript)


@app.post("/api/complaints", dependencies=[Depends(limit_paid_calls)])
def draft_complaint(body: ComplaintRequest) -> dict:
    """Draft only. Nothing is stored or sent; the rider files it themselves."""
    mine = {t["id"]: t for t in store.by_rider(body.rider_id)}
    wanted = dict.fromkeys(body.trip_ids)  # a repeated id counts once, in the order sent
    trips = [mine[i] for i in wanted if i in mine]
    if len(trips) != len(wanted):
        raise HTTPException(404, "Some of those trips were not found for this rider.")
    if any(not t["incident_type"] for t in trips):
        raise HTTPException(422, "Only trips with a problem can go in a complaint.")
    if len({t["provider_id"] for t in trips}) > 1:
        raise HTTPException(422, "Pick trips from one provider per complaint.")

    routing = complaints.route(trips)
    channel = routing["channel"]
    letter, drafted_by = complaints.draft(
        channel["name"], body.rider_id, trips, routing["provider"]
    )
    return {
        "channel": channel,
        "escalation": routing["escalation"],
        "days_left": complaints.days_left(channel, trips, date.today()),
        "draft": letter,
        "drafted_by": drafted_by,
        "model": get_settings().watsonx_model_id if drafted_by == "granite" else None,
        "disclaimer": complaints.DISCLAIMER,
    }


@app.get("/api/stats")
def get_stats() -> dict:
    try:
        return stats.stats()
    except stats.StatsUnavailable as exc:
        raise HTTPException(503, str(exc)) from exc


# In the container the built frontend is copied to ./static and served from "/".
# In local dev this directory does not exist and Vite serves the frontend instead.
_static = Path(__file__).resolve().parents[1] / "static"
if _static.is_dir():
    app.mount("/", StaticFiles(directory=_static, html=True), name="static")

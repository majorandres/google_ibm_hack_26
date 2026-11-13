import logging
from contextlib import asynccontextmanager
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.staticfiles import StaticFiles

from app import complaints, extract, seed, speech, stats, store
from app.config import get_settings
from app.models import ComplaintRequest, ExtractRequest, Trip, TripIn

log = logging.getLogger(__name__)

DEMO_RIDER = "demo-denise"  # fictional rider used in the demo script
MAX_AUDIO_BYTES = 10 * 1024 * 1024


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
    return store.by_rider(rider_id)


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


@app.post("/api/extract")
def extract_incident(body: ExtractRequest) -> dict:
    return _extract(body.transcript)


@app.post("/api/voice")
async def voice(request: Request) -> dict:
    """Raw audio in the request body (Content-Type from the browser's MediaRecorder or an uploaded file)."""
    audio = await request.body()
    if not audio or len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(413 if audio else 400, "Send 1 byte to 10 MB of audio.")
    try:
        transcript = await speech.transcribe(
            audio, request.headers.get("content-type", "audio/webm")
        )
    except speech.SpeechNotConfigured as exc:
        raise HTTPException(503, str(exc)) from exc
    except (httpx.HTTPError, KeyError) as exc:
        log.exception("Speech to Text failed")
        raise HTTPException(502, "Speech to Text failed. Type what happened instead.") from exc
    if not transcript:
        raise HTTPException(422, "No speech heard. Try again or type what happened.")
    return await run_in_threadpool(_extract, transcript)


@app.post("/api/complaints")
def draft_complaint(body: ComplaintRequest) -> dict:
    """Draft only. Nothing is stored or sent; the rider files it themselves."""
    mine = {t["id"]: t for t in store.by_rider(body.rider_id)}
    trips = [mine[i] for i in body.trip_ids if i in mine]
    if len(trips) != len(set(body.trip_ids)):
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

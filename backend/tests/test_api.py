import csv
import importlib.util
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app import complaints, extract, granite, main, stats, store
from app.config import REPO_ROOT, Settings
from app.main import DEMO_RIDER, app


@pytest.fixture
def client(monkeypatch):
    """Keyless app with an empty in-memory store, whatever is in the developer's .env."""
    settings = Settings(_env_file=None)
    for module in (main, store, stats, granite):
        monkeypatch.setattr(module, "get_settings", lambda: settings)
    monkeypatch.setattr("app.speech.get_settings", lambda: settings)
    granite._model.cache_clear()
    store._mem.clear()
    extract._answers.clear()
    main._paid_calls.clear()
    with TestClient(app) as c:  # the context manager runs lifespan, which seeds the demo rider
        yield c


def post_trip(client, **fields):
    trip = {"rider_id": DEMO_RIDER, "provider_id": "ddot-now", "direction": "return", **fields}
    return client.post("/api/trips", json=trip)


def history(client, rider_id=DEMO_RIDER):
    return client.get(f"/api/trips?rider_id={rider_id}").json()


def problem_trip_ids(client):
    return [t["id"] for t in history(client) if t["incident_type"]]


def complain(client, trip_ids, rider_id=DEMO_RIDER):
    return client.post("/api/complaints", json={"rider_id": rider_id, "trip_ids": trip_ids})


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["trip_store"] == "memory"


def test_providers_are_the_real_ones_from_seed_data(client):
    ids = [p["id"] for p in client.get("/api/providers").json()]
    assert "ddot-paratransit" in ids and "modivcare-mi" in ids


def test_log_trip_then_see_it_in_history(client):
    response = post_trip(client, rider_id="r1", incident_type="late_pickup", minutes_late=40)
    assert response.status_code == 201
    trips = history(client, "r1")
    assert len(trips) == 1 and trips[0]["minutes_late"] == 40


def test_log_trip_rejects_unknown_provider(client):
    assert post_trip(client, provider_id="nope").status_code == 422


def test_extract_reads_fenced_json_and_maps_the_provider(client, monkeypatch):
    answer = (
        '```json\n{"provider": "DDOT Paratransit", "direction": "return", '
        '"incident_types": ["no_show"], "minutes_late": null, "date_mentioned": null, '
        '"summary": "The return ride never came."}\n```'
    )
    monkeypatch.setattr(granite, "chat", lambda prompt: answer)
    body = client.post("/api/extract", json={"transcript": "my ride never came"}).json()
    assert body["incident"]["provider_id"] == "ddot-paratransit"
    assert body["incident"]["incident_types"] == ["no_show"]


def test_extract_falls_back_to_the_manual_form_without_a_wasted_retry(client, monkeypatch):
    calls = []
    monkeypatch.setattr(granite, "chat", lambda prompt: calls.append(1) or "Sorry, no.")
    body = client.post("/api/extract", json={"transcript": "hello"}).json()
    assert body == {"transcript": "hello", "incident": None}
    assert len(calls) == 1  # temperature 0: a retry would get the same answer


def test_extract_without_watsonx_keys_falls_back_to_the_manual_form(client):
    body = client.post("/api/extract", json={"transcript": "hello"}).json()
    assert body["incident"] is None


def test_voice_returns_503_without_speech_to_text(client):
    response = client.post("/api/voice", content=b"abc", headers={"Content-Type": "audio/wav"})
    assert response.status_code == 503


def test_complaint_routes_to_ddot_with_deadline_and_template_fallback(client):
    body = complain(client, problem_trip_ids(client)).json()
    assert body["channel"]["id"] == "ddot-ada"
    assert body["escalation"]["id"] == "fta-ocr"
    assert body["days_left"] == 162  # 180-day window, oldest seeded incident is 18 days old
    assert body["drafted_by"] == "template"  # no watsonx keys in tests
    assert "never arrived" in body["draft"] and "45 minutes late" in body["draft"]
    assert "not legal advice" in body["disclaimer"]


def test_complaint_uses_granite_when_available(client, monkeypatch):
    prompts = []
    monkeypatch.setattr(granite, "chat", lambda prompt: prompts.append(prompt) or "Dear DDOT")
    body = complain(client, problem_trip_ids(client)).json()
    assert (body["drafted_by"], body["draft"]) == ("granite", "Dear DDOT")
    assert "DDOT ADA Coordinator" in prompts[0]
    assert "Missed dinner medication time." in prompts[0]


def test_complaint_refuses_other_riders_trips_mixed_providers_and_fine_rides(client):
    ids = problem_trip_ids(client)
    assert complain(client, ids, rider_id="someone-else").status_code == 404

    other = post_trip(client, provider_id="modivcare-mi", incident_type="no_show").json()
    assert complain(client, [ids[0], other["id"]]).status_code == 422

    fine = next(t["id"] for t in history(client) if not t["incident_type"])
    assert complain(client, [fine]).status_code == 422


def test_unverified_channel_is_marked_and_has_no_deadline(client):
    trip = post_trip(client, rider_id="r2", provider_id="modivcare-mi", incident_type="no_show")
    body = complain(client, [trip.json()["id"]], rider_id="r2").json()
    assert body["channel"]["verified"] is False
    assert body["days_left"] is None and body["escalation"] is None


def test_days_left_counts_from_the_oldest_incident():
    today = date(2026, 11, 13)
    trips = [{"trip_date": str(today - timedelta(days=d))} for d in (3, 200)]
    assert complaints.days_left({"deadline_days": 180}, trips, today) == -20


def row(trips, problems, provider, direction="return"):
    return {
        "provider_name": provider,
        "month": "2026-09",
        "direction": direction,
        "trips": trips,
        "problems": problems,
    }


def test_pattern_flag_needs_both_the_rate_and_enough_trips():
    rows = [
        row(30, 3, "at-threshold"),  # 10% of 30: flag
        row(29, 10, "too-few-trips"),  # 34% but n < 30: no flag
        row(100, 9, "below-rate"),  # 9%: no flag
        row(15, 2, "split"),  # the two directions add up to 30 trips at 10%
        row(15, 1, "split", direction="outbound"),
    ]
    flagged = {r["provider_name"]: r["flagged"] for r in stats.summarize(rows)["by_provider_month"]}
    assert flagged == {
        "at-threshold": True,
        "too-few-trips": False,
        "below-rate": False,
        "split": True,
    }


def test_seed_42_flags_exactly_the_two_planted_spikes(client, tmp_path, monkeypatch):
    spec = importlib.util.spec_from_file_location("gen", REPO_ROOT / "generate_synthetic_trips.py")
    gen = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gen)
    rows = gen.generate(3000, 150, 42, gen.datetime(2026, 6, 1), 150, REPO_ROOT / "seed_data.json")
    with (tmp_path / "trips.csv").open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    monkeypatch.setattr(stats, "data_file", lambda name: tmp_path / name)
    stats._summary.cache_clear()

    body = client.get("/api/stats").json()
    stats._summary.cache_clear()

    assert body["synthetic"] is True and body["source"] == "csv"
    flagged = {(r["provider_name"], r["month"]) for r in body["by_provider_month"] if r["flagged"]}
    assert flagged == {("Demo Medicaid Rides E", "2026-09"), ("Demo Suburban C", "2026-10")}
    rate = {r["direction"]: r["rate"] for r in body["by_direction"]}
    assert rate["return"] > 1.5 * rate["outbound"]

"""Regression tests for the findings of the whole-branch review and the PR review."""

import json
from datetime import UTC, date, datetime, timedelta

from app import clock, granite, main, seed, stats
from app.config import Settings
from app.models import MAX_TEXT
from tests.test_api import client, complain, post_trip, problem_trip_ids, row  # noqa: F401

CITATION = "49 CFR 37.131(f)"


def test_dashboard_falls_back_to_the_csv_when_bigquery_fails(client, monkeypatch):  # noqa: F811
    def broken(table):
        raise RuntimeError("table not found")

    monkeypatch.setattr(stats, "get_settings", lambda: Settings(_env_file=None, bigquery_table="p.d.t"))
    monkeypatch.setattr(stats, "_from_bigquery", broken)
    monkeypatch.setattr(stats, "_from_csv", lambda: [row(30, 3, "p")])
    stats._summary.cache_clear()

    response = client.get("/api/stats")
    stats._summary.cache_clear()

    assert response.status_code == 200
    assert response.json()["source"] == "csv"


def test_medicaid_complaint_does_not_cite_the_ada_paratransit_rule(client, monkeypatch):  # noqa: F811
    ids = [
        post_trip(client, rider_id="r3", provider_id="modivcare-mi", incident_type="no_show").json()["id"]
        for _ in range(2)
    ]
    assert CITATION not in complain(client, ids, rider_id="r3").json()["draft"]

    prompts = []
    monkeypatch.setattr(granite, "chat", lambda prompt: prompts.append(prompt) or "ok")
    complain(client, ids, rider_id="r3")
    assert CITATION not in prompts[0]


def test_single_incident_is_not_called_a_repeated_pattern(client):  # noqa: F811
    ids = problem_trip_ids(client)
    assert CITATION not in complain(client, ids[:1]).json()["draft"]
    assert CITATION in complain(client, ids).json()["draft"]


def test_spoken_provider_names_match_when_unambiguous():
    assert seed.match_provider("SMART ADA") == "smart-ada"
    assert seed.match_provider("smart") == "smart-ada"
    assert seed.match_provider("DDOT Now") == "ddot-now"
    assert seed.match_provider("DDOT Paratransit") == "ddot-paratransit"
    assert seed.match_provider("DDOT") is None  # two DDOT services: the rider picks
    assert seed.match_provider("") is None
    assert seed.match_provider(None) is None


# --- PR review findings ---


def test_repeated_trip_ids_count_once_and_cannot_hide_a_missing_one(client):  # noqa: F811
    first = problem_trip_ids(client)[0]
    once = complain(client, [first, first])
    assert once.status_code == 200
    assert CITATION not in once.json()["draft"]  # one trip is not a repeated pattern
    assert complain(client, [first, first, "bogus"]).status_code == 404


def test_cut_off_granite_letter_falls_back_to_the_template(client, monkeypatch):  # noqa: F811
    class CutOff:
        def chat(self, **_):
            message = {"content": "Dear DDOT, on November"}
            return {"choices": [{"finish_reason": "length", "message": message}]}

    monkeypatch.setattr(granite, "_model", lambda: CutOff())
    body = complain(client, problem_trip_ids(client)).json()
    assert body["drafted_by"] == "template"
    assert body["draft"].endswith("[Rider signature]")


def test_bigquery_is_tried_again_after_a_failure(client, monkeypatch):  # noqa: F811
    calls = []

    def flaky(table):
        calls.append(table)
        if len(calls) == 1:
            raise RuntimeError("IAM not propagated yet")
        return [row(30, 3, "p")]

    monkeypatch.setattr(stats, "get_settings", lambda: Settings(_env_file=None, bigquery_table="p.d.t"))
    monkeypatch.setattr(stats, "_from_bigquery", flaky)
    monkeypatch.setattr(stats, "_from_csv", lambda: [row(30, 3, "p")])
    stats._summary.cache_clear()

    sources = [client.get("/api/stats").json()["source"] for _ in range(3)]
    stats._summary.cache_clear()

    assert sources == ["csv", "bigquery", "bigquery"]
    assert len(calls) == 2  # the good BigQuery answer is cached


def _granite_says(date_mentioned):
    return json.dumps(
        {
            "provider": None,
            "direction": "return",
            "incident_types": ["no_show"],
            "minutes_late": None,
            "date_mentioned": date_mentioned,
            "summary": "The ride never came.",
        }
    )


def test_extract_keeps_a_resolved_past_date_and_drops_anything_else(client, monkeypatch):  # noqa: F811
    prompts = []
    three_days_ago = str(clock.today() - timedelta(days=3))
    for said, kept in [
        (three_days_ago, three_days_ago),
        ("last Tuesday", None),
        (str(clock.today() + timedelta(days=1)), None),
        (None, None),
    ]:
        monkeypatch.setattr(granite, "chat", lambda prompt, said=said: prompts.append(prompt) or _granite_says(said))
        incident = client.post("/api/extract", json={"transcript": f"it never came ({said})"}).json()["incident"]
        assert incident["date_mentioned"] == kept
    assert clock.today().isoformat() in prompts[0]  # Granite needs today to resolve "yesterday"


def test_a_typed_description_fits_in_the_notes_it_prefills(client):  # noqa: F811
    assert client.post("/api/extract", json={"transcript": "x" * MAX_TEXT}).status_code == 200
    assert post_trip(client, notes="x" * MAX_TEXT).status_code == 201


def test_voice_rejects_audio_formats_speech_to_text_cannot_read(client):  # noqa: F811
    response = client.post("/api/voice", content=b"abc", headers={"Content-Type": "audio/mp4"})
    assert response.status_code == 415
    assert "type" in response.json()["detail"].lower()


def test_paid_endpoints_are_rate_limited_per_caller(client, monkeypatch):  # noqa: F811
    monkeypatch.setattr(main, "PAID_CALLS_PER_MINUTE", 2)
    ask = lambda ip: client.post(
        "/api/extract", json={"transcript": "hi"}, headers={"X-Forwarded-For": f"6.6.6.6, {ip}"}
    )
    assert [ask("1.1.1.1").status_code for _ in range(3)] == [200, 200, 429]
    assert ask("2.2.2.2").status_code == 200  # the last X-Forwarded-For entry is the caller


# --- Backend plan: the rider's calendar day, not the server's ---


def test_today_is_the_michigan_day_not_the_utc_day(monkeypatch):
    class LateEvening(datetime):
        """10 PM in Detroit on March 1 is already March 2 in UTC, where Cloud Run runs."""

        @classmethod
        def now(cls, tz=None):
            return datetime(2027, 3, 2, 3, 0, tzinfo=UTC).astimezone(tz)

    monkeypatch.setattr(clock, "datetime", LateEvening, raising=False)
    assert clock.today() == date(2027, 3, 1)


def test_days_left_counts_from_the_michigan_day(client, monkeypatch):  # noqa: F811
    monkeypatch.setattr(clock, "today", lambda: date(2027, 1, 1))
    trip = post_trip(client, rider_id="r4", incident_type="no_show", trip_date="2026-12-31")
    body = complain(client, [trip.json()["id"]], rider_id="r4").json()
    assert body["days_left"] == 179


def test_a_ride_cannot_be_logged_for_a_future_day(client):  # noqa: F811
    tomorrow = str(clock.today() + timedelta(days=1))
    assert post_trip(client, trip_date=tomorrow).status_code == 422


# --- Backend plan §10: cache extraction answers so the demo does not wait on watsonx ---


def test_the_same_sentence_asks_granite_only_once(client, monkeypatch):  # noqa: F811
    prompts = []
    monkeypatch.setattr(granite, "chat", lambda prompt: prompts.append(prompt) or _granite_says(None))
    said = [
        "My return ride from Henry Ford never came.",
        "my return ride from henry ford never came",  # Speech to Text drops case and punctuation
        "My return ride never came.",
    ]
    incidents = [client.post("/api/extract", json={"transcript": s}).json()["incident"] for s in said]
    assert len(prompts) == 2
    assert incidents[0] == incidents[1]


def test_an_unusable_answer_is_not_kept_so_the_next_try_asks_again(client, monkeypatch):  # noqa: F811
    answers = iter(["Sorry, I can't help with that.", _granite_says(None)])
    monkeypatch.setattr(granite, "chat", lambda prompt: next(answers))
    ask = lambda: client.post("/api/extract", json={"transcript": "my ride never came"}).json()["incident"]
    assert ask() is None  # first answer was not JSON: manual form
    assert ask() is not None  # a rehearsal miss must not stick for the rest of the day


# --- Live Granite run, 2026-11-13: guards for what the prompt alone did not stop ---


def _granite_names(provider):
    answer = json.loads(_granite_says(None))
    return json.dumps({**answer, "provider": provider})


def test_a_provider_the_rider_never_named_is_dropped(client, monkeypatch):  # noqa: F811
    # Live, Granite answered "DDOT Paratransit" for a sentence that names no provider.
    monkeypatch.setattr(granite, "chat", lambda prompt: _granite_names("DDOT Paratransit"))
    ask = lambda said: client.post("/api/extract", json={"transcript": said}).json()["incident"]
    assert ask("My return ride from Henry Ford never came.")["provider_id"] is None
    assert ask("My DDOT return ride never came.")["provider_id"] == "ddot-paratransit"


def test_a_letter_with_fill_in_placeholders_falls_back_to_the_template(client, monkeypatch):  # noqa: F811
    # Live, Granite opened with "[Your Name]", "[Your Address]", "[Phone Number]" lines.
    letter = "[Your Name]\n[Your Address]\n\nDear DDOT,\nMy rides were late.\n\n[Rider signature]"
    monkeypatch.setattr(granite, "chat", lambda prompt: letter)
    body = complain(client, problem_trip_ids(client)).json()
    assert body["drafted_by"] == "template"
    assert "[Your" not in body["draft"]

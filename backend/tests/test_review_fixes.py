"""Regression tests for the findings of the whole-branch review."""

from app import granite, seed, stats
from app.config import Settings
from tests.test_api import client, complain, post_trip, problem_trip_ids, row  # noqa: F401

CITATION = "49 CFR 37.131(f)"


def test_dashboard_falls_back_to_the_csv_when_bigquery_fails(client, monkeypatch):  # noqa: F811
    def broken(table):
        raise RuntimeError("table not found")

    monkeypatch.setattr(stats, "get_settings", lambda: Settings(_env_file=None, bigquery_table="p.d.t"))
    monkeypatch.setattr(stats, "_from_bigquery", broken)
    monkeypatch.setattr(stats, "_from_csv", lambda: [row(30, 3, "p")])
    stats.stats.cache_clear()

    response = client.get("/api/stats")
    stats.stats.cache_clear()

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

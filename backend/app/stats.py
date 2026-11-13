"""Dashboard aggregates over SYNTHETIC trips for FICTIONAL providers.

Rows come from BigQuery when BIGQUERY_TABLE is set, otherwise from trips.csv
(written by generate_synthetic_trips.py). Both give the same grouped shape:
provider_name, month, direction, trips, problems.
"""

import csv
import logging
from collections import Counter
from functools import lru_cache

from app.config import data_file, get_settings

log = logging.getLogger(__name__)

# Demo assumption: 49 CFR 37.131(f) does not define "substantial". Say so on screen.
THRESHOLD = 0.10
MIN_TRIPS = 30
LATE_MINUTES = 30


class StatsUnavailable(RuntimeError):
    pass


def _from_bigquery(table: str) -> list[dict]:
    from google.cloud import bigquery  # imported late: not needed for local dev

    sql = f"""
        SELECT provider_name, month, direction, COUNT(*) AS trips,
               COUNTIF(minutes_late > {LATE_MINUTES} OR outcome IN ('no_show', 'denied')) AS problems
        FROM `{table}` GROUP BY provider_name, month, direction
    """  # table comes from our own config, never from a request
    return [dict(row) for row in bigquery.Client().query(sql).result()]


def _from_csv() -> list[dict]:
    path = data_file("trips.csv")
    if not path.exists():
        raise StatsUnavailable(
            "No trips.csv. Run: python generate_synthetic_trips.py --out trips.csv"
        )
    trips, problems = Counter(), Counter()
    with path.open(newline="") as f:
        for r in csv.DictReader(f):
            key = (r["provider_name"], r["month"], r["direction"])
            trips[key] += 1
            late = r["minutes_late"] and int(r["minutes_late"]) > LATE_MINUTES
            problems[key] += bool(late or r["outcome"] in ("no_show", "denied"))
    return [
        {"provider_name": p, "month": m, "direction": d, "trips": n, "problems": problems[p, m, d]}
        for (p, m, d), n in trips.items()
    ]


def _rollup(rows: list[dict], *keys: str) -> list[dict]:
    trips, problems = Counter(), Counter()
    for r in rows:
        key = tuple(r[k] for k in keys)
        trips[key] += r["trips"]
        problems[key] += r["problems"]
    return [
        {**dict(zip(keys, key)), "trips": n, "problems": problems[key], "rate": round(problems[key] / n, 4)}
        for key, n in sorted(trips.items())
    ]


def summarize(rows: list[dict]) -> dict:
    by_provider_month = _rollup(rows, "provider_name", "month")
    for r in by_provider_month:
        # "Possible pattern, worth investigating": never call it a violation.
        r["flagged"] = r["trips"] >= MIN_TRIPS and r["problems"] / r["trips"] >= THRESHOLD
    return {
        "synthetic": True,
        "threshold": THRESHOLD,
        "min_trips": MIN_TRIPS,
        "late_minutes": LATE_MINUTES,
        "by_provider_month": by_provider_month,
        "by_direction": _rollup(rows, "direction"),
    }


@lru_cache
def stats() -> dict:
    table = get_settings().bigquery_table
    if table:
        try:
            return {**summarize(_from_bigquery(table)), "source": "bigquery"}
        except Exception:  # the dashboard must survive a missing table or an IAM hiccup
            log.exception("BigQuery failed; using trips.csv")
    return {**summarize(_from_csv()), "source": "csv"}

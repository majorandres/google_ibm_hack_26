#!/usr/bin/env python3
"""
Generate SYNTHETIC paratransit / Medicaid ride logs for the RideRecord demo.

These are NOT real riders or real trips. Every row has is_synthetic=true and
the dashboard must show a "Demo data, not real riders" badge.

Rates are illustrative assumptions chosen so the dashboard has visible
patterns (e.g. return trips worse than outbound, one provider with a bad
month). They are not estimates of real-world performance.

Usage:
    python generate_synthetic_trips.py --trips 3000 --seed 42 --out trips.csv
    bq load --source_format=CSV --autodetect riderecord.trips trips.csv
"""
import argparse
import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# FICTIONAL providers only. Never attach synthetic performance data to real
# agencies (DDOT, SMART, Modivcare, ...): a "possible pattern" flag on a real
# name built from fake data would be misleading. Real providers are used only
# for complaint routing, never for dashboard statistics.
PROVIDERS = {
    # provider_id: (display_name, service_type, base_problem_rate)
    "demo-provider-a": ("Demo Paratransit A", "ada_paratransit", 0.045),
    "demo-provider-b": ("Demo Same-Day B", "ada_paratransit_same_day", 0.045),
    "demo-provider-c": ("Demo Suburban C", "ada_paratransit", 0.045),
    "demo-nemt-d": ("Demo Medicaid Rides D", "medicaid_nemt", 0.05),
    "demo-nemt-e": ("Demo Medicaid Rides E", "medicaid_nemt", 0.05),
}

# Provider + month (1-12) that gets a spike, so the pattern flag fires in the demo.
SPIKES = {("demo-nemt-e", 9): 0.18, ("demo-provider-c", 10): 0.20}

RETURN_TRIP_PENALTY = 0.05      # return trips fail more often (illustrative)
CROSS_BORDER_PENALTY = 0.04     # city <-> suburb trips fail more often (illustrative)

INCIDENT_WEIGHTS = {
    "late_pickup": 0.45,
    "no_show": 0.18,
    "wrong_vehicle": 0.10,
    "excessive_length": 0.12,
    "long_hold": 0.08,
    "trip_denied": 0.04,
    "driver_conduct": 0.03,
}

PURPOSES = ["medical", "medical", "medical", "work", "errand", "dialysis", "other"]


def load_zips(seed_path: Path):
    try:
        data = json.loads(seed_path.read_text())
        z = data["demo_zip_codes"]
        return z["detroit"], z["suburban"]
    except (OSError, KeyError, json.JSONDecodeError):
        return ["48201", "48202", "48205", "48219", "48227"], ["48335", "48075", "48126"]


def pick_incident(rng: random.Random) -> str:
    types, weights = zip(*INCIDENT_WEIGHTS.items())
    return rng.choices(types, weights=weights, k=1)[0]


def generate(n_trips: int, n_riders: int, seed: int, start: datetime, days: int, seed_path: Path):
    rng = random.Random(seed)
    detroit_zips, suburban_zips = load_zips(seed_path)

    riders = []
    for i in range(n_riders):
        home_in_detroit = rng.random() < 0.65
        riders.append({
            "rider_id": f"demo-rider-{i:04d}",
            "home_zip": rng.choice(detroit_zips if home_in_detroit else suburban_zips),
            "providers": rng.sample(list(PROVIDERS), k=rng.choice([1, 1, 2])),
        })

    rows = []
    for t in range(n_trips):
        r = rng.choice(riders)
        provider = rng.choice(r["providers"])
        provider_name, service_type, base_rate = PROVIDERS[provider]
        day = start + timedelta(days=rng.randrange(days))
        direction = rng.choice(["outbound", "return"])
        cross_border = rng.random() < 0.15
        window_start = day.replace(hour=rng.randint(6, 18), minute=rng.choice([0, 15, 30, 45]))

        p_problem = base_rate
        p_problem += SPIKES.get((provider, day.month), 0.0)
        p_problem += RETURN_TRIP_PENALTY if direction == "return" else 0.0
        p_problem += CROSS_BORDER_PENALTY if cross_border else 0.0

        incident = ""
        minutes_late = max(0, int(rng.gauss(5, 6)))   # normal trips: small variance
        trip_minutes = int(rng.uniform(20, 55)) + (25 if cross_border else 0)
        hold_minutes = round(rng.uniform(0, 6), 1)
        outcome = "completed"

        if rng.random() < p_problem:
            incident = pick_incident(rng)
            if incident == "late_pickup":
                minutes_late = int(rng.uniform(31, 120))
            elif incident == "no_show":
                outcome, minutes_late, trip_minutes = "no_show", None, None
            elif incident == "trip_denied":
                outcome, minutes_late, trip_minutes = "denied", None, None
            elif incident == "excessive_length":
                trip_minutes = int(rng.uniform(90, 180))
            elif incident == "long_hold":
                hold_minutes = round(rng.uniform(20, 60), 1)
            elif incident == "wrong_vehicle":
                outcome, trip_minutes = "wrong_vehicle", None

        rows.append({
            "trip_id": f"demo-trip-{t:06d}",
            "rider_id": r["rider_id"],
            "provider_id": provider,
            "provider_name": provider_name,
            "service_type": service_type,
            "home_zip": r["home_zip"],
            "trip_date": day.date().isoformat(),
            "month": day.strftime("%Y-%m"),
            "direction": direction,
            "cross_border": cross_border,
            "scheduled_window_start": window_start.isoformat(timespec="minutes"),
            "minutes_late": "" if minutes_late is None else minutes_late,
            "trip_minutes": "" if trip_minutes is None else trip_minutes,
            "hold_minutes": hold_minutes,
            "outcome": outcome,
            "incident_type": incident,
            "trip_purpose": rng.choice(PURPOSES),
            "logged_via": rng.choice(["tap", "tap", "voice"]),
            "is_synthetic": True,
        })
    return rows


def main():
    ap = argparse.ArgumentParser(description="Generate synthetic RideRecord trip logs (demo only).")
    ap.add_argument("--trips", type=int, default=3000)
    ap.add_argument("--riders", type=int, default=150)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--start", default="2026-06-01", help="first trip date (YYYY-MM-DD)")
    ap.add_argument("--days", type=int, default=150, help="number of days to spread trips over")
    ap.add_argument("--seed-data", default="seed_data.json", help="path to seed_data.json (for ZIP codes)")
    ap.add_argument("--out", default="trips.csv")
    args = ap.parse_args()

    rows = generate(args.trips, args.riders, args.seed,
                    datetime.fromisoformat(args.start), args.days, Path(args.seed_data))

    with open(args.out, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    problems = sum(1 for r in rows if r["incident_type"])
    print(f"Wrote {len(rows)} SYNTHETIC trips ({problems} with incidents) to {args.out}")


if __name__ == "__main__":
    main()

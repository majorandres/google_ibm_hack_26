# RideRecord

RideRecord lets Michigan paratransit and Medicaid riders log a failed ride by voice in 10 seconds, turns their logs into complaints routed to the right agency before the deadline, and gives advocates independent data on patterns federal law prohibits.

Built for the Michigan DevFest AI Hackathon 2026 (Mobility track) on IBM Cloud and Google Cloud.

- The problem and the long-term plan: [michigan-accessible-transit-problem-statement.md](michigan-accessible-transit-problem-statement.md)
- What we build today: [riderecord-hackathon-plan.md](riderecord-hackathon-plan.md)
- Why, in one page: [docs/why-we-are-building-this.md](docs/why-we-are-building-this.md)

## What works in this repo

| Screen | What it does | Endpoint |
|---|---|---|
| **Log a ride** | Pick the ride service, the direction and how it went. The last service is remembered, so a routine log is three taps. | `POST /api/trips` |
| **Talk** | Say (or type, or upload a recording of) what happened. Watson Speech to Text transcribes it, Granite pulls out the incident, the rider checks it and saves. The summary is read aloud. | `POST /api/voice`, `POST /api/extract` |
| **Complaints** | Pick logged problem rides. The backend routes them to the right office, counts the days left to file, and Granite drafts a plain-language letter from the logged facts only. The rider copies, downloads or emails it. **Nothing is sent automatically.** | `POST /api/complaints` |
| **Dashboard** | Late, missed and denied trips by provider and month, with a "possible pattern" flag. **Synthetic data for fictional providers**, labeled on screen. | `GET /api/stats` |

Not built yet (see the plan's P1 and P2): ride history screen and PDF export, map view, Watson Text to Speech read-back (the browser's voice is used for now), AI pattern summary, caregiver mode, Spanish and Arabic, SMS, sign-in.

## Which tool does what

| Tool | Job in the app | Code |
|---|---|---|
| **IBM watsonx.ai, Granite** (`ibm/granite-4-h-small`) | Turns a spoken description into a structured incident. Drafts the complaint letter. | `backend/app/extract.py`, `backend/app/complaints.py` |
| **IBM Watson Speech to Text** | Transcribes voice logs. | `backend/app/speech.py` |
| **Google Cloud Run** | Hosts the one container (API and web app). | `infra/main.tf`, `Dockerfile` |
| **Google Firestore** | Stores logged trips. | `backend/app/store.py` |
| **Google BigQuery** | Aggregates the synthetic trips for the dashboard. | `backend/app/stats.py` |

IBM is the intelligence layer and Google is the app and data layer. Routing a complaint to an office and counting the deadline are plain code, not AI (`backend/app/complaints.py`, `backend/app/seed.py`).

## Layout

| Path | What |
|---|---|
| `backend/` | Python API (FastAPI, managed with [uv](https://docs.astral.sh/uv/)). |
| `frontend/` | React + TypeScript + Tailwind (Vite). Installable as a PWA. |
| `infra/` | Terraform for Google Cloud: Cloud Run, Firestore, BigQuery, Artifact Registry, Secret Manager. |
| `Dockerfile` | One image: FastAPI serves the API under `/api` and the built frontend at `/`. |
| `scripts/deploy.sh` | Build, push, load BigQuery and `terraform apply`. |
| `.github/workflows/` | CI on every PR; deploy to Cloud Run on every push to `main`. See [docs/ci-cd.md](docs/ci-cd.md). |
| `seed_data.json` | Cited evidence for the pitch, real providers, real complaint channels. |
| `generate_synthetic_trips.py` | Writes the synthetic dashboard data (fictional providers only). |
| `docs/` | Project context, hackathon rules and Google Doc exports. |

## Local development

Prerequisites: Python 3.12+, uv, Node 22+.

The app runs with **no keys at all**: trips stay in memory, the dashboard reads `trips.csv`, complaints come from a template, and the Talk screen falls back to typing with a manual form. A demo rider ("Denise") with four logged rides is created at startup.

1. Generate the synthetic dashboard data (gitignored):

   ```bash
   python generate_synthetic_trips.py --trips 3000 --seed 42 --out trips.csv
   ```

2. Start the backend (http://localhost:8000, API docs at `/docs`):

   ```bash
   cd backend && uv run uvicorn app.main:app --reload
   ```

3. Start the frontend (http://localhost:5173, proxies `/api` to the backend):

   ```bash
   cd frontend && npm install && npm run dev
   ```

To turn on the cloud services, copy `.env.example` to `.env` and fill it in. `.env` is gitignored; never commit keys. `GET /api/health` shows which services are on.

| Set this | To get |
|---|---|
| `IBMCLOUD_API_KEY` + `WATSONX_PROJECT_ID` | Granite extraction and complaint drafting |
| `STT_URL` | Voice logging through Watson Speech to Text |
| `USE_FIRESTORE=true` | Trips saved in Firestore (needs `gcloud auth application-default login`) |
| `BIGQUERY_TABLE` | Dashboard aggregated in BigQuery |

Checks:

```bash
cd backend && uv run pytest && uv run ruff check .
```

```bash
cd frontend && npm run build && npm run lint
```

## Deploy to Google Cloud

Prerequisites: a Google Cloud project with billing, Docker running, Terraform, the gcloud CLI logged in (`gcloud auth login` and `gcloud auth application-default login`), and `GCP_PROJECT_ID`, `IBMCLOUD_API_KEY` and `WATSONX_PROJECT_ID` in `.env`. `STT_URL` is optional: without it voice logging is off and riders type instead.

```bash
bash scripts/deploy.sh
```

It creates the registry and the BigQuery dataset, builds and pushes the image, loads the synthetic trips into `riderecord.trips`, applies the rest of `infra/` and prints the app URL.

Terraform state is local (`infra/terraform.tfstate`, gitignored), so one person should own `deploy.sh`. After that first run, merging to `main` deploys through GitHub Actions; [docs/ci-cd.md](docs/ci-cd.md) has the setup.

### Live deployment

Deployed on November 13, 2026.

| | |
|---|---|
| App | https://riderecord-gghnd43xpq-uc.a.run.app (public, demo data only) |
| Google Cloud project | `mich-riderecord`, region `us-central1` |
| Service | Cloud Run `riderecord`, running as `riderecord-run@mich-riderecord.iam.gserviceaccount.com` |
| Data | Firestore `(default)` for trips; BigQuery `mich-riderecord.riderecord.trips` (3,000 synthetic rows) |
| Granite | Not hosted by us. The app calls `ibm/granite-4-h-small` on IBM watsonx.ai with the key in Secret Manager (`riderecord-ibmcloud-api-key`). |
| Terraform state | On Esteban's machine only. Infra changes (env vars, scaling, secrets) have to be applied from there. |

Check it with `curl https://riderecord-gghnd43xpq-uc.a.run.app/api/health`. It reports whether watsonx and Speech to Text are configured and where trips and stats come from.

**Verified on the live app:** health, the web app, `/api/stats` from BigQuery, trips in Firestore, `/api/extract` through Granite, and a GitHub Actions deploy from `main`.

**Not verified yet:** `/api/complaints` on the live app, and voice logging (`STT_URL` is not set, so Speech to Text is off).

### Problems we hit on the first deploy

- **`bq load` fails with `python3.14: command not found`.** The gcloud SDK picked a Python that is not installed. Point it at a real one before running `deploy.sh`, for example `export CLOUDSDK_PYTHON="/c/Users/<you>/AppData/Local/Programs/Python/Python312/python.exe"`. The deploy still finishes without it, but the dashboard reads the CSV in the image instead of BigQuery.
- **No demo trips after the very first deploy.** The app seeds the demo rider at startup, and on a fresh project the Firestore role has not taken effect yet (`403 Missing or insufficient permissions` in the logs). Any later deploy or restart seeds them.
- **`IBMCLOUD_API_KEY: Set IBMCLOUD_API_KEY in .env`.** Save `.env` before running the script.

## Data sources

| Data | Source | Used for |
|---|---|---|
| `seed_data.json` → `evidence[]` | News, government and research sources, each with its URL | Pitch and About text only |
| `seed_data.json` → `providers[]`, `complaint_channels[]` | Public agency and FTA pages, each with its URL | Provider picker, complaint routing |
| Synthetic trips | `generate_synthetic_trips.py`, seed 42 | Dashboard |

Rules we hold to:

- **No real rider data.** The only rider is a fictional demo account. Notes ask riders to leave out addresses and medical details.
- **Synthetic data uses fictional providers only.** Real agency names appear in the provider picker and complaint routing, never in dashboard statistics.
- **Unconfirmed contacts are not shown as real.** Channels marked `TODO_VERIFY` in `seed_data.json` (SMART, Medicaid plan grievance) show a "not confirmed" message instead of contact details.
- **The pattern flag is an assumption.** 10% of at least 30 logged trips in a month. The regulation does not define "substantial"; the dashboard says so and never says "violation".
- **AI drafts, the rider sends.** Every draft carries: "This is a draft to help you file. It is not legal advice. Review before sending."

## AI tools used

- **IBM Granite** (`ibm/granite-4-h-small`) on watsonx.ai and **IBM Watson Speech to Text** are the models the product calls.
- **Claude (Anthropic)** was used for research, docs and writing the code in this repo.
- **IBM Bob** reviewed the team's earlier idea.

# Commute Check

A shift-aware commute check for the Michigan DevFest AI Hackathon 2026: can a worker without a car make the round trip to a job by bus, at the hours the shift demands? See [docs/why-we-are-building-this.md](docs/why-we-are-building-this.md).

## Layout

| Path | What |
|---|---|
| `backend/` | Python 3.12 API (FastAPI, managed with [uv](https://docs.astral.sh/uv/)). Calls IBM Granite on watsonx.ai. |
| `frontend/` | React + TypeScript + Tailwind (Vite). |
| `infra/` | Terraform for IBM Cloud: Container Registry namespace and a Code Engine app. |
| `Dockerfile` | One image: FastAPI serves the API under `/api` and the built frontend at `/`. |
| `scripts/deploy.sh` | Build, push and `terraform apply`. |
| `.github/workflows/` | CI on every PR; deploy to Code Engine on every push to `main`. See [docs/ci-cd.md](docs/ci-cd.md). |
| `docs/` | Project context and Google Doc exports. |

## Local development

Prerequisites: Python 3.12, uv, Node 22+.

1. Copy `.env.example` to `.env` and fill it in. `.env` is gitignored; never commit keys.
2. Start the backend (http://localhost:8000, docs at `/docs`):

   ```bash
   cd backend && uv run uvicorn app.main:app --reload
   ```

3. Start the frontend (http://localhost:5173, proxies `/api` to the backend):

   ```bash
   cd frontend && npm install && npm run dev
   ```

Checks:

```bash
cd backend && uv run pytest && uv run ruff check .
```

```bash
cd frontend && npm run build && npm run lint
```

The app runs without any keys; `/api/granite/ask` returns 503 until `IBMCLOUD_API_KEY` and `WATSONX_PROJECT_ID` are set.

## Deploy to IBM Cloud

Prerequisites: Docker running, Terraform, and `IBMCLOUD_API_KEY` + `WATSONX_PROJECT_ID` in `.env`.

```bash
bash scripts/deploy.sh
```

It creates the registry namespace, builds and pushes the image to `us.icr.io`, then applies the rest of `infra/` and prints the app URL.

Terraform state is local (`infra/terraform.tfstate`, gitignored), so one person should own `deploy.sh`.

After that first run, merging to `main` deploys automatically through GitHub Actions. It needs the `IBMCLOUD_API_KEY` repository secret. [docs/ci-cd.md](docs/ci-cd.md) lists every step of both workflows, the one-time setup, and when to still use `deploy.sh`.

### What the hackathon account allows

The account grants Viewer on the resource group, so Terraform cannot create service instances. It deploys into the instances IBM pre-provisioned:

| Instance | Region | Used for |
|---|---|---|
| watsonx-Hackathon Code Engine | us-south | Runs the app (managed by `infra/`) |
| watsonx-Hackathon WML / WS | us-south | Granite via watsonx.ai. Chat model available: `ibm/granite-4-h-small` |
| watsonx-Hackathon Cloudant | us-south | Available, not used yet |
| watsonx-Hackathon COS | global | Available, not used yet |
| watsonx-Hackathon STT / TTS | us-south | Available, not used yet |
| watsonx-Hackathon Orchestrate | ca-tor | Available, not used yet |

## AI tools used

Claude (Anthropic) was used for research, docs and scaffolding this repo. IBM Granite (`ibm/granite-4-h-small`) on watsonx.ai is the model the product calls.

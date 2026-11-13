# CI/CD

Two GitHub Actions workflows live in `.github/workflows/`:

| Workflow | File | Runs on | What it does |
|---|---|---|---|
| **CI** | `ci.yml` | Every pull request, manual run, and as the first stage of every deploy | Lints, tests and builds every part of the repo. Deploys nothing and needs no secrets. |
| **Deploy** | `deploy.yml` | Every push to `main` that changes more than docs (`docs/**`, `*.md`), manual run | Runs CI, then builds the Docker image, pushes it to Google Artifact Registry and points the Cloud Run service at it. |

A push to `main` does not run `ci.yml` on its own. `deploy.yml` calls it, so each commit on `main` is checked once, and the deploy only happens if every CI job passes.

A push to `main` that only changes Markdown files or `docs/` runs neither workflow. Deploys run one at a time, so this keeps a docs edit from holding up a code fix pushed right after it. A push that changes any other file still deploys everything. To deploy after a docs-only push anyway, start **Deploy** by hand from the Actions tab.

## CI (`ci.yml`)

Four jobs run in parallel. Any one failing fails the check on the PR.

### `backend`: Backend (ruff + pytest)

Runs in `backend/`.

1. **Check out** the repo.
2. **Set up uv** with Python 3.12 and a dependency cache keyed on `uv.lock`.
3. **`uv sync --locked`** installs the exact versions in `uv.lock`. Fails if `pyproject.toml` changed without `uv lock` being re-run.
4. **`uv run ruff check`** lints. Problems show up as annotations on the PR's changed lines.
5. **`uv run pytest`** runs `backend/tests/`. The tests need no cloud keys: Granite, Speech to Text, Firestore and BigQuery are replaced or switched off.

### `frontend`: Frontend (oxlint + build)

Runs in `frontend/`.

1. **Check out** the repo.
2. **Set up Node 22** with an npm cache keyed on `package-lock.json`.
3. **`npm ci`** installs the exact versions in `package-lock.json`. Fails if the lockfile is out of sync with `package.json`. CI and the Dockerfile use Node 22, which ships npm 10. npm 10 also wants Linux-only optional packages (`@emnapi/*`) in the lockfile, and a newer npm on Windows can leave them out. After changing dependencies, refresh the lockfile with `npx npm@10 install --package-lock-only` in `frontend/` and commit it.
4. **`npm run lint`** runs oxlint.
5. **`npm run build`** type-checks with `tsc -b` and builds with Vite. A type error fails here.

### `terraform`: Terraform (fmt + validate)

Runs in `infra/`. Needs no cloud credentials and touches no cloud resources.

1. **Check out** the repo.
2. **Set up Terraform.**
3. **`terraform fmt -check`** fails if any `.tf` file is not formatted. Fix it with `terraform fmt -recursive infra`.
4. **`terraform init -backend=false`** downloads the Google provider without touching any state.
5. **`terraform validate`** checks the configuration for syntax and type errors.

### `image`: Docker image (build + smoke test)

Runs at the repo root.

1. **Check out** the repo.
2. **Set up Docker Buildx.**
3. **Build the image** from `Dockerfile` for `linux/amd64`, the platform Cloud Run runs. Layers are cached in the GitHub Actions cache, which the deploy workflow reuses.
4. **Run the container** and check that `/api/health` returns `"status":"ok"` and that `/` serves the built React page. The build also generates the synthetic `trips.csv` inside the image. This catches a broken Dockerfile or a frontend that did not get copied into the image.
5. **Print the container logs**, even when an earlier step failed, so a crash on startup is visible.

## Deploy (`deploy.yml`)

### `ci`: CI

Calls `ci.yml` with all four jobs above.

### `deploy`: Deploy to Cloud Run

Starts only after every CI job passes, and only on `main` (a manual run on another branch runs CI but skips this job). Deploys run one at a time: a push that lands while a deploy is running waits for it to finish rather than cancelling it. If several pushes pile up, only the newest waiting one runs.

1. **Check out** the repo.
2. **Check that the `GCP_SA_KEY` secret and the `GCP_PROJECT_ID` variable are set**, and fail with a pointer to this file if not.
3. **Pick the image tag**: `<short commit SHA>-<run number>`, for example `us-central1-docker.pkg.dev/<project>/riderecord/riderecord:08e6d6a-14`. The SHA shows which commit is live; the run number keeps two runs of the same commit from writing the same tag.
4. **Log in to Google Cloud** with the service account key, install the gcloud CLI, and log Docker in to Artifact Registry.
5. **Set up Docker Buildx, then build and push the image.** Same build as the CI `image` job, so it mostly comes out of the cache.
6. **Roll the service to the new image.** Checks the `riderecord` service exists, runs `gcloud run deploy --image <new image>`, and writes the service URL to the run summary and to the `production` environment on GitHub.
7. **Smoke test the live app.** Calls `<app URL>/api/health` for up to a minute and fails the run if it never returns 200.

The deploy job changes only the service's image. Environment variables, the IBM key in Secret Manager, scaling, Firestore and BigQuery stay as Terraform last set them. It does not reload the BigQuery table.

## One-time setup

1. **Create everything once with Terraform.** Run `bash scripts/deploy.sh` locally (see the root `README.md`). It creates the registry, Firestore, the BigQuery dataset and table, the secret and the Cloud Run service. The deploy workflow fails with "does not exist yet" until this has been done.
2. **Create a deploy service account** and give it only what the workflow needs. Replace `PROJECT` with the project ID:

   ```bash
   gcloud iam service-accounts create riderecord-deploy --project PROJECT
   ```

   ```bash
   for role in roles/artifactregistry.writer roles/run.developer; do gcloud projects add-iam-policy-binding PROJECT --member serviceAccount:riderecord-deploy@PROJECT.iam.gserviceaccount.com --role $role; done
   ```

   ```bash
   gcloud iam service-accounts add-iam-policy-binding riderecord-run@PROJECT.iam.gserviceaccount.com --member serviceAccount:riderecord-deploy@PROJECT.iam.gserviceaccount.com --role roles/iam.serviceAccountUser --project PROJECT
   ```

   ```bash
   gcloud iam service-accounts keys create key.json --iam-account riderecord-deploy@PROJECT.iam.gserviceaccount.com
   ```

3. **Add it to GitHub.** Repo → Settings → Secrets and variables → Actions. New repository **secret** `GCP_SA_KEY`: the whole contents of `key.json`. New repository **variable** `GCP_PROJECT_ID`: the project ID. Optional variable `GCP_REGION` if not `us-central1`. Then delete `key.json`; never commit it.
4. **Optional: protect `main`.** Settings → Branches → add a rule for `main` that requires the CI checks (`Backend (ruff + pytest)`, `Frontend (oxlint + build)`, `Terraform (fmt + validate)`, `Docker image (build + smoke test)`) to pass before merging.

A key file is the quick hackathon route. After the event, switch to Workload Identity Federation so no long-lived key exists.

## How the workflow and Terraform share the app

Terraform state is local to whoever ran `scripts/deploy.sh`, so the workflow does not run Terraform. Terraform owns the service's setup; the workflow owns which image it runs.

- **Changing code**: merge to `main`. The workflow deploys it.
- **Changing infrastructure** (scaling, env vars, secrets, anything in `infra/`): the person holding the Terraform state runs `bash scripts/deploy.sh`. It also builds and deploys the current checkout, so pull `main` first or it will roll the app back to whatever is checked out locally.
- **Do not run a bare `terraform apply`** in `infra/`. Without `TF_VAR_image_tag` it sets the image to `:latest`, which is never pushed, and the service breaks. Use `scripts/deploy.sh`.

## Rolling back

Revert the bad commit on `main` (`git revert <sha>` and push). The workflow deploys the revert. For a faster fix, send traffic back to the previous revision in the Cloud Run console (service → Revisions → Manage traffic).

## Secrets in the workflows

- `GCP_SA_KEY` is the only secret. GitHub masks it in logs. It can push images and update the Cloud Run service, nothing else. The IBM Cloud API key is not in GitHub at all: Terraform put it in Secret Manager and Cloud Run reads it from there.
- Pull requests from forks do not get repository secrets, and `ci.yml` never asks for any, so CI works on outside PRs and cannot leak the key.
- Both workflows have read-only access to the repo contents (`permissions: contents: read`).

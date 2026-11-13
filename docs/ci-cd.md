# CI/CD

Two GitHub Actions workflows live in `.github/workflows/`:

| Workflow | File | Runs on | What it does |
|---|---|---|---|
| **CI** | `ci.yml` | Every pull request, manual run, and as the first stage of every deploy | Lints, tests and builds every part of the repo. Deploys nothing and needs no secrets. |
| **Deploy** | `deploy.yml` | Every push to `main`, manual run | Runs CI, then builds the Docker image, pushes it to IBM Container Registry and points the Code Engine app at it. |

A push to `main` does not run `ci.yml` on its own. `deploy.yml` calls it, so each commit on `main` is checked once, and the deploy only happens if every CI job passes.

## CI (`ci.yml`)

Four jobs run in parallel. Any one failing fails the check on the PR.

### `backend`: Backend (ruff + pytest)

Runs in `backend/`.

1. **Check out** the repo.
2. **Set up uv** with Python 3.12 and a dependency cache keyed on `uv.lock`.
3. **`uv sync --locked`** installs the exact versions in `uv.lock`. Fails if `pyproject.toml` changed without `uv lock` being re-run.
4. **`uv run ruff check`** lints. Problems show up as annotations on the PR's changed lines.
5. **`uv run pytest`** runs `backend/tests/`. The tests need no IBM Cloud keys.

### `frontend`: Frontend (oxlint + build)

Runs in `frontend/`.

1. **Check out** the repo.
2. **Set up Node 22** with an npm cache keyed on `package-lock.json`.
3. **`npm ci`** installs the exact versions in `package-lock.json`. Fails if the lockfile is out of sync with `package.json`. CI and the Dockerfile use Node 22, which ships npm 10. npm 10 also wants Linux-only optional packages (`@emnapi/*`) in the lockfile, and a newer npm on Windows can leave them out. After changing dependencies, refresh the lockfile with `npx npm@10 install --package-lock-only` in `frontend/` and commit it.
4. **`npm run lint`** runs oxlint.
5. **`npm run build`** type-checks with `tsc -b` and builds with Vite. A type error fails here.

### `terraform`: Terraform (fmt + validate)

Runs in `infra/`. Needs no IBM Cloud credentials and touches no cloud resources.

1. **Check out** the repo.
2. **Set up Terraform.**
3. **`terraform fmt -check`** fails if any `.tf` file is not formatted. Fix it with `terraform fmt -recursive infra`.
4. **`terraform init -backend=false`** downloads the IBM provider without touching any state.
5. **`terraform validate`** checks the configuration for syntax and type errors.

### `image`: Docker image (build + smoke test)

Runs at the repo root.

1. **Check out** the repo.
2. **Set up Docker Buildx.**
3. **Build the image** from `Dockerfile` for `linux/amd64`, the platform Code Engine runs. Layers are cached in the GitHub Actions cache, which the deploy workflow reuses.
4. **Run the container** and check that `/api/health` returns `"status":"ok"` and that `/` serves the built React page. This catches a broken Dockerfile or a frontend that did not get copied into the image.
5. **Print the container logs**, even when an earlier step failed, so a crash on startup is visible.

## Deploy (`deploy.yml`)

### `ci`: CI

Calls `ci.yml` with all four jobs above.

### `deploy`: Deploy to Code Engine

Starts only after every CI job passes, and only on `main` (a manual run on another branch runs CI but skips this job). Deploys run one at a time: a push that lands while a deploy is running waits for it to finish rather than cancelling it. If several pushes pile up, only the newest waiting one runs.

1. **Check out** the repo.
2. **Check that the `IBMCLOUD_API_KEY` secret is set**, and fail with a pointer to this file if it is not.
3. **Pick the image tag**: `<short commit SHA>-<run number>`, for example `us.icr.io/midevfest-commute-check/commute-check:08e6d6a-14`. The SHA shows which commit is live; the run number keeps two runs of the same commit (a push and a manual run, say) from writing the same tag.
4. **Set up Docker Buildx.**
5. **Log in to IBM Container Registry** (`us.icr.io`) with the API key.
6. **Build and push the image.** Same build as the CI `image` job, so it mostly comes out of the cache.
7. **Install the IBM Cloud CLI** with the Code Engine plugin, and log in to `us-south`, resource group `Default`.
8. **Roll the app to the new image.** Selects the `watsonx-Hackathon Code Engine` project, checks the `commute-check` app exists, runs `ibmcloud ce app update --image <new image>`, and waits up to 5 minutes for the new revision to be ready. Writes the app URL to the run summary and to the `production` environment on GitHub.
9. **Smoke test the live app.** Calls `<app URL>/api/health` for up to a minute and fails the run if it never returns 200.

The deploy job changes only the app's image. Environment variables, secrets, scaling and the registry namespace stay as Terraform last set them.

## One-time setup

1. **Create the app once with Terraform.** Run `bash scripts/deploy.sh` locally (see the root `README.md`). It creates the registry namespace, the Code Engine secrets and the app. The deploy workflow fails with "does not exist yet" until this has been done.
2. **Add the API key as a repository secret.** GitHub → repo → Settings → Secrets and variables → Actions → New repository secret: name `IBMCLOUD_API_KEY`, value the same key that is in your `.env`. Never paste it anywhere else.
3. **Optional: set the registry namespace.** If you changed `CR_NAMESPACE` in `.env`, add a repository *variable* (not a secret) named `CR_NAMESPACE` with the same value. Otherwise the workflow uses `midevfest-commute-check`.
4. **Optional: protect `main`.** Settings → Branches → add a rule for `main` that requires the CI checks (`Backend (ruff + pytest)`, `Frontend (oxlint + build)`, `Terraform (fmt + validate)`, `Docker image (build + smoke test)`) to pass before merging.

## How the workflow and Terraform share the app

Terraform state is local to whoever ran `scripts/deploy.sh`, so the workflow does not run Terraform. Terraform owns the app's setup; the workflow owns which image it runs.

- **Changing code**: merge to `main`. The workflow deploys it.
- **Changing infrastructure** (scaling, env vars, secrets, anything in `infra/`): the person holding the Terraform state runs `bash scripts/deploy.sh`. It also builds and deploys the current checkout, so pull `main` first or it will roll the app back to whatever is checked out locally.
- **Do not run a bare `terraform apply`** in `infra/`. Without `TF_VAR_image_tag` it sets the image to `:latest`, which is never pushed, and the app breaks. Use `scripts/deploy.sh`.

## Rolling back

Revert the bad commit on `main` (`git revert <sha>` and push). The workflow deploys the revert. For a faster fix, open an earlier successful **Deploy** run in the Actions tab and choose "Re-run all jobs": it rebuilds that run's commit and points the app back at it.

## Secrets in the workflows

- `IBMCLOUD_API_KEY` is the only secret. GitHub masks it in logs. It is used to push the image and to call Code Engine; the app's runtime keys stay in the Code Engine secret Terraform created.
- Pull requests from forks do not get repository secrets, and `ci.yml` never asks for any, so CI works on outside PRs and cannot leak the key.
- Both workflows have read-only access to the repo contents (`permissions: contents: read`).

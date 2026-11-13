#!/usr/bin/env bash
# Build the image, push it to Artifact Registry, load the synthetic trips into
# BigQuery and deploy to Cloud Run.
# Run from anywhere (Git Bash on Windows works). Needs docker, terraform, the
# gcloud CLI (logged in: `gcloud auth login` and `gcloud auth application-default login`)
# and a filled-in .env.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID in .env}"
: "${IBMCLOUD_API_KEY:?Set IBMCLOUD_API_KEY in .env}"
: "${WATSONX_PROJECT_ID:?Set WATSONX_PROJECT_ID in .env}"
REGION="${GCP_REGION:-us-central1}"
REGISTRY="$REGION-docker.pkg.dev"
TAG="$(git rev-parse --short HEAD)-$(date +%H%M%S)"
IMAGE="$REGISTRY/$GCP_PROJECT_ID/riderecord/riderecord:$TAG"

export TF_VAR_project_id="$GCP_PROJECT_ID"
export TF_VAR_region="$REGION"
export TF_VAR_ibmcloud_api_key="$IBMCLOUD_API_KEY"
export TF_VAR_watsonx_project_id="$WATSONX_PROJECT_ID"
export TF_VAR_watsonx_model_id="${WATSONX_MODEL_ID:-ibm/granite-4-h-small}"
export TF_VAR_stt_url="${STT_URL:-}"
export TF_VAR_image_tag="$TAG"

terraform -chdir=infra init -input=false

# The registry and the dataset have to exist before the image push and the bq load.
terraform -chdir=infra apply -input=false -auto-approve \
  -target=google_artifact_registry_repository.app -target=google_bigquery_dataset.riderecord

gcloud auth configure-docker "$REGISTRY" --quiet
docker build --platform linux/amd64 -t "$IMAGE" .
docker push "$IMAGE"

# Synthetic demo data for fictional providers. Seeded, so every load is identical.
python generate_synthetic_trips.py --trips 3000 --seed 42 --out trips.csv
bq --project_id="$GCP_PROJECT_ID" load --replace --source_format=CSV --autodetect riderecord.trips trips.csv

terraform -chdir=infra apply -input=false -auto-approve
echo "Deployed: $(terraform -chdir=infra output -raw app_url)"

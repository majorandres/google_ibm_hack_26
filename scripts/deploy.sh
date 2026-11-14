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
export TF_VAR_watsonx_url="${WATSONX_URL:-https://us-south.ml.cloud.ibm.com}"
export TF_VAR_stt_url="${STT_URL:-}"
export TF_VAR_stt_api_key="${STT_API_KEY:-}"
export TF_VAR_image_tag="$TAG"

# Terraform needs these two before it can manage service accounts and IAM in a fresh project.
gcloud services enable cloudresourcemanager.googleapis.com iam.googleapis.com --project "$GCP_PROJECT_ID"

terraform -chdir=infra init -input=false

# The registry and the dataset have to exist before the image push and the bq load.
terraform -chdir=infra apply -input=false -auto-approve \
  -target=google_artifact_registry_repository.app -target=google_bigquery_dataset.riderecord

gcloud auth configure-docker "$REGISTRY" --quiet
docker build --platform linux/amd64 -t "$IMAGE" .
docker push "$IMAGE"

# Synthetic demo data for fictional providers: the exact CSV the image built, so BigQuery
# and the in-image fallback always match and the host needs no Python.
docker run --rm --platform linux/amd64 --entrypoint cat "$IMAGE" trips.csv > trips.csv
# A failed load must not stop the deploy: the app falls back to the trips.csv inside the image.
bq --project_id="$GCP_PROJECT_ID" load --replace --source_format=CSV --autodetect riderecord.trips trips.csv ||
  echo "WARNING: bq load failed. The dashboard will use the CSV in the image, not BigQuery."

terraform -chdir=infra apply -input=false -auto-approve
echo "Deployed: $(terraform -chdir=infra output -raw app_url)"

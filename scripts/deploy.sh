#!/usr/bin/env bash
# Build the image, push it to IBM Container Registry, and deploy to Code Engine.
# Run from anywhere (Git Bash on Windows works). Needs docker, terraform and a filled-in .env.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${IBMCLOUD_API_KEY:?Set IBMCLOUD_API_KEY in .env}"
: "${WATSONX_PROJECT_ID:?Set WATSONX_PROJECT_ID in .env}"
CR_NAMESPACE="${CR_NAMESPACE:-midevfest-commute-check}"
REGISTRY="us.icr.io"
TAG="$(git rev-parse --short HEAD)-$(date +%H%M%S)"
IMAGE="$REGISTRY/$CR_NAMESPACE/commute-check:$TAG"

export TF_VAR_ibmcloud_api_key="$IBMCLOUD_API_KEY"
export TF_VAR_watsonx_project_id="$WATSONX_PROJECT_ID"
export TF_VAR_watsonx_model_id="${WATSONX_MODEL_ID:-ibm/granite-4-h-small}"
export TF_VAR_google_maps_api_key="${GOOGLE_MAPS_API_KEY:-}"
export TF_VAR_cr_namespace="$CR_NAMESPACE"
export TF_VAR_image_tag="$TAG"

terraform -chdir=infra init -input=false

# The registry namespace has to exist before the image can be pushed.
terraform -chdir=infra apply -input=false -auto-approve -target=ibm_cr_namespace.app

echo "$IBMCLOUD_API_KEY" | docker login "$REGISTRY" -u iamapikey --password-stdin
docker build --platform linux/amd64 -t "$IMAGE" .
docker push "$IMAGE"

terraform -chdir=infra apply -input=false -auto-approve
echo "Deployed: $(terraform -chdir=infra output -raw app_url)"

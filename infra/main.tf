terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Google Cloud is the app and data layer: Cloud Run hosts the app, Firestore
# holds trips, BigQuery aggregates the synthetic dashboard data. The IBM side
# (watsonx.ai, Speech to Text) is pre-provisioned by the hackathon and reached
# with an API key, so nothing IBM is managed here.

locals {
  image          = "${var.region}-docker.pkg.dev/${var.project_id}/${var.app_name}/${var.app_name}:${var.image_tag}"
  bigquery_table = "${var.project_id}.${google_bigquery_dataset.riderecord.dataset_id}.trips"
}

resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "bigquery.googleapis.com",
    "firestore.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "app" {
  repository_id = var.app_name
  location      = var.region
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# A project has one "(default)" database. If yours already has one:
#   terraform import google_firestore_database.default "(default)"
resource "google_firestore_database" "default" {
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"
  depends_on  = [google_project_service.apis]
}

# scripts/deploy.sh loads the synthetic trips into riderecord.trips with `bq load`.
resource "google_bigquery_dataset" "riderecord" {
  dataset_id  = "riderecord"
  location    = "US"
  description = "SYNTHETIC demo trips for fictional providers. Not real riders."
  depends_on  = [google_project_service.apis]
}

resource "google_service_account" "app" {
  account_id   = "${var.app_name}-run"
  display_name = "RideRecord Cloud Run service"
}

resource "google_project_iam_member" "app" {
  for_each = toset([
    "roles/datastore.user",      # read and write trips in Firestore
    "roles/bigquery.dataViewer", # read the synthetic trips table
    "roles/bigquery.jobUser",    # run the dashboard query
  ])
  project = var.project_id
  role    = each.key
  member  = google_service_account.app.member
}

resource "google_secret_manager_secret" "ibm_api_key" {
  secret_id = "${var.app_name}-ibmcloud-api-key"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "ibm_api_key" {
  secret      = google_secret_manager_secret.ibm_api_key.id
  secret_data = var.ibmcloud_api_key
}

resource "google_secret_manager_secret_iam_member" "app" {
  secret_id = google_secret_manager_secret.ibm_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.app.member
}

resource "google_cloud_run_v2_service" "app" {
  name                = var.app_name
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.app.email
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = 2
    }
    containers {
      image = local.image
      ports {
        container_port = 8080
      }
      resources {
        limits = { cpu = "1", memory = "1Gi" }
      }
      env {
        name  = "USE_FIRESTORE"
        value = "true"
      }
      env {
        name  = "BIGQUERY_TABLE"
        value = local.bigquery_table
      }
      env {
        name  = "WATSONX_URL"
        value = var.watsonx_url
      }
      env {
        name  = "WATSONX_PROJECT_ID"
        value = var.watsonx_project_id
      }
      env {
        name  = "WATSONX_MODEL_ID"
        value = var.watsonx_model_id
      }
      env {
        name  = "STT_URL"
        value = var.stt_url
      }
      env {
        name = "IBMCLOUD_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.ibm_api_key.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [
    google_firestore_database.default,
    google_project_iam_member.app,
    google_secret_manager_secret_iam_member.app,
    google_secret_manager_secret_version.ibm_api_key,
  ]
}

# Public demo app: anyone with the URL can open it. It holds demo data only.
resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.app.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

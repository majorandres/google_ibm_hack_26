terraform {
  required_version = ">= 1.5"
  required_providers {
    ibm = {
      source  = "IBM-Cloud/ibm"
      version = "~> 1.70"
    }
  }
}

provider "ibm" {
  ibmcloud_api_key = var.ibmcloud_api_key
  region           = var.region
}

# The hackathon account only grants Viewer on the resource group, so we cannot
# create service instances. Everything below lives inside instances IBM
# pre-provisioned for the team.

data "ibm_resource_group" "default" {
  name = "Default"
}

data "ibm_resource_instance" "code_engine" {
  name              = var.code_engine_project_name
  resource_group_id = data.ibm_resource_group.default.id
  service           = "codeengine"
}

locals {
  project_id = data.ibm_resource_instance.code_engine.guid
  image      = "${var.registry}/${var.cr_namespace}/${var.app_name}:${var.image_tag}"
}

resource "ibm_cr_namespace" "app" {
  name              = var.cr_namespace
  resource_group_id = data.ibm_resource_group.default.id
}

# Lets Code Engine pull the image from IBM Container Registry.
resource "ibm_code_engine_secret" "registry" {
  project_id = local.project_id
  name       = "${var.app_name}-registry"
  format     = "registry"
  data = {
    server   = var.registry
    username = "iamapikey"
    password = var.ibmcloud_api_key
  }
}

# Runtime secrets, exposed to the app as environment variables.
resource "ibm_code_engine_secret" "app" {
  project_id = local.project_id
  name       = "${var.app_name}-env"
  format     = "generic"
  data = {
    IBMCLOUD_API_KEY    = var.ibmcloud_api_key
    GOOGLE_MAPS_API_KEY = var.google_maps_api_key
  }
}

resource "ibm_code_engine_app" "app" {
  project_id      = local.project_id
  name            = var.app_name
  image_reference = local.image
  image_secret    = ibm_code_engine_secret.registry.name
  image_port      = 8080

  scale_min_instances = var.min_instances
  scale_max_instances = 2
  scale_cpu_limit     = "0.5"
  scale_memory_limit  = "1G"

  run_env_variables {
    type      = "secret_full_reference"
    reference = ibm_code_engine_secret.app.name
  }
  run_env_variables {
    type  = "literal"
    name  = "WATSONX_URL"
    value = var.watsonx_url
  }
  run_env_variables {
    type  = "literal"
    name  = "WATSONX_PROJECT_ID"
    value = var.watsonx_project_id
  }
  run_env_variables {
    type  = "literal"
    name  = "WATSONX_MODEL_ID"
    value = var.watsonx_model_id
  }

  depends_on = [ibm_cr_namespace.app]
}

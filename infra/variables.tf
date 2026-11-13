variable "ibmcloud_api_key" {
  description = "IBM Cloud API key. Pass via TF_VAR_ibmcloud_api_key; never commit it."
  type        = string
  sensitive   = true
}

variable "region" {
  type    = string
  default = "us-south"
}

variable "registry" {
  description = "IBM Container Registry host for the region."
  type        = string
  default     = "us.icr.io"
}

variable "code_engine_project_name" {
  description = "Pre-provisioned Code Engine project in the hackathon account."
  type        = string
  default     = "watsonx-Hackathon Code Engine"
}

variable "cr_namespace" {
  description = "Container Registry namespace. Must be unique within the registry region."
  type        = string
  default     = "midevfest-commute-check"
}

variable "app_name" {
  type    = string
  default = "commute-check"
}

variable "image_tag" {
  description = "Tag of the image pushed by scripts/deploy.sh."
  type        = string
  default     = "latest"
}

variable "min_instances" {
  description = "1 keeps the app warm for the demo; 0 scales to zero and saves credits."
  type        = number
  default     = 1
}

variable "watsonx_url" {
  type    = string
  default = "https://us-south.ml.cloud.ibm.com"
}

variable "watsonx_project_id" {
  type = string
}

variable "watsonx_model_id" {
  type    = string
  default = "ibm/granite-4-h-small"
}

variable "google_maps_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

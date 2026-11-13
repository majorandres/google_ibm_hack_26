variable "project_id" {
  description = "Google Cloud project to deploy into."
  type        = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "firestore_location" {
  description = "Firestore location. Cannot be changed after the database is created."
  type        = string
  default     = "nam5"
}

variable "app_name" {
  type    = string
  default = "riderecord"
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

variable "ibmcloud_api_key" {
  description = "IBM Cloud API key for watsonx.ai and Speech to Text. Pass via TF_VAR_ibmcloud_api_key; never commit it."
  type        = string
  sensitive   = true
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

variable "stt_url" {
  description = "URL of the Watson Speech to Text instance. Empty disables voice logging."
  type        = string
  default     = ""
}

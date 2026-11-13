output "app_url" {
  description = "Public URL of the deployed app."
  value       = ibm_code_engine_app.app.endpoint
}

output "image" {
  value = local.image
}

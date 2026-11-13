output "app_url" {
  description = "Public URL of the deployed app."
  value       = google_cloud_run_v2_service.app.uri
}

output "image" {
  value = local.image
}

output "bigquery_table" {
  value = local.bigquery_table
}

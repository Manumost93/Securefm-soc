output "backend_public_ip"  { value = module.compute.public_ip }
output "backend_public_dns" { value = module.compute.public_dns }
output "backend_api_url"    { value = "http://${module.compute.public_ip}:3001/api" }
output "backend_health_url" { value = "http://${module.compute.public_ip}:3001/api/health" }
output "vpc_id"             { value = module.networking.vpc_id }
output "rds_endpoint"       { value = module.database.db_endpoint; sensitive = true }
output "database_url"       { value = module.database.database_url; sensitive = true }
output "cloudwatch_log_group" { value = aws_cloudwatch_log_group.backend.name }
output "iam_role_arn"       { value = module.compute.iam_role_arn }

output "deploy_summary" {
  value = <<-EOT
    ====================================================
    SecureFM SOC — Infraestructura AWS (${var.environment})
    ====================================================
    Backend URL:    http://${module.compute.public_ip}:3001
    Health check:   http://${module.compute.public_ip}:3001/api/health
    CloudWatch:     /aws/ec2/${var.project_name}/${var.environment}/backend
    SSM Secrets:    /${var.project_name}/${var.environment}/*
    VPC:            ${module.networking.vpc_id}
    RDS Instance:   ${var.project_name}-${var.environment}-db

    Próximos pasos:
      ssh ec2-user@${module.compute.public_ip}
      docker exec securefm-backend npm run seed
    ====================================================
  EOT
}

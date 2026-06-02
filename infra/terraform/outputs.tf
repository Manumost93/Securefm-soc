# ============================================================
# SecureFM SOC — Terraform Outputs
# Valores exportados tras el apply (útiles para configurar CI/CD)
# ============================================================

output "backend_public_ip" {
  description = "IP pública del servidor backend"
  value       = aws_eip.backend.public_ip
}

output "backend_public_dns" {
  description = "DNS público del servidor backend"
  value       = aws_eip.backend.public_dns
}

output "backend_api_url" {
  description = "URL de la API del backend"
  value       = "http://${aws_eip.backend.public_ip}:3001/api"
}

output "rds_endpoint" {
  description = "Endpoint de la base de datos RDS (host:port)"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "rds_hostname" {
  description = "Hostname del servidor RDS"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "database_url" {
  description = "DATABASE_URL completa para el backend"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}?schema=public"
  sensitive   = true
}

output "vpc_id" {
  description = "ID de la VPC creada"
  value       = aws_vpc.main.id
}

output "deploy_summary" {
  description = "Resumen del despliegue"
  value = <<-EOT
    ============================================================
    SecureFM SOC — Infraestructura desplegada en AWS
    ============================================================
    Región:          ${var.aws_region}
    Entorno:         ${var.environment}
    Backend URL:     http://${aws_eip.backend.public_ip}:3001
    Health check:    http://${aws_eip.backend.public_ip}:3001/api/health
    RDS Instance:    ${aws_db_instance.postgres.identifier}

    Próximos pasos:
      1. Conectarte al backend: ssh ec2-user@${aws_eip.backend.public_ip}
      2. Ejecutar seed: docker exec securefm-backend npm run seed
      3. Configurar frontend con VITE_API_URL=http://${aws_eip.backend.public_ip}:3001/api
    ============================================================
  EOT
}

# ============================================================
# SecureFM SOC — Terraform Variables
# Infraestructura AWS (free tier compatible)
# ============================================================

variable "aws_region" {
  description = "Región AWS donde se desplegará la infraestructura"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Entorno de despliegue"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "El entorno debe ser development, staging o production."
  }
}

variable "project_name" {
  description = "Nombre del proyecto (usado en tags y nombres de recursos)"
  type        = string
  default     = "securefm-soc"
}

# ── Base de datos ──────────────────────────────────────────

variable "db_name" {
  description = "Nombre de la base de datos PostgreSQL"
  type        = string
  default     = "securefm_soc"
}

variable "db_username" {
  description = "Usuario de la base de datos"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Contraseña del usuario de la base de datos (mínimo 16 caracteres)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.db_password) >= 16
    error_message = "La contraseña de la base de datos debe tener al menos 16 caracteres."
  }
}

variable "db_instance_class" {
  description = "Clase de instancia RDS (db.t3.micro es elegible para free tier)"
  type        = string
  default     = "db.t3.micro"
}

# ── Backend ────────────────────────────────────────────────

variable "backend_instance_type" {
  description = "Tipo de instancia EC2 para el backend (t2.micro es elegible para free tier)"
  type        = string
  default     = "t2.micro"
}

variable "jwt_secret" {
  description = "Secreto JWT para el backend (mínimo 32 caracteres)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT_SECRET debe tener al menos 32 caracteres."
  }
}

variable "frontend_url" {
  description = "URL pública del frontend (para configurar CORS en el backend)"
  type        = string
  default     = "https://securefm-soc.example.com"
}

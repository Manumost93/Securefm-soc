variable "aws_region"   { type = string; default = "eu-west-1" }
variable "environment"  {
  type    = string
  default = "development"
  validation {
    condition     = contains(["development", "production"], var.environment)
    error_message = "El entorno debe ser development o production."
  }
}
variable "project_name" { type = string; default = "securefm-soc" }

variable "db_name"           { type = string; default = "securefm_soc" }
variable "db_username"       { type = string; sensitive = true }
variable "db_password"       {
  type      = string
  sensitive = true
  validation {
    condition     = length(var.db_password) >= 16
    error_message = "La contraseña debe tener al menos 16 caracteres."
  }
}
variable "db_instance_class" { type = string; default = "db.t3.micro" }
variable "allocated_storage" { type = number; default = 20 }

variable "backend_instance_type" { type = string; default = "t2.micro" }

variable "jwt_secret" {
  type      = string
  sensitive = true
  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT_SECRET debe tener al menos 32 caracteres."
  }
}
variable "frontend_url"      { type = string; default = "http://localhost:5173" }
variable "ssh_allowed_cidrs" { type = list(string); default = ["0.0.0.0/0"] }

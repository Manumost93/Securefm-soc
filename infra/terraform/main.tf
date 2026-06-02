# ============================================================
# SecureFM SOC — Terraform Root Module
#
# Orquesta los módulos networking, database y compute.
# Añade CloudWatch para observabilidad básica.
#
# Uso por entorno:
#   terraform init
#   terraform plan  -var-file="environments/dev.tfvars"
#   terraform apply -var-file="environments/prod.tfvars"
# ============================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "https://github.com/Manumost93/Securefm-soc"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ── Módulo: networking ─────────────────────────────────────
# VPC, subnets públicas/privadas, SGs para backend y RDS

module "networking" {
  source = "./modules/networking"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
  ssh_allowed_cidrs  = var.ssh_allowed_cidrs
}

# ── Módulo: database ───────────────────────────────────────
# RDS PostgreSQL en subnets privadas, cifrado, backups

module "database" {
  source = "./modules/database"

  project_name      = var.project_name
  environment       = var.environment
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  instance_class    = var.db_instance_class
  allocated_storage = var.allocated_storage
  private_subnet_ids = module.networking.private_subnet_ids
  rds_sg_id         = module.networking.rds_sg_id
}

# ── Módulo: compute ────────────────────────────────────────
# EC2 con IAM role, SSM Parameter Store para secretos, EIP

module "compute" {
  source = "./modules/compute"

  project_name     = var.project_name
  environment      = var.environment
  aws_region       = var.aws_region
  instance_type    = var.backend_instance_type
  public_subnet_id = module.networking.public_subnet_ids[0]
  backend_sg_id    = module.networking.backend_sg_id

  # Secretos — van a SSM Parameter Store cifrado, no al user_data
  jwt_secret   = var.jwt_secret
  database_url = module.database.database_url
  frontend_url = var.frontend_url
}

# ── CloudWatch — Observabilidad básica ────────────────────

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/ec2/${var.project_name}/${var.environment}/backend"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = { Name = "${var.project_name}-${var.environment}-logs" }
}

# Alarma: CPU alta en el backend
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-cpu-high"
  alarm_description   = "CPU del backend por encima del 80% durante 5 minutos"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    InstanceId = module.compute.instance_id
  }

  # Descomentar para recibir alertas por email (requiere SNS topic)
  # alarm_actions = [aws_sns_topic.alerts.arn]
}

# Alarma: memoria disponible baja (requiere CloudWatch Agent en la instancia)
resource "aws_cloudwatch_metric_alarm" "memory_low" {
  alarm_name          = "${var.project_name}-${var.environment}-memory-low"
  alarm_description   = "Memoria disponible por debajo de 200MB"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "mem_available_percent"
  namespace           = "CWAgent"
  period              = 300
  statistic           = "Average"
  threshold           = 20

  dimensions = {
    InstanceId = module.compute.instance_id
  }
}

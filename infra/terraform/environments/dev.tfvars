# ============================================================
# Entorno: DESARROLLO
# free tier — mínimos recursos, backups reducidos
# ============================================================

aws_region   = "eu-west-1"
environment  = "development"
project_name = "securefm-soc"

# Base de datos
db_name           = "securefm_soc_dev"
db_username       = "sfm_dev"
db_password       = "CHANGE_ME_dev_password_16chars+"
db_instance_class = "db.t3.micro"
allocated_storage = 20

# Backend EC2
backend_instance_type = "t2.micro"

# Secretos (sustituir con valores reales)
jwt_secret   = "CHANGE_ME_dev_jwt_secret_minimum_32_characters"
frontend_url = "http://localhost:5173"

# Red — en dev se puede permitir SSH desde cualquier IP
ssh_allowed_cidrs = ["0.0.0.0/0"]

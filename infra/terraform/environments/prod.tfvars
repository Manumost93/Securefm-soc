# ============================================================
# Entorno: PRODUCCIÓN
# Backups de 7 días, deletion_protection, SSH restringido
# ============================================================

aws_region   = "eu-west-1"
environment  = "production"
project_name = "securefm-soc"

# Base de datos
db_name           = "securefm_soc"
db_username       = "sfm_admin"
db_password       = "CHANGE_ME_prod_password_very_secure_32chars+"
db_instance_class = "db.t3.micro"
allocated_storage = 20

# Backend EC2
backend_instance_type = "t2.micro"

# Secretos (usar GitHub Secrets o AWS Secrets Manager en CI/CD)
jwt_secret   = "CHANGE_ME_prod_jwt_secret_generate_with_openssl_rand_hex_48"
frontend_url = "https://securefm-soc.vercel.app"

# Red — SSH solo desde tu IP pública en producción
ssh_allowed_cidrs = ["YOUR_IP/32"]

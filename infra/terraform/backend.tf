# ============================================================
# Terraform Backend — Estado remoto en S3 + bloqueo con DynamoDB
#
# El estado remoto permite trabajo en equipo y CI/CD:
# - S3 almacena el estado de forma segura y versionada
# - DynamoDB previene aplicaciones concurrentes (state locking)
#
# Para activarlo:
# 1. Crea el bucket S3 y la tabla DynamoDB primero (ver abajo)
# 2. Descomenta el bloque backend "s3" en terraform {}
# 3. Ejecuta: terraform init -reconfigure
#
# Crear recursos de backend (solo una vez, con AWS CLI):
#   aws s3 mb s3://securefm-terraform-state --region eu-west-1
#   aws s3api put-bucket-versioning \
#     --bucket securefm-terraform-state \
#     --versioning-configuration Status=Enabled
#   aws s3api put-bucket-encryption \
#     --bucket securefm-terraform-state \
#     --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
#   aws dynamodb create-table \
#     --table-name securefm-terraform-locks \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH \
#     --billing-mode PAY_PER_REQUEST \
#     --region eu-west-1
# ============================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Descomenta para activar estado remoto:
  # backend "s3" {
  #   bucket         = "securefm-terraform-state"
  #   key            = "securefm-soc/${terraform.workspace}/terraform.tfstate"
  #   region         = "eu-west-1"
  #   encrypt        = true
  #   dynamodb_table = "securefm-terraform-locks"
  # }
}

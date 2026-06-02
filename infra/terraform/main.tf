# ============================================================
# SecureFM SOC — Terraform Main
# Infraestructura AWS: RDS PostgreSQL + networking básico
#
# Free tier cubierto:
#   - RDS: db.t3.micro, 20 GB gp2, primer año gratis
#   - EC2: t2.micro, 750h/mes, primer año gratis
#
# Uso:
#   terraform init
#   terraform plan -var-file="terraform.tfvars"
#   terraform apply -var-file="terraform.tfvars"
# ============================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend remoto opcional — descomenta para guardar el estado en S3
  # backend "s3" {
  #   bucket = "securefm-terraform-state"
  #   key    = "securefm-soc/terraform.tfstate"
  #   region = "eu-west-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Data sources ────────────────────────────────────────────

# Zonas de disponibilidad de la región
data "aws_availability_zones" "available" {
  state = "available"
}

# ── VPC y Networking ────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Subnets públicas (para EC2/backend)
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
  }
}

# Subnets privadas (para RDS — buena práctica: BD no expuesta a internet)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-rt-public"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ── Security Groups ─────────────────────────────────────────

# SG para el backend EC2: permite HTTP, HTTPS y SSH
resource "aws_security_group" "backend" {
  name_prefix = "${var.project_name}-backend-"
  vpc_id      = aws_vpc.main.id
  description = "Security group para el backend SecureFM SOC"

  ingress {
    description = "API backend"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH (restringir a tu IP en producción real)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # TODO: cambiar a tu IP: ["X.X.X.X/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg-backend"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# SG para RDS: solo acepta conexiones desde el backend
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group para RDS PostgreSQL SecureFM SOC"

  ingress {
    description     = "PostgreSQL desde el backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg-rds"
  }
}

# ── RDS PostgreSQL ──────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-db"

  # Motor
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.db_instance_class

  # Almacenamiento (20 GB es el mínimo y es elegible para free tier)
  allocated_storage     = 20
  max_allocated_storage = 100 # Auto-scaling hasta 100 GB
  storage_type          = "gp2"
  storage_encrypted     = true

  # Credenciales
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Red
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # BD no expuesta a internet

  # Backups
  backup_retention_period = 7  # 7 días de backups automáticos
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Gestión
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"
  deletion_protection       = var.environment == "production"

  # Actualizaciones automáticas de parches menores
  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.project_name}-postgres"
  }
}

# ── EC2 — Backend ───────────────────────────────────────────
# Nota: Para producción real considera ECS Fargate o Elastic Beanstalk.
# Esta configuración EC2 es adecuada para portfolio y free tier.

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "backend" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.backend_instance_type
  subnet_id     = aws_subnet.public[0].id

  vpc_security_group_ids = [aws_security_group.backend.id]

  # User data: instala Docker y arranca el contenedor del backend
  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    db_url        = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}?schema=public"
    jwt_secret    = var.jwt_secret
    frontend_url  = var.frontend_url
    project_name  = var.project_name
  }))

  tags = {
    Name = "${var.project_name}-backend"
  }
}

# IP elástica para el backend (IP pública fija)
resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}

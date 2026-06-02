# ============================================================
# Módulo: compute
# EC2 con IAM role, SSM Parameter Store para secretos y EIP
#
# Patrón seguro: los secretos NO van en user_data en texto plano.
# La instancia EC2 los lee desde SSM Parameter Store en tiempo de ejecución.
# ============================================================

# ── IAM Role para EC2 ─────────────────────────────────────

resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = { Name = "${var.project_name}-${var.environment}-ec2-role" }
}

# Política: permite leer parámetros SSM del proyecto (solo los propios)
resource "aws_iam_role_policy" "ssm_read" {
  name = "ssm-read-${var.project_name}-${var.environment}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter", "ssm:GetParameters"]
      Resource = "arn:aws:ssm:*:*:parameter/${var.project_name}/${var.environment}/*"
    }]
  })
}

# Política: permite escribir logs en CloudWatch
resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-${var.environment}-instance-profile"
  role = aws_iam_role.ec2.name
}

# ── SSM Parameter Store — secretos cifrados ───────────────

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project_name}/${var.environment}/jwt_secret"
  type        = "SecureString"
  value       = var.jwt_secret
  description = "JWT Secret para ${var.project_name} (${var.environment})"
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "database_url" {
  name        = "/${var.project_name}/${var.environment}/database_url"
  type        = "SecureString"
  value       = var.database_url
  description = "DATABASE_URL para ${var.project_name} (${var.environment})"
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "frontend_url" {
  name        = "/${var.project_name}/${var.environment}/frontend_url"
  type        = "String"
  value       = var.frontend_url
  description = "FRONTEND_URL para CORS en ${var.project_name} (${var.environment})"
}

# ── EC2 Instance ───────────────────────────────────────────

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [var.backend_sg_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  # Los secretos se leen de SSM — no hay secretos en texto plano aquí
  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    project_name = var.project_name
    environment  = var.environment
    aws_region   = var.aws_region
  }))

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  tags = { Name = "${var.project_name}-${var.environment}-backend" }
}

# ── Elastic IP ─────────────────────────────────────────────

resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"
  tags     = { Name = "${var.project_name}-${var.environment}-eip" }
}

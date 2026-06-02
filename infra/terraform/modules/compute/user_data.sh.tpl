#!/bin/bash
# Script de inicialización EC2
# Los secretos se leen de SSM Parameter Store — nunca en texto plano

set -euo pipefail

PROJECT="${project_name}"
ENV="${environment}"
REGION="${aws_region}"
SSM_PREFIX="/$PROJECT/$ENV"

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $1"; }

log "Iniciando setup de SecureFM SOC backend..."

# Instalar Docker
dnf update -y
dnf install -y docker aws-cli
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Instalar Docker Compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

log "Leyendo secretos desde SSM Parameter Store..."

# Leer secretos de SSM (cifrados con KMS)
JWT_SECRET=$(aws ssm get-parameter \
  --region "$REGION" \
  --name "$SSM_PREFIX/jwt_secret" \
  --with-decryption \
  --query Parameter.Value \
  --output text)

DATABASE_URL=$(aws ssm get-parameter \
  --region "$REGION" \
  --name "$SSM_PREFIX/database_url" \
  --with-decryption \
  --query Parameter.Value \
  --output text)

FRONTEND_URL=$(aws ssm get-parameter \
  --region "$REGION" \
  --name "$SSM_PREFIX/frontend_url" \
  --query Parameter.Value \
  --output text)

log "Clonando repositorio..."
git clone https://github.com/Manumost93/Securefm-soc.git /opt/securefm-soc
cd /opt/securefm-soc

# Crear .env del backend con secretos leídos de SSM
cat > /opt/securefm-soc/backend/.env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=8h
FRONTEND_URL=$FRONTEND_URL
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
EOF

chmod 600 /opt/securefm-soc/backend/.env

log "Construyendo imagen Docker..."
docker build -t "$PROJECT-backend:latest" ./backend

log "Arrancando contenedor..."
docker run -d \
  --name securefm-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file /opt/securefm-soc/backend/.env \
  "$PROJECT-backend:latest"

log "Backend arrancado correctamente en puerto 3001"
log "Health check: curl http://localhost:3001/api/health"

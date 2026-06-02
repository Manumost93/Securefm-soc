#!/bin/bash
# Script de inicialización de la instancia EC2
# Se ejecuta una sola vez al arrancar la instancia por primera vez

set -e

# Instalar Docker
dnf update -y
dnf install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Instalar Docker Compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Clonar el repositorio
git clone https://github.com/Manumost93/Securefm-soc.git /opt/securefm-soc
cd /opt/securefm-soc

# Crear archivo de variables de entorno del backend
cat > /opt/securefm-soc/backend/.env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=${db_url}
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=8h
FRONTEND_URL=${frontend_url}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
EOF

# Construir y arrancar solo el backend (la BD es RDS, no local)
docker build -t ${project_name}-backend ./backend
docker run -d \
  --name securefm-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file ./backend/.env \
  ${project_name}-backend

echo "SecureFM SOC backend arrancado correctamente"

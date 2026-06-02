# Guía de Despliegue — SecureFM SOC

Tres formas de desplegar el proyecto: local, Docker y cloud (AWS con Terraform).

---

## Opción A — Desarrollo local

```bash
# 1. Clonar
git clone https://github.com/Manumost93/Securefm-soc.git
cd Securefm-soc

# 2. Backend
cd backend
cp .env.example .env          # Editar DATABASE_URL y JWT_SECRET
npm install
npm run db:migrate             # Crea tablas en PostgreSQL
npm run seed                   # Datos demo
npm run dev                    # Puerto 3001

# 3. Frontend (otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                    # Puerto 5173
```

**Requisitos:** Node.js 18+, PostgreSQL 14+ (o Docker para la BD)

---

## Opción B — Docker Compose (recomendado para demo)

```bash
cp .env.example .env
# Editar JWT_SECRET en .env (obligatorio)

docker compose up --build -d
docker compose exec backend npm run seed

# Abrir: http://localhost
```

Levanta PostgreSQL + backend + frontend Nginx en un solo comando. Ver [docs/DOCKER.md](DOCKER.md).

---

## Opción C — Cloud con Terraform + AWS

### Arquitectura desplegada

```
Internet ─── EC2 t2.micro (backend) ─── RDS db.t3.micro (PostgreSQL)
              IAM Role ──────────────── SSM Parameter Store (secretos)
              CloudWatch Logs + Alarms
```

### Prerrequisitos

```bash
# Terraform >= 1.5
terraform -version

# AWS CLI con credenciales configuradas
aws configure
aws sts get-caller-identity   # Verificar que funciona
```

### Despliegue paso a paso

```bash
cd infra/terraform

# 1. Inicializar (descarga provider AWS)
terraform init

# 2. Revisar plan — qué se va a crear
terraform plan -var-file="environments/prod.tfvars"

# 3. Aplicar (escribe "yes" para confirmar)
terraform apply -var-file="environments/prod.tfvars"

# 4. Ver outputs (IP, URLs, etc.)
terraform output

# 5. Cargar datos demo (una vez que la instancia esté lista ~2min)
ssh ec2-user@$(terraform output -raw backend_public_ip)
docker exec securefm-backend npm run seed
```

### Variables obligatorias en prod.tfvars

```hcl
db_username = "sfm_admin"
db_password = "contraseña-segura-16-chars+"
jwt_secret  = "secreto-jwt-32-chars-minimo"
frontend_url = "https://tu-frontend.vercel.app"
ssh_allowed_cidrs = ["TU_IP/32"]
```

### Gestión de secretos — SSM Parameter Store

Los secretos **no se pasan en texto plano** al EC2. Terraform los almacena en AWS SSM Parameter Store cifrados con KMS y la instancia los lee en tiempo de ejecución con su IAM role:

```
Terraform → SSM: /securefm-soc/production/jwt_secret    (SecureString)
Terraform → SSM: /securefm-soc/production/database_url  (SecureString)
EC2 (IAM role) → aws ssm get-parameter → lee el secreto al arrancar
```

### Estado remoto (trabajo en equipo / CI/CD)

Activa el backend S3 para compartir el estado entre máquinas:

```bash
# Crear recursos de backend (una sola vez)
aws s3 mb s3://securefm-terraform-state --region eu-west-1
aws dynamodb create-table \
  --table-name securefm-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Descomentar el bloque backend "s3" en backend.tf
# Luego:
terraform init -reconfigure
```

### Destruir la infraestructura

```bash
terraform destroy -var-file="environments/prod.tfvars"
# ATENCIÓN: elimina BD, EC2 y todos los recursos
```

---

## Despliegue del frontend en Vercel (gratuito)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la carpeta frontend/
cd frontend
vercel

# Variables de entorno en Vercel:
# VITE_API_URL = https://tu-backend.com/api
```

El archivo `frontend/vercel.json` ya está configurado para React Router (SPA routing).

---

## Variables de entorno por entorno

| Variable | Dev | Prod |
|----------|-----|------|
| `NODE_ENV` | `development` | `production` |
| `DATABASE_URL` | Local PostgreSQL | RDS vía SSM |
| `JWT_SECRET` | En `.env` | SSM Parameter Store |
| `FRONTEND_URL` | `http://localhost:5173` | URL de Vercel |
| `RATE_LIMIT_MAX` | 200 | 200 |

---

## Checklist antes de publicar

- [ ] `JWT_SECRET` tiene al menos 32 caracteres aleatorios
- [ ] `POSTGRES_PASSWORD` tiene al menos 16 caracteres
- [ ] `ssh_allowed_cidrs` restringido a tu IP (no `0.0.0.0/0`)
- [ ] `deletion_protection = true` en RDS de producción
- [ ] Backups habilitados (7 días en prod)
- [ ] `FRONTEND_URL` apunta al dominio real (CORS)
- [ ] Los secretos NO están en el repositorio git
- [ ] El pipeline CI está en verde antes del deploy

## Checklist después de publicar

- [ ] `GET /api/health` responde `{"status":"ok","database":"connected"}`
- [ ] Login funciona con usuarios demo
- [ ] SOC Dashboard muestra eventos
- [ ] Auditor web analiza una URL externa
- [ ] CloudWatch Logs recibe entradas

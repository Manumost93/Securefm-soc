# SecureFM SOC — Cloud & DevSecOps Edition

[![CI](https://github.com/Manumost93/Securefm-soc/actions/workflows/ci.yml/badge.svg)](https://github.com/Manumost93/Securefm-soc/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Manumost93/Securefm-soc/actions/workflows/codeql.yml/badge.svg)](https://github.com/Manumost93/Securefm-soc/actions/workflows/codeql.yml)
[![Terraform](https://github.com/Manumost93/Securefm-soc/actions/workflows/terraform.yml/badge.svg)](https://github.com/Manumost93/Securefm-soc/actions/workflows/terraform.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Plataforma fullstack de **gestión de incidencias técnicas** y **monitorización de seguridad**, con pipeline DevSecOps completo e infraestructura como código en AWS.

---

## Tabla de contenidos

- [¿Qué es?](#qué-es)
- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Módulos](#módulos)
- [Inicio rápido](#inicio-rápido)
- [Docker](#docker)
- [Testing](#testing)
- [CI/CD y DevSecOps](#cicd-y-devsecops)
- [Infraestructura con Terraform](#infraestructura-con-terraform)
- [Seguridad](#seguridad)
- [Usuarios demo](#usuarios-demo)
- [Documentación](#documentación)
- [Autor](#autor)

---

## ¿Qué es?

SecureFM SOC combina dos mundos reales en una sola plataforma:

**Facility Management (CAFM/CMMS):** Sistema completo de gestión de incidencias técnicas de mantenimiento — electricidad, climatización, fontanería, IT, seguridad — con flujo de trabajo real: crear, asignar a técnicos, comentar, cambiar estado y cerrar. Control de acceso por roles con historial de acciones.

**Ciberseguridad aplicada:** Dashboard SOC que registra y visualiza en tiempo real todos los eventos de seguridad del sistema (logins, accesos denegados, cambios de rol, alertas de IP). Auditor web pasivo que analiza cabeceras HTTP de cualquier URL y genera un informe de riesgo con puntuación 0-100.

Lo diferenciador: el auditor hace peticiones HTTP salientes desde el servidor, lo que convierte la **protección contra SSRF** en un requisito real — no simulado.

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Recharts |
| **Backend** | Node.js 18+, Express 4, TypeScript 5 |
| **Base de datos** | PostgreSQL 16 + Prisma ORM 5 (migraciones versionadas) |
| **Autenticación** | JWT HS256 + bcrypt factor 12 |
| **Seguridad** | Helmet, CORS restrictivo, express-rate-limit, express-validator |
| **Testing** | Jest 29, Supertest 6, ts-jest |
| **CI/CD** | GitHub Actions, CodeQL, Dependabot |
| **Contenedores** | Docker multi-stage, Nginx, Docker Compose |
| **IaC** | Terraform 1.5+, AWS (VPC, RDS, EC2, SSM, CloudWatch, IAM) |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     Producción (AWS)                    │
│                                                         │
│  Internet ─── EC2 t2.micro ──────── RDS PostgreSQL      │
│                   │                 (subnet privada)     │
│               IAM Role ─────────── SSM Parameter Store  │
│               Docker               (JWT, DB URL)        │
│               Backend              CloudWatch Logs      │
│               :3001                + Alarmas CPU/Mem    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Docker Compose (local/demo)             │
│                                                         │
│  :80 Nginx ─── proxy /api ─── :3001 Backend             │
│  React SPA                    Node/Express              │
│                               Prisma ORM                │
│                               :5432 PostgreSQL          │
└─────────────────────────────────────────────────────────┘
```

---

## Módulos

### Gestión de incidencias (CAFM/CMMS)
- Tickets con categorías reales: Electricidad, Climatización, Fontanería, IT, Seguridad, Prevención...
- Flujo completo: crear → asignar → comentar → cambiar estado → cerrar
- Filtros por estado, prioridad, categoría, técnico asignado y texto libre
- Exportación a CSV, historial de acciones por ticket

### SOC Dashboard
- Contadores en tiempo real: total eventos, críticos, logins fallidos, accesos denegados
- Gráficas: distribución por tipo de evento (BarChart) y por severidad (PieChart)
- Mapa de IPs sospechosas, actividad por país
- Badge de notificación con polling cada 60s para eventos críticos
- Filtros y exportación a CSV

### WebSec Auditor (con hardening SSRF)
- Análisis pasivo de cabeceras HTTP: CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Puntuación 0-100 con informe de riesgos y recomendaciones priorizadas
- Protección SSRF: bloqueo de RFC 1918, link-local (169.254.x.x), resolución DNS + validación contra DNS rebinding
- Rate limit específico: 10 peticiones / 15 minutos por IP
- Cada auditoría genera un evento en el SOC Dashboard

### Gestión de usuarios (admin)
- CRUD de usuarios con roles (admin / technician / viewer)
- Cambios de rol registrados con severidad `high` en el SOC

---

## Inicio rápido

### Desarrollo local

```bash
git clone https://github.com/Manumost93/Securefm-soc.git
cd Securefm-soc

# Backend
cd backend
cp .env.example .env        # Editar JWT_SECRET y DATABASE_URL
npm install
npm run db:migrate          # Crea tablas (requiere PostgreSQL corriendo)
npm run seed                # Datos demo
npm run dev                 # http://localhost:3001

# Frontend (otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Usuarios demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@securefm.local` | `Admin123!` | admin |
| `tech@securefm.local` | `Tech123!` | technician |
| `tech2@securefm.local` | `Tech123!` | technician |
| `viewer@securefm.local` | `Viewer123!` | viewer |

---

## Docker

Un solo comando para levantar PostgreSQL + backend + frontend:

```bash
cp .env.example .env
# Editar JWT_SECRET en .env

docker compose up --build -d
docker compose exec backend npm run seed

# Abrir: http://localhost
```

El frontend Nginx proxea `/api` al backend — sin configuración adicional de CORS.

Ver [docs/DOCKER.md](docs/DOCKER.md) para comandos completos.

---

## Testing

```bash
cd backend
npm run test             # 28 tests
npm run test:coverage    # Con informe de cobertura
```

**Cobertura:**

| Suite | Tests | Qué verifica |
|-------|-------|-------------|
| `health.test.ts` | 3 | Endpoint `/api/health`, 404 |
| `auth.test.ts` | 9 | Login, JWT, `/me`, validaciones de input |
| `rbac.test.ts` | 10 | Todos los roles vs todos los endpoints sensibles |
| `tickets.test.ts` | 6 | CRUD, filtros, stats, 404 |

Estrategia: Prisma mockeado — tests rápidos sin base de datos, ejecutables en CI.

Ver [docs/TESTING.md](docs/TESTING.md).

---

## CI/CD y DevSecOps

```
push/PR a master ──┬── lint-backend ──────────────────── ✅
                   ├── test-backend ── build-backend ──── ✅
                   ├── build-frontend ─────────────────── ✅
                   ├── security-audit (npm audit) ──────── ⚠️
                   └── docker-build-check (solo master) ── ✅

Paralelo ──────────── CodeQL analysis ─────────────────── Pestaña Security
Semanal ───────────── Dependabot PRs ──────────────────── npm + Docker + Actions
```

**Herramientas:**
- **GitHub Actions** — lint, test, build, audit, docker check
- **CodeQL** — análisis estático de vulnerabilidades en TypeScript
- **Dependabot** — PRs automáticos semanales para npm, Docker, GitHub Actions
- **Terraform CI** — `fmt`, `validate`, `plan` en cambios de infraestructura

Ver [docs/CI_CD.md](docs/CI_CD.md).

---

## Infraestructura con Terraform

Estructura modular para despliegue en AWS (free tier compatible):

```
infra/terraform/
├── backend.tf              # Estado remoto S3 + DynamoDB (documentado)
├── main.tf                 # Orquesta módulos + CloudWatch
├── modules/
│   ├── networking/         # VPC, subnets, Internet GW, Security Groups
│   ├── database/           # RDS PostgreSQL en subnet privada
│   └── compute/            # EC2 + IAM Role + SSM Parameter Store + EIP
└── environments/
    ├── dev.tfvars
    └── prod.tfvars
```

**Patrón de seguridad para secretos:** Los secretos (JWT, DATABASE_URL) no van en `user_data` en texto plano. Terraform los almacena en **SSM Parameter Store** como `SecureString` cifrados con KMS. La instancia EC2 los lee en tiempo de ejecución con su IAM role.

```bash
cd infra/terraform
terraform init
terraform plan  -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/prod.tfvars"
```

Ver [infra/README.md](infra/README.md) y [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Seguridad

| Medida | Implementación |
|--------|---------------|
| **Autenticación** | JWT HS256, expiración 8h, falla al arrancar si no hay secret |
| **Contraseñas** | bcrypt factor 12, nunca expuestas en respuestas |
| **RBAC** | Middleware `authorize(...roles)` por endpoint; 3 roles diferenciados |
| **Rate limiting** | Global 200/15min · Login 20/15min · Auditor 10/15min |
| **Cabeceras HTTP** | Helmet (CSP, X-Frame-Options, HSTS, nosniff...) |
| **CORS** | Origen único configurable, métodos y headers restringidos |
| **Validación** | express-validator en todos los inputs |
| **SQL Injection** | Prisma ORM con queries parametrizadas |
| **SSRF** | Whitelist de protocolos, bloqueo RFC 1918 + link-local, DNS rebinding |
| **Logs de seguridad** | SecurityLog con IP, User-Agent, severidad y timestamp |
| **Secretos en prod** | SSM Parameter Store cifrado con KMS |

Documentación completa:
- [security/THREAT_MODEL.md](security/THREAT_MODEL.md) — Análisis STRIDE
- [security/OWASP_TOP_10.md](security/OWASP_TOP_10.md) — A01-A10 con referencias al código
- [security/WEB_AUDITOR_SECURITY.md](security/WEB_AUDITOR_SECURITY.md) — Hardening del auditor
- [security/DEVSECOPS_PIPELINE.md](security/DEVSECOPS_PIPELINE.md) — Pipeline de seguridad

---

## Endpoints principales

| Método | Ruta | Descripción | Rol mínimo |
|--------|------|-------------|------------|
| `POST` | `/api/auth/login` | Login, devuelve JWT | Público |
| `GET` | `/api/auth/me` | Usuario autenticado | Auth |
| `GET` | `/api/health` | Estado del sistema + BD | Público |
| `GET` | `/api/metrics` | Métricas del sistema | Technician |
| `GET` | `/api/tickets` | Listado con filtros | Auth |
| `POST` | `/api/tickets` | Crear ticket | Technician |
| `DELETE` | `/api/tickets/:id` | Eliminar ticket | Admin |
| `GET` | `/api/logs` | Eventos de seguridad | Technician |
| `GET` | `/api/logs/stats` | Estadísticas SOC | Technician |
| `POST` | `/api/audit` | Auditar URL (SSRF protegido) | Auth |
| `GET` | `/api/users` | Listado usuarios | Admin |

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/DATABASE.md](docs/DATABASE.md) | Setup PostgreSQL, migraciones, scripts |
| [docs/DOCKER.md](docs/DOCKER.md) | Dockerización completa, comandos, troubleshooting |
| [docs/TESTING.md](docs/TESTING.md) | Suite de tests, estrategia de mocking, cómo añadir tests |
| [docs/CI_CD.md](docs/CI_CD.md) | Pipeline GitHub Actions, CodeQL, Dependabot |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Despliegue local, Docker y AWS con Terraform |
| [docs/TECHNICAL_AUDIT.md](docs/TECHNICAL_AUDIT.md) | Auditoría técnica inicial y plan de evolución |
| [security/THREAT_MODEL.md](security/THREAT_MODEL.md) | Modelado de amenazas STRIDE |
| [security/OWASP_TOP_10.md](security/OWASP_TOP_10.md) | OWASP Top 10 implementado |
| [infra/README.md](infra/README.md) | Guía de Terraform, módulos, estado remoto |

---

## Autor

**Manuel** — Estudiante de DAM con orientación a backend, ciberseguridad aplicada y DevOps.

Prácticas en Prosegur · Java, TypeScript, React, Python, SQL, Docker, Terraform, seguridad de aplicaciones.

[![GitHub](https://img.shields.io/badge/GitHub-Manumost93-181717?logo=github)](https://github.com/Manumost93)

---

## Licencia

MIT — Libre para uso, modificación y distribución con atribución.

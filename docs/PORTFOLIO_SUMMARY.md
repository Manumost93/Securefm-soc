# Portfolio Summary — SecureFM SOC

Material listo para CV, LinkedIn, GitHub y entrevistas técnicas.

---

## Descripción para CV (1-2 líneas)

> **SecureFM SOC — Cloud & DevSecOps Edition** — Plataforma fullstack de gestión de incidencias técnicas y monitorización de seguridad. React 18 + TypeScript, Node.js/Express, PostgreSQL, Docker, CI/CD con GitHub Actions, 28 tests automatizados (Jest/Supertest), hardening SSRF, OWASP Top 10 implementado e infraestructura como código con Terraform modular en AWS (VPC, RDS, EC2, SSM, CloudWatch).

---

## Descripción para LinkedIn (3-5 líneas)

> Desarrollé **SecureFM SOC**, una plataforma que combina gestión de incidencias técnicas (CAFM/CMMS) con monitorización de seguridad estilo SOC y un auditor web pasivo con protección completa contra SSRF.
>
> Stack: React 18, TypeScript, Node.js, Express, Prisma ORM, PostgreSQL. Infraestructura con Docker (multi-stage builds, Nginx, docker-compose) y Terraform modular en AWS (VPC, RDS, EC2, SSM Parameter Store, CloudWatch).
>
> Pipeline CI/CD con GitHub Actions: lint, 28 tests automatizados, build TypeScript + Vite, npm audit, CodeQL y verificación de imágenes Docker. Dependabot para actualizaciones semanales.
>
> Seguridad: RBAC por middleware, JWT con validación estricta, bcrypt factor 12, rate limiting diferenciado, Helmet, CORS restrictivo, Threat Model (STRIDE) y documentación OWASP Top 10 con referencias al código real.

---

## Descripción larga para portfolio web

**SecureFM SOC — Cloud & DevSecOps Edition** combina tres áreas que raramente aparecen juntas en un portfolio: desarrollo web profesional, orientación a seguridad desde el diseño y preparación para despliegue cloud real.

El sistema gestiona incidencias técnicas de mantenimiento (electricidad, climatización, IT, fontanería...) con flujo completo de tickets, asignación de técnicos y roles diferenciados. A esto se superpone un dashboard SOC que registra y visualiza eventos de seguridad en tiempo real, y un auditor web pasivo con protección completa contra SSRF.

El proyecto no es solo código funcional: incluye tests reales, pipeline CI/CD, análisis estático de seguridad, infraestructura como código con Terraform, dockerización completa y documentación técnica de nivel profesional.

---

## Bullet points técnicos (para CV, LinkedIn o entrevista)

- Fullstack React 18 + TypeScript + Node.js/Express + Prisma + PostgreSQL
- RBAC con middleware reutilizable; JWT validado al arranque del servidor (falla explícita sin secret)
- Hardening SSRF completo: bloqueo de RFC 1918, link-local, resolución DNS + validación (DNS rebinding)
- 28 tests automatizados con Jest + Supertest (auth, RBAC, tickets, health) — Prisma mockeado, sin BD en CI
- CI/CD con GitHub Actions: 6 jobs + CodeQL semanal + Dependabot + Terraform CI
- Docker multi-stage: backend Node Alpine + frontend Nginx; docker-compose con healthchecks
- Terraform modular (networking, database, compute) con SSM Parameter Store para secretos — sin texto plano en user_data
- AWS: VPC, subnets públicas/privadas, RDS PostgreSQL cifrado, EC2 con IAM role, CloudWatch alarmas
- Threat Model STRIDE, OWASP Top 10 con referencias al código, DEVSECOPS_PIPELINE documentado

---

## Competencias demostradas

| Área | Tecnologías / Prácticas |
|------|------------------------|
| Frontend | React 18, TypeScript, Vite, Tailwind, Recharts, React Router |
| Backend | Node.js, Express, Prisma ORM, PostgreSQL, JWT, bcrypt |
| Testing | Jest, Supertest, mocking de dependencias |
| CI/CD | GitHub Actions, CodeQL, Dependabot, npm audit |
| Docker | Multi-stage builds, Nginx SPA, docker-compose, healthchecks |
| IaC | Terraform modular, AWS provider, SSM, CloudWatch |
| AppSec | OWASP, SSRF, RBAC, rate limiting, Helmet, Threat Model |
| Observabilidad | Health checks con DB, métricas custom, CloudWatch |

---

## Cómo explicarlo en entrevista

**"Cuéntame sobre este proyecto"**

> "Es una plataforma para gestión de incidencias técnicas de mantenimiento, con un panel SOC básico y un auditor web pasivo. Lo interesante es que tiene capas reales de seguridad y DevOps: CI/CD con GitHub Actions y CodeQL, tests automatizados con Prisma mockeado, Docker multi-stage, y Terraform modular para AWS. El módulo más técnico es el auditor web, donde implementé protección completa contra SSRF con resolución DNS para prevenir DNS rebinding y bloqueo de los endpoints de metadata de cloud."

**"¿Qué es SSRF y cómo lo mitigaste?"**

> "Es cuando un atacante usa el servidor para hacer peticiones a recursos internos. Implementé validación de protocolo, bloqueo de rangos privados RFC 1918 y link-local, resolución DNS del hostname con verificación de la IP resultante para prevenir DNS rebinding, rate limit específico de 10 req/15min para el endpoint, y logging de cada intento bloqueado como evento de seguridad con severidad alta."

**"¿Cómo gestionas secretos en Terraform?"**

> "Los secretos no van en el user_data del EC2 en texto plano. Terraform los almacena en SSM Parameter Store como SecureString cifrados con KMS. La instancia EC2 los lee al arrancar usando su IAM role, que solo tiene permisos para leer los parámetros de su propio proyecto y entorno."

**"¿Por qué usas Prisma mockeado en tests en lugar de una BD real?"**

> "Para que los tests sean rápidos, sin dependencias externas, y ejecutables en CI sin PostgreSQL. Es una decisión pragmática documentada — tengo claro el trade-off: pierdo la verificación de queries SQL reales, pero gano velocidad y simplicidad. Para el siguiente paso añadiría un job de integración con PostgreSQL como servicio en el CI."

---

## Mejoras futuras mencionables en entrevista

- HttpOnly cookies para JWT (elimina riesgo XSS → localStorage)
- Blacklist de JWT en Redis para revocación inmediata al cambiar rol
- Tests de integración con PostgreSQL real en CI (`services: postgres:`)
- ECS Fargate o App Runner en lugar de EC2 (contenedores sin gestionar servidores)
- Exportar SecurityLog a CloudWatch Logs o Elastic para retención e integridad
- Microservicio Java/Spring Boot como motor de cálculo de riesgo de incidencias
- MFA para cuentas admin

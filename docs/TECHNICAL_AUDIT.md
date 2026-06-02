# TECHNICAL AUDIT — SecureFM SOC

**Versión auditada:** 1.0.0  
**Fecha:** Junio 2026  
**Objetivo:** Diagnóstico técnico completo previo a la evolución hacia SecureFM SOC — Cloud & DevSecOps Edition  
**Auditor:** Análisis automatizado + revisión de código fuente

---

## 1. Resumen Ejecutivo

SecureFM SOC es un proyecto fullstack de nivel intermedio con una propuesta de valor diferenciadora: combinar gestión de incidencias técnicas (CAFM/CMMS) con monitorización de seguridad (SOC básico) y un auditor web pasivo. El código base es funcional, limpio y está bien estructurado para su etapa actual.

**Estado general: BUENA BASE, PREPARACIÓN PARA PRODUCCIÓN INSUFICIENTE.**

El proyecto demuestra competencias reales de desarrollo web, seguridad de aplicaciones y diseño de sistemas. Sin embargo, carece de los elementos que separan un proyecto de portfolio básico de un proyecto defendible en entrevista técnica para roles de backend/cloud/DevSecOps:

- Sin tests.
- Sin CI/CD.
- Sin Docker.
- Base de datos SQLite (no apta para producción real).
- Varios riesgos de seguridad pendientes documentados pero no resueltos.
- Scripts de npm incompletos.

El potencial es alto. La evolución está bien planificada.

---

## 2. Stack Técnico Detectado

### Frontend
| Elemento | Versión | Valoración |
|----------|---------|-----------|
| React | 18.2 | ✅ Actual |
| TypeScript | 5.3 | ✅ Actual |
| Vite | 5.0 | ✅ Actual |
| Tailwind CSS | 3.4 | ✅ Actual |
| React Router DOM | 6.21 | ✅ Actual |
| Recharts | 2.10 | ✅ Adecuado |
| Axios | 1.6 | ✅ Actual |
| date-fns | 3.1 | ✅ Actual |
| Lucide React | 0.303 | ✅ Adecuado |
| ESLint | 8.56 | ⚠️ Sin `npm run lint` configurado en CI |

### Backend
| Elemento | Versión | Valoración |
|----------|---------|-----------|
| Node.js | ≥18 | ✅ Actual |
| Express | 4.18 | ✅ Estable |
| TypeScript | 5.3 | ✅ Actual |
| Prisma ORM | 5.22 | ✅ Actual |
| SQLite | (vía Prisma) | ❌ No apto para producción |
| JWT (jsonwebtoken) | 9.0 | ✅ Actual |
| bcryptjs | 2.4 | ✅ Factor 12 correcto |
| Helmet | 7.1 | ✅ Actual |
| express-rate-limit | 7.1 | ✅ Actual |
| express-validator | 7.0 | ✅ Actual |
| CORS | 2.8 | ✅ Configurado correctamente |
| node-fetch | 3.3 | ✅ Para auditor web |
| ts-node / ts-node-dev | 10.9 / 2.0 | ⚠️ En production deps (deberían ser devDeps) |

---

## 3. Estructura del Proyecto

```
securefm-soc/
├── backend/
│   ├── src/
│   │   ├── controllers/         ✅ Separación correcta por módulo
│   │   │   ├── auth.controller.ts
│   │   │   ├── tickets.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── logs.controller.ts
│   │   │   ├── audit.controller.ts
│   │   │   └── profile.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   ✅ JWT + RBAC
│   │   │   └── error.middleware.ts  ✅ Centralizado
│   │   ├── routes/              ✅ Un archivo por módulo
│   │   ├── services/
│   │   │   └── log.service.ts   ⚠️ Lógica de país aleatoria (ver deuda técnica)
│   │   ├── types/index.ts       ✅ Tipos propios definidos
│   │   ├── app.ts               ✅ Config Express bien organizada
│   │   └── server.ts            ✅ Entrada limpia
│   ├── prisma/
│   │   ├── schema.prisma        ⚠️ SQLite, sin índices explícitos
│   │   └── seed.ts              ✅ Datos demo completos
│   ├── .env.example             ⚠️ Incompleto (falta POSTGRES_*)
│   └── package.json             ⚠️ Varios problemas (ver deuda técnica)
│
├── frontend/
│   ├── src/
│   │   ├── components/          ✅ Layout + UI reutilizables
│   │   ├── context/             ✅ AuthContext correcto
│   │   ├── pages/               ✅ 10 páginas bien organizadas
│   │   ├── services/api.ts      ✅ Interceptores JWT
│   │   ├── types/index.ts       ✅
│   │   └── utils/export.ts      ✅ CSV export
│   ├── .env.example             ✅ Mínimo pero correcto
│   └── package.json             ✅ Bien estructurado
│
├── docs/
│   ├── API.md                   ✅ Documentado
│   ├── OWASP_RISKS.md           ✅ Buen análisis inicial
│   ├── SECURITY.md              ✅ Presente
│   └── PORTFOLIO_SUMMARY.md     ✅ Presente
│
├── README.md                    ✅ Buena base, mejorable
└── .gitignore                   ⚠️ Mejorable (ver puntos débiles)
```

**Ausencias críticas detectadas:**
- ❌ Sin `tests/` en backend ni frontend
- ❌ Sin `.github/workflows/`
- ❌ Sin `Dockerfile` ni `docker-compose.yml`
- ❌ Sin `.github/dependabot.yml`

---

## 4. Funcionalidades Existentes

| Módulo | Estado | Calidad |
|--------|--------|---------|
| Login / Logout | ✅ Funcional | Buena |
| Gestión de tickets (CRUD) | ✅ Funcional | Buena |
| Asignación de técnicos | ✅ Funcional | Buena |
| Comentarios en tickets | ✅ Funcional | Buena |
| Filtros y búsqueda de tickets | ✅ Funcional | Buena |
| Exportación CSV (tickets) | ✅ Funcional | Buena |
| SOC Dashboard + gráficas | ✅ Funcional | Buena |
| Exportación CSV (logs SOC) | ✅ Funcional | Buena |
| Badge notificaciones críticas | ✅ Funcional | Buena |
| WebSec Auditor (pasivo) | ✅ Funcional | Mejorable (SSRF) |
| Gestión de usuarios (admin) | ✅ Funcional | Buena |
| Perfil (nombre + contraseña) | ✅ Funcional | Buena |
| RBAC (admin/technician/viewer) | ✅ Funcional | Buena |
| Health check (`/health`) | ✅ Presente | Mejorable (fuera de `/api`) |
| Seed con datos demo | ✅ Funcional | Buena |

---

## 5. Puntos Fuertes del Proyecto

1. **Propuesta de valor diferenciadora:** La combinación CAFM + SOC + WebSec Auditor es genuinamente original y difícil de encontrar en portfolios.

2. **Arquitectura por capas correcta:** routes → controllers → services → database. Código organizado y entendible.

3. **TypeScript estricto en ambos lados:** Buena señal de madurez técnica.

4. **Seguridad de autenticación correcta:**
   - bcrypt factor 12 (coste alto intencional)
   - JWT bien implementado con expiración
   - Rate limiting en login (20 req/15min)
   - Mensajes de error genéricos (no revela si el email existe)

5. **RBAC real funcionando:** El middleware `authorize(...roles)` protege endpoints correctamente por rol.

6. **Helmet + CORS bien configurados:** Cabeceras de seguridad HTTP aplicadas. CORS restrictivo por origen.

7. **express-validator en todos los inputs:** Buena práctica preventiva contra inyecciones.

8. **Prisma ORM:** Eliminación de riesgo de SQL Injection. Queries parametrizadas por diseño.

9. **Security logging en base de datos:** Sistema propio de registro de eventos similar a un SIEM básico.

10. **Documentación OWASP:** Análisis real con mitigaciones específicas del proyecto, no genérico.

11. **Datos demo realistas:** 4 usuarios, 15 tickets, 41 eventos de seguridad. Demo creíble.

12. **WebSec Auditor como diferenciador:** Funcionalidad única en un proyecto de portfolio.

---

## 6. Puntos Débiles Técnicos (Deuda Técnica)

### 6.1 Deuda Crítica

**A. `fallback_secret` hardcodeado como fallback de JWT**

En `auth.middleware.ts:13` y `auth.controller.ts:51`:
```typescript
const secret = process.env.JWT_SECRET || 'fallback_secret';
```
Si `JWT_SECRET` no está definido en el entorno, el sistema usará `'fallback_secret'` en lugar de fallar. Esto puede causar que tokens firmados con el secret de un entorno sean válidos en otro, o que funcione en producción con un secret predecible.

**Corrección:** Fallar explícitamente al inicio si `JWT_SECRET` no está definido.

---

**B. SQLite como base de datos**

SQLite es adecuado para desarrollo local rápido pero no es viable para entornos reales:
- No soporta concurrencia real de escrituras.
- No puede gestionarse con herramientas de backup cloud estándar.
- Los reclutadores técnicos lo identifican como señal de proyecto demo.
- Prisma con SQLite usa `db push` en lugar de migraciones versionadas.

**Corrección:** Migrar a PostgreSQL con migraciones Prisma (`prisma migrate`).

---

**C. Sin tests de ningún tipo**

Ni frontend ni backend tienen un solo test. Esto es el gap más grande para un proyecto que quiere demostrar competencias profesionales.

**Corrección:** Añadir suite de tests con Jest + Supertest para el backend. Mínimo: auth, RBAC, tickets, audit.

---

**D. SSRF no completamente mitigado en el auditor web**

`audit.controller.ts` solo valida el protocolo (http/https) pero no bloquea:
- `http://localhost` / `http://127.0.0.1`
- Rangos privados: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Metadata endpoints de cloud: `http://169.254.169.254` (AWS/GCP metadata)
- Localhost IPv6: `http://[::1]`

Un atacante podría usar el auditor para escanear la red interna del servidor.

**Corrección:** Implementar validación de IP antes de hacer fetch (resolución DNS + comprobación de rangos privados).

---

### 6.2 Deuda Alta

**E. Múltiples instancias de PrismaClient**

`auth.controller.ts`, y posiblemente otros controladores, instancian `new PrismaClient()` individualmente. Prisma recomienda usar una instancia compartida (singleton) para evitar agotamiento del pool de conexiones.

**Corrección:** Exportar una instancia única desde `src/lib/prisma.ts`.

---

**F. @types packages y herramientas de compilación en production dependencies**

En `backend/package.json`, los siguientes paquetes están en `dependencies` cuando deberían estar en `devDependencies`:
- `@types/bcryptjs`, `@types/cors`, `@types/express`, `@types/jsonwebtoken`, `@types/node`, `@types/uuid`
- `ts-node`, `typescript`
- `prisma` (el CLI; solo `@prisma/client` es necesario en prod)

Esto aumenta innecesariamente el tamaño de la imagen Docker en producción.

---

**G. País asignado aleatoriamente en log.service.ts**

```typescript
const COUNTRIES = ['ES', 'US', 'DE', 'FR', 'CN', 'RU', 'BR', 'MX', 'IT', 'GB'];
const country = params.country || COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
```

Los eventos de seguridad tienen países **aleatorios** si no se pasa geolocalización. El mapa de países del SOC Dashboard muestra datos ficticios en producción real.

**Corrección:** Eliminar la asignación aleatoria. Dejar `country` como `null` si no hay geolocalización, o integrar una librería ligera de GeoIP.

---

**H. Health check fuera del prefijo `/api`**

El endpoint `/health` está definido en `app.ts` directamente, sin prefijo `/api`. En un entorno con proxy o API gateway, esto puede causar problemas de enrutamiento.

**Corrección:** Mover a `/api/health` y enriquecer con información de estado de DB y versión.

---

**I. No existe `npm run test` ni `npm run lint` en el backend**

Frontend tiene ESLint configurado pero backend no tiene ni lint ni test definidos. Sin estos scripts, un pipeline de CI no puede ejecutarlos de forma estándar.

---

### 6.3 Deuda Media

**J. `req: any` en me() del auth controller**

```typescript
export const me = async (req: any, res: Response): Promise<void> => {
```
Debería usar el tipo `AuthRequest` ya definido en `types/index.ts`.

---

**K. JWT almacenado en localStorage**

```typescript
// frontend/src/context/AuthContext.tsx
localStorage.setItem('sfm_token', token);
```
localStorage es vulnerable a XSS. En producción real, HttpOnly cookies serían más seguras. Es un trade-off conocido pero debe documentarse explícitamente como decisión técnica, no como omisión.

---

**L. Sin mecanismo de refresh token**

Cuando el JWT expira a las 8h, el usuario es redirigido al login. No existe refresh token. En un sistema real esto puede ser incómodo para el usuario. Debe documentarse como decisión de diseño.

---

**M. El .gitignore es mejorable**

Falta ignorar explícitamente:
- `prisma/migrations/` (si se usa SQLite en dev y se cambia a PostgreSQL)
- `coverage/` (cuando se añadan tests)
- `*.tsbuildinfo`
- `.env.local`

---

## 7. Riesgos de Seguridad

| Riesgo | Severidad | Estado |
|--------|-----------|--------|
| SSRF completo en auditor web | **ALTO** | No mitigado (IPs privadas, metadata) |
| JWT fallback_secret hardcodeado | **ALTO** | Presente en código |
| País aleatorio en security logs (datos falsos) | **MEDIO** | Presente en código |
| JWT en localStorage (XSS risk) | **MEDIO** | Trade-off documentado |
| Sin rate limiting específico para `/api/audit` | **MEDIO** | Solo rate limit global |
| PrismaClient múltiple (estabilidad) | **BAJO** | Anti-pattern |
| No hay CSP refinado para el frontend | **BAJO** | Helmet por defecto en backend |
| Sin cabeceras de seguridad en respuestas del frontend | **BAJO** | Depende del servidor que sirva el frontend |

---

## 8. Riesgos de Arquitectura

| Riesgo | Impacto |
|--------|---------|
| SQLite no escala ni es production-ready | Bloqueante para despliegue real |
| `db push` en lugar de migraciones versionadas | Peligroso en producción (puede borrar datos) |
| Sin singleton de PrismaClient | Pool de conexiones agotado bajo carga |
| Sin gestión de errores unificada en seed | Seed puede fallar silenciosamente |
| Sin separación de config por entorno (dev/prod/test) | Misma configuración en todos los entornos |
| Frontend sin proxy configurado en Vite | Posibles problemas CORS en desarrollo |

---

## 9. Riesgos de Despliegue

| Riesgo | Impacto |
|--------|---------|
| Sin Dockerfile | No se puede contenedorizar |
| Sin docker-compose | No se puede levantar el entorno completo |
| Scripts `render-*` específicos de una plataforma | Acoplado a Render, no portable |
| Sin variables de entorno para PostgreSQL | .env.example incompleto para producción |
| Sin CI/CD | Sin validación automática antes de merge |
| Sin Dependabot | Dependencias vulnerables sin detectar automáticamente |
| `ts-node` y `typescript` en prod deps | Imagen Docker innecesariamente grande |

---

## 10. Calidad del README Actual

**Puntuación: 7/10**

**Bien:**
- Descripción clara del proyecto y propósito
- Stack técnico documentado
- Instrucciones de instalación step-by-step
- Tabla de usuarios demo
- Tabla de endpoints
- Tabla de scripts
- Descripción de módulos
- Sección "Qué demuestra este proyecto"

**Mejorable:**
- Sin badges de CI/CD (no existen)
- Sin capturas de pantalla o demo online
- Sin arquitectura visual
- Sin sección de Docker
- Sin sección de testing
- Sin roadmap
- Sin sección de contribución
- Sin tabla de contenidos para un README tan largo
- Tono algo genérico — puede ganar especificidad técnica

---

## 11. Calidad de la Documentación Actual

| Documento | Calidad | Observaciones |
|-----------|---------|---------------|
| `docs/API.md` | ✅ Buena | Endpoints documentados con parámetros |
| `docs/OWASP_RISKS.md` | ✅ Buena | Análisis real, pendientes honestos |
| `docs/SECURITY.md` | ✅ Buena | Medidas detalladas |
| `docs/PORTFOLIO_SUMMARY.md` | ⚠️ Básica | Mejorable con más detalle técnico |

**Ausencias:**
- Sin `docs/TESTING.md`
- Sin `docs/DEPLOYMENT.md`
- Sin `docs/DOCKER.md`
- Sin `docs/CI_CD.md`
- Sin `docs/OBSERVABILITY.md`
- Sin `security/THREAT_MODEL.md`
- Sin `security/DEVSECOPS_PIPELINE.md`

---

## 12. Nivel Actual de Portfolio

**Evaluación honesta para cada perfil objetivo:**

| Perfil | Nivel actual | Nivel objetivo |
|--------|-------------|----------------|
| Backend Developer Junior | 6/10 | 9/10 |
| Fullstack con orientación backend | 7/10 | 9/10 |
| Cloud Junior | 2/10 | 7/10 |
| DevOps Junior | 1/10 | 7/10 |
| DevSecOps Junior | 5/10 | 9/10 |
| AppSec Junior | 6/10 | 8/10 |

**El proyecto ya tiene buena base de backend y seguridad. Le faltan las capas de infraestructura (Docker, CI/CD, PostgreSQL, testing) que son las que justifican el perfil cloud/devops.**

---

## 13. Qué Falta para Nivel Profesional

### Imprescindible (sin esto, el portfolio no es creíble)
- [ ] PostgreSQL en lugar de SQLite
- [ ] Tests reales (mínimo backend: auth, RBAC, tickets)
- [ ] `npm run test` y `npm run lint` funcionando
- [ ] CI/CD básico con GitHub Actions
- [ ] Corregir `fallback_secret` en JWT
- [ ] Mitigar SSRF completo en el auditor web

### Muy recomendable (eleva mucho el nivel)
- [ ] Docker + docker-compose funcional
- [ ] Prisma migrations (en lugar de `db push`)
- [ ] Singleton de PrismaClient
- [ ] Health check enriquecido en `/api/health`
- [ ] Logs sin país aleatorio falso
- [ ] Dependabot configurado
- [ ] `@types/*` movidos a devDependencies
- [ ] README con sección Docker, Testing, CI/CD
- [ ] `security/THREAT_MODEL.md`
- [ ] `docs/DEPLOYMENT.md`

### Opcional avanzado (diferencia para roles cloud/devops senior)
- [ ] Trivy o escaneo de dependencias en CI
- [ ] CodeQL
- [ ] Observabilidad básica (métricas custom)
- [ ] Logs estructurados JSON
- [ ] `infra/` con documentación de despliegue cloud
- [ ] Microservicio Java complementario (fase final)

---

## 14. Plan de Evolución por Fases

### FASE 1 — Auditoría Técnica ✅ (este documento)
- Diagnóstico completo del estado actual.
- Sin cambios de código.

### FASE 2 — Normalización del Proyecto
**Objetivos:** Corregir deuda técnica sin romper nada.
- Mover `@types/*`, `ts-node`, `typescript`, `prisma` CLI a devDependencies.
- Corregir `fallback_secret` — fallar explícitamente si JWT_SECRET no está definido.
- Añadir singleton de PrismaClient.
- Corregir tipo `req: any` en auth controller.
- Añadir `npm run lint` al backend.
- Mejorar `.gitignore`.
- Mejorar `.env.example` (variables para PostgreSQL).

### FASE 3 — Migración a PostgreSQL
**Objetivos:** Base de datos production-ready.
- Cambiar provider de SQLite a PostgreSQL en schema.prisma.
- Configurar Prisma migrations (`prisma migrate dev`).
- Actualizar .env.example con variables PostgreSQL.
- Mantener seed funcional.
- Documentar setup de base de datos.

### FASE 4 — Dockerización Completa
**Objetivos:** Entorno reproducible.
- Dockerfile para backend.
- Dockerfile para frontend (Nginx).
- docker-compose.yml con backend + frontend + PostgreSQL.
- `.dockerignore` correcto.
- `docs/DOCKER.md`.

### FASE 5 — Testing Profesional
**Objetivos:** Tests reales y mantenibles.
- Jest + Supertest para backend.
- Tests de: auth, RBAC, tickets, audit, security logs.
- `npm run test` y `npm run test:coverage`.
- Base de datos de test separada.
- `docs/TESTING.md`.

### FASE 6 — CI/CD con GitHub Actions
**Objetivos:** Pipeline automático.
- `.github/workflows/ci.yml`.
- Jobs: lint, test, build (frontend y backend).
- Seguridad: npm audit, Dependabot.
- `docs/CI_CD.md`.

### FASE 7 — DevSecOps y Documentación de Seguridad
**Objetivos:** Demostrar mentalidad DevSecOps.
- Dependabot.
- Trivy scan en CI (opcional).
- `security/THREAT_MODEL.md`.
- `security/OWASP_TOP_10.md` actualizado.
- `security/DEVSECOPS_PIPELINE.md`.

### FASE 8 — Hardening del Auditor Web
**Objetivos:** Mitigar SSRF completamente.
- Bloqueo de IPs privadas y rangos internos.
- Bloqueo de metadata endpoints cloud.
- Rate limit específico para `/api/audit`.
- Logging de intentos bloqueados.
- `security/WEB_AUDITOR_SECURITY.md`.

### FASE 9 — Observabilidad Básica
**Objetivos:** Señales de producción.
- `/api/health` enriquecido (DB status, versión, uptime).
- Logs sin país aleatorio.
- Métricas básicas expuestas.
- `docs/OBSERVABILITY.md`.

### FASE 10 — Preparación Cloud
**Objetivos:** Guía de despliegue real.
- `docs/DEPLOYMENT.md` completo.
- Variables de entorno por entorno (dev/prod).
- Checklist de publicación.

### FASE 11 — README Profesional
**Objetivos:** README que venda el proyecto.
- Badges de CI.
- Capturas de pantalla.
- Sección Docker, Testing, CI/CD, DevSecOps.
- Tabla de contenidos.

### FASE 12 — Portfolio y CV
**Objetivos:** Material listo para entrevistas.
- `docs/PORTFOLIO_SUMMARY.md` actualizado.
- Descripciones para CV, LinkedIn, GitHub.
- Guía de cómo defender el proyecto.

### FASE 13 — Opcional: Microservicio Java
**Solo si el proyecto base está estable.**
- `securefm-risk-engine` con Spring Boot.
- Motor de cálculo de riesgo de incidencias.

---

## 15. Priorización

### Imprescindible
| # | Tarea | Fase | Riesgo de romper |
|---|-------|------|-----------------|
| 1 | Corregir `fallback_secret` JWT | 2 | Bajo |
| 2 | Singleton PrismaClient | 2 | Bajo |
| 3 | Mover @types a devDeps | 2 | Ninguno |
| 4 | Migrar a PostgreSQL | 3 | Medio |
| 5 | Tests backend reales | 5 | Ninguno (son nuevos) |
| 6 | CI/CD básico | 6 | Ninguno (es nuevo) |
| 7 | Mitigar SSRF completo | 8 | Bajo |

### Muy recomendable
| # | Tarea | Fase | Riesgo de romper |
|---|-------|------|-----------------|
| 8 | Docker + docker-compose | 4 | Ninguno (es nuevo) |
| 9 | Prisma migrations | 3 | Medio (requiere cuidado) |
| 10 | Dependabot | 6 | Ninguno |
| 11 | Health check enriquecido | 9 | Bajo |
| 12 | Eliminar país aleatorio en logs | 2 | Bajo |
| 13 | README profesional | 11 | Ninguno |
| 14 | THREAT_MODEL.md | 7 | Ninguno |

### Opcional avanzado
| # | Tarea | Fase |
|---|-------|------|
| 15 | Trivy / CodeQL | 7 |
| 16 | Logs estructurados JSON | 9 |
| 17 | infra/ con Terraform esqueleto | 10 |
| 18 | Microservicio Java | 13 |

---

## 16. Riesgos de Romper el Proyecto

| Acción | Riesgo | Mitigación |
|--------|--------|-----------|
| Migrar SQLite → PostgreSQL | **MEDIO** — Seed puede fallar, schema puede tener incompatibilidades | Probar seed completo antes de avanzar |
| Prisma migrations vs db push | **MEDIO** — Historial de migraciones puede conflictear | Iniciar historial de migraciones limpio en PostgreSQL |
| Mover @types a devDeps | **BAJO** — Puede romper build en prod si alguno es requerido en runtime | Probar `npm run build` después |
| Cambiar JWT handling | **BAJO** — Cambio mínimo, solo añadir validación al inicio | Probar login y rutas protegidas |
| Singleton PrismaClient | **BAJO** — Refactor de importación, no de lógica | Probar todos los endpoints |
| Docker multi-service | **BAJO** — Nuevo, no toca código existente | Probar con `docker compose up --build` |

---

## 17. Estrategia Segura de Evolución

1. **Una fase a la vez.** No mezclar migraciones de base de datos con tests con Docker en el mismo paso.

2. **Probar funcionalidad core después de cada fase:**
   - Login funciona → tickets funcionan → roles funcionan → auditor funciona.

3. **Commits atómicos** por cambio. Cada corrección de deuda técnica en un commit separado.

4. **Mantener el seed funcional** como referencia de que el sistema está operativo.

5. **No reescribir** lo que ya funciona. Refactorizar solo cuando añade valor claro.

6. **Documentar antes de avanzar.** Cada fase debe dejar documentación actualizada.

7. **El auditor web es el componente más delicado** (SSRF). Tratar la fase 8 con especial cuidado y tests específicos.

---

## Resumen Final de la Auditoría

| Categoría | Puntuación actual | Puntuación objetivo |
|-----------|------------------|---------------------|
| Código y arquitectura | 7/10 | 9/10 |
| Seguridad de la aplicación | 6/10 | 9/10 |
| Infraestructura y despliegue | 1/10 | 8/10 |
| Testing | 0/10 | 7/10 |
| CI/CD y DevSecOps | 0/10 | 8/10 |
| Documentación técnica | 6/10 | 9/10 |
| Valor de portfolio | 5/10 | 9/10 |

**El proyecto tiene una base sólida. Cada fase de evolución aportará valor real y defendible. La propuesta de valor diferenciadora (CAFM + SOC + WebSec) debe mantenerse intacta durante toda la evolución.**

---

*Documento generado en la Fase 1 de la evolución hacia SecureFM SOC — Cloud & DevSecOps Edition.*

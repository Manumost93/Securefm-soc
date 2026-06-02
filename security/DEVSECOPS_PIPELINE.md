# DevSecOps Pipeline — SecureFM SOC

Descripción del pipeline de seguridad integrado en el ciclo de desarrollo.

---

## Visión general

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DevSecOps Pipeline                              │
│                                                                     │
│  PLAN          CODE           BUILD          TEST          DEPLOY   │
│    │             │              │              │              │      │
│  Threat        ESLint        TypeScript      Jest         Docker    │
│  Model       @typescript    compile        (28 tests)    build     │
│              -eslint        Prisma                        check     │
│                             generate                               │
│                                                                     │
│  MONITOR       OPERATE        RELEASE        SECURE        AUDIT   │
│    │             │              │              │              │      │
│  SOC          Health          GitHub        CodeQL        npm      │
│  Dashboard    Check          Releases       Analysis      audit    │
│  SecurityLog  /api/health    (roadmap)     Weekly        CI/CD     │
│                                            + push                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Controles por fase

### PLAN — Diseño seguro
- Threat Model (`security/THREAT_MODEL.md`) — actualizar ante cambios de arquitectura
- OWASP Top 10 (`security/OWASP_TOP_10.md`) — referencia de riesgos
- Revisión de permisos antes de añadir nuevos endpoints

### CODE — Escritura de código
- ESLint + `@typescript-eslint` — detecta `any` explícito, variables no usadas
- TypeScript strict mode — errores de tipos en tiempo de desarrollo
- Revisión manual: no hardcodear secretos, no concatenar SQL

### BUILD — Compilación y generación
- `tsc --noEmit` valida tipos antes de compilar
- `prisma generate` regenera el cliente tipado desde el schema
- Docker multi-stage — imagen de producción sin devDependencies

### TEST — Verificación de comportamiento
- **28 tests automáticos** cubriendo:
  - Autenticación (login, JWT, /me)
  - RBAC (todos los roles vs todos los endpoints sensibles)
  - CRUD de tickets con permisos
  - Health endpoint
- Prisma mockeado — no necesita BD real para correr en CI

### RELEASE — Publicación
- Todo merge a `main` pasa por el pipeline completo
- No hay deploy manual sin CI verde
- Dependabot mantiene las dependencias actualizadas

### MONITOR — Observabilidad de seguridad
- SOC Dashboard con todos los eventos de seguridad
- SecurityLog con IP, User-Agent, severity, timestamp
- Polling de eventos críticos cada 60s en el navbar
- Health check en `/api/health` con estado de la BD

---

## Herramientas del pipeline

| Herramienta | Fase | Qué detecta |
|-------------|------|-------------|
| ESLint + @typescript-eslint | Code | Errores de código, any implícito |
| TypeScript strict | Build | Errores de tipos |
| Jest + Supertest | Test | Regresiones en auth, RBAC, lógica |
| npm audit | CI | CVEs en dependencias |
| CodeQL | CI (semanal) | Vulnerabilidades estáticas en código |
| Dependabot | Automático | Dependencias desactualizadas |
| Docker build check | CI (main) | Imágenes construibles |
| SecurityLog | Runtime | Eventos de seguridad en producción |

---

## Pipeline de CI completo

```
push/PR a main o develop
        │
        ├──── lint-backend ─────────────────────────────── ✅/❌
        │
        ├──── test-backend ──── build-backend ──────────── ✅/❌
        │         └── (Prisma mock, sin BD)
        │
        ├──── build-frontend ───────────────────────────── ✅/❌
        │
        ├──── security-audit ──────────────────────────── ⚠️ (no bloquea)
        │
        └──── docker-build-check (solo main) ───────────── ✅/❌

        paralelo ──── CodeQL analysis ──────────────────── Pestaña Security
        semanal  ──── Dependabot PRs  ──────────────────── PRs automáticos
```

**Tiempo total estimado:** 3-5 minutos por pipeline (sin docker-build-check).

---

## Política de secretos

| Secreto | Almacenamiento | Rotación |
|---------|---------------|----------|
| `JWT_SECRET` | `.env` local, GitHub Secrets en CI | Al detectar compromiso |
| `DATABASE_URL` | `.env` local, variables de entorno del servicio cloud | Al rotar credenciales de BD |
| `POSTGRES_PASSWORD` | `.env` local, variables de servicio | Trimestral en producción |
| Claves AWS/Terraform | `terraform.tfvars` (no commiteado), variables de CI | Al detectar compromiso |

**Reglas:**
1. Ningún secreto en el código fuente
2. Ningún secreto en logs
3. `.env` siempre en `.gitignore`
4. `terraform.tfvars` siempre en `.gitignore`
5. Usar GitHub Secrets para CI/CD

---

## Respuesta ante incidentes

### Si se detecta JWT_SECRET comprometido

```bash
# 1. Rotar el secreto (generar nuevo)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 2. Actualizar .env y variables de entorno del servidor
# 3. Reiniciar el backend (todos los JWT existentes se invalidan)
# 4. Registrar el incidente en SecurityLog
# 5. Notificar a los usuarios que deben volver a autenticarse
```

### Si se detecta cuenta comprometida

```bash
# 1. Desactivar la cuenta (no borrar — preservar logs)
PUT /api/users/:id  { active: false }

# 2. El usuario no podrá loguearse aunque tenga JWT válido
# 3. El JWT expirará en máx. 8h
# 4. Revisar SecurityLog para el userId y email de la cuenta
```

### Si se detecta una vulnerabilidad en dependencias

```bash
# 1. Revisar el advisory de npm audit
npm audit

# 2. Intentar corrección automática
npm audit fix

# 3. Si requiere cambio major, revisar breaking changes
npm audit fix --force  # Con cuidado

# 4. Actualizar package-lock.json y commitear
# 5. El CI validará que los tests siguen pasando
```

---

## Métricas de seguridad

Métricas que deberían monitorizarse en producción:

| Métrica | Umbral de alerta | Fuente |
|---------|-----------------|--------|
| Logins fallidos / hora | > 50 | SecurityLog |
| Eventos críticos / día | > 5 | SOC Dashboard |
| IPs en rate limit / hora | > 10 | SecurityLog |
| Intentos SSRF bloqueados | > 1 | SecurityLog |
| Tiempo de respuesta API | > 2s P95 | Health check |
| Vulnerabilidades high en npm audit | > 0 | CI pipeline |

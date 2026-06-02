# CI/CD — SecureFM SOC

Pipeline de integración continua y entrega continua con GitHub Actions.

---

## Visión general

```
Push / Pull Request
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                    CI Pipeline                        │
│                                                       │
│  ┌─────────────┐   ┌──────────────┐                  │
│  │ lint-backend│   │build-frontend│                  │
│  └──────┬──────┘   └──────┬───────┘                  │
│         │                 │                           │
│  ┌──────▼──────┐          │                           │
│  │test-backend │          │   ┌──────────────────┐    │
│  └──────┬──────┘          │   │  security-audit  │    │
│         │                 │   │  (continue-err)  │    │
│  ┌──────▼──────┐          │   └──────────────────┘    │
│  │build-backend│          │                           │
│  └──────┬──────┘          │                           │
│         └────────┬────────┘                           │
│                  ▼                                    │
│         ┌────────────────┐                            │
│         │docker-build-   │ (solo en push a main)      │
│         │check           │                            │
│         └────────────────┘                            │
└───────────────────────────────────────────────────────┘
        │
        ▼ (separado, paralelo)
┌───────────────────────────────────────────────────────┐
│              CodeQL Analysis                          │
│  Análisis estático de seguridad en TypeScript         │
└───────────────────────────────────────────────────────┘
```

---

## Archivos de CI/CD

| Archivo | Propósito |
|---------|-----------|
| `.github/workflows/ci.yml` | Pipeline principal (lint, test, build, audit, docker check) |
| `.github/workflows/codeql.yml` | Análisis estático de seguridad (CodeQL) |
| `.github/dependabot.yml` | Actualizaciones automáticas de dependencias |

---

## Jobs del pipeline principal

### 1. `lint-backend` — Calidad de código
**Cuándo:** Siempre (push y PR)  
**Qué hace:** Ejecuta ESLint sobre todo el código TypeScript del backend  
**Falla si:** Hay errores de linting (warnings se muestran pero no bloquean)  
**Tiempo estimado:** ~30 segundos

```bash
# Equivalente local:
cd backend && npm run lint
```

### 2. `test-backend` — Suite de tests
**Cuándo:** Siempre (push y PR)  
**Qué hace:**
- Instala dependencias con `npm ci`
- Genera el cliente Prisma (`prisma generate`) — sin base de datos
- Ejecuta los 28 tests con Jest (Prisma mockeado)
- Sube el informe de cobertura como artefacto

**Falla si:** Algún test falla  
**Tiempo estimado:** ~45 segundos  
**Variable de entorno:** `JWT_SECRET` (usa fallback para CI o GitHub Secret si está configurado)

```bash
# Equivalente local:
cd backend && npm run test
```

### 3. `build-backend` — Compilación TypeScript
**Cuándo:** Solo si `test-backend` pasa (`needs: [test-backend]`)  
**Qué hace:** Compila TypeScript a JavaScript en `dist/`  
**Falla si:** Hay errores de tipos TypeScript  
**Tiempo estimado:** ~30 segundos

```bash
# Equivalente local:
cd backend && npm run build
```

### 4. `build-frontend` — Build de producción Vite
**Cuándo:** Siempre, en paralelo con los jobs de backend  
**Qué hace:** Compila React + TypeScript con Vite  
**Falla si:** Errores de compilación TypeScript o Vite  
**Tiempo estimado:** ~45 segundos

```bash
# Equivalente local:
cd frontend && npm run build
```

### 5. `security-audit` — Auditoría de dependencias
**Cuándo:** Siempre  
**Qué hace:** Ejecuta `npm audit --audit-level=high` en backend y frontend  
**Falla si:** `continue-on-error: true` → **nunca bloquea el pipeline**  
**Tiempo estimado:** ~20 segundos

> El `continue-on-error` está configurado intencionalmente. Muchos proyectos tienen vulnerabilidades moderadas en dependencias transitivas que no son accionables. La auditoría reporta pero no bloquea.
>
> Para hacerla obligatoria: cambiar `continue-on-error: false` en `ci.yml`.

```bash
# Equivalente local:
cd backend && npm audit --audit-level=high
cd frontend && npm audit --audit-level=high
```

### 6. `docker-build-check` — Verificación de imágenes Docker
**Cuándo:** Solo en `push` a `main` (no en PRs)  
**Qué hace:** Construye las imágenes Docker de backend y frontend sin publicarlas  
**Falla si:** El `docker build` falla  
**Tiempo estimado:** 3-5 minutos (primera vez), 30-60s (con cache de GitHub Actions)

Este job verifica que el `Dockerfile` de cada servicio compila correctamente tras cada merge a `main`.

---

## CodeQL — Análisis de seguridad

El workflow de CodeQL (`codeql.yml`) analiza el código TypeScript en busca de:
- Inyecciones (XSS, SQLi, command injection)
- Path traversal
- Credenciales hardcodeadas
- Vulnerabilidades de deserialización
- Uso inseguro de `eval()`

**Cuándo se ejecuta:**
- En cada push a `main`
- En cada PR hacia `main`
- Todos los lunes a las 08:00 UTC (análisis programado)

Los resultados aparecen en la pestaña **Security → Code scanning alerts** del repositorio GitHub.

> CodeQL es gratuito para repositorios públicos. Para privados requiere plan GitHub Advanced Security.

---

## Dependabot — Actualizaciones automáticas

Dependabot abre PRs automáticamente los lunes cuando detecta nuevas versiones de dependencias.

**Ecosistemas monitorizados:**
- `npm` — backend (`/backend`)
- `npm` — frontend (`/frontend`)
- `github-actions` — workflows (raíz)
- `docker` — Dockerfiles

**Agrupaciones configuradas:**
- Las devDependencies de `@types/*`, `eslint*`, `jest*` se agrupan en un solo PR por semana para reducir el ruido.

**Límite de PRs:** 5 abiertos simultáneamente por ecosistema para no saturar.

---

## Requisitos para que CI funcione

### 1. `package-lock.json` debe estar commiteado

`npm ci` (usado en CI) requiere `package-lock.json`. Si no existe, genera el error:
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**Solución:** Ejecutar `npm install` localmente y commitear los lock files:

```bash
# Backend
cd backend && npm install
git add backend/package-lock.json

# Frontend
cd frontend && npm install
git add frontend/package-lock.json

git commit -m "chore: add package-lock.json files for CI"
git push
```

### 2. `JWT_SECRET` como GitHub Secret (opcional)

Para repositorios privados o si quieres usar un secret real en tests de CI:

1. Ir a GitHub → Settings → Secrets and variables → Actions
2. Añadir secret: `JWT_SECRET` con un valor seguro

Si no está configurado, el pipeline usa el fallback `ci-test-secret-minimum-32-characters-long!!` que es seguro para tests.

---

## Cómo interpretar un fallo de CI

### `lint-backend` falla
```
error  'variable' is assigned a value but never used  @typescript-eslint/no-unused-vars
```
**Solución:** Corregir el error de lint o prefijar la variable con `_` si es intencional.

### `test-backend` falla
```
● auth.test.ts › POST /api/auth/login › devuelve token
  Expected: 200, Received: 500
```
**Solución:** Ver el stack trace del test. Revisar si el mock de Prisma está configurado correctamente para ese test.

### `build-backend` falla
```
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```
**Solución:** Error de tipos TypeScript. Corregir el tipo o el código.

### `build-frontend` falla
```
[vite]: Rollup failed to resolve import "..."
```
**Solución:** Import roto. Verificar que el módulo existe y el path es correcto.

### `security-audit` falla (pero no bloquea)
```
found 3 vulnerabilities (1 moderate, 2 high)
```
**Solución:**
```bash
npm audit fix          # Correcciones automáticas seguras
npm audit fix --force  # Correcciones que pueden romper (revisar con cuidado)
npm audit              # Ver detalles completos
```

### `docker-build-check` falla
```
ERROR [builder 4/5] RUN npm ci
```
**Solución:** Verificar el `Dockerfile` del servicio afectado. Comprobar que `package-lock.json` está incluido en el contexto de build (no en `.dockerignore`).

---

## Badges de CI para el README

Una vez que el repositorio esté en GitHub y el pipeline haya ejecutado al menos una vez, puedes usar estos badges en el README:

```markdown
[![CI](https://github.com/Manumost93/Securefm-soc/actions/workflows/ci.yml/badge.svg)](https://github.com/Manumost93/Securefm-soc/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Manumost93/Securefm-soc/actions/workflows/codeql.yml/badge.svg)](https://github.com/Manumost93/Securefm-soc/actions/workflows/codeql.yml)
```

---

## Próximos pasos en CI/CD (roadmap)

| Mejora | Descripción | Dificultad |
|--------|-------------|------------|
| Tests de integración | Job adicional con PostgreSQL como servicio (`services: postgres:`) | Media |
| Cobertura mínima | Fallar si cobertura < 70% (`--coverage --coverageThreshold`) | Baja |
| Deploy automático | Añadir job de deploy a Render/Railway tras merge a `main` | Media |
| Trivy image scan | Escanear imágenes Docker en busca de CVEs | Baja |
| Caché de Docker layers | Ya configurado con `cache-from: type=gha` | — |
| Release automático | `semantic-release` para versionar y generar changelogs | Alta |

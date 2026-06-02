# Docker — SecureFM SOC

Guía completa para ejecutar SecureFM SOC con Docker y Docker Compose.

---

## Arquitectura Docker

```
┌─────────────────────────────────────────────────────────────────┐
│  Host (tu máquina)                                              │
│                                                                 │
│   puerto 80          puerto 3001         puerto 5432            │
│       │                  │                   │                  │
│  ┌────▼─────────┐  ┌─────▼──────────┐  ┌────▼──────────────┐  │
│  │  frontend    │  │   backend      │  │   postgres         │  │
│  │  (Nginx)     │──│  (Node.js)     │──│  (PostgreSQL 16)  │  │
│  │              │  │                │  │                    │  │
│  │  React SPA   │  │  Express API   │  │  securefm_soc BD  │  │
│  │  /api → proxy│  │  Prisma ORM    │  │                    │  │
│  └──────────────┘  └────────────────┘  └────────────────────┘  │
│                                                                 │
│  Red Docker interna: securefm-network                          │
│  Volumen persistente: securefm-postgres-data                   │
└─────────────────────────────────────────────────────────────────┘
```

**Flujo de una petición en Docker:**
1. Navegador → `http://localhost/api/tickets`
2. Nginx recibe la petición en puerto 80
3. Nginx detecta `/api` → proxea a `http://backend:3001/api/tickets`
4. Backend consulta PostgreSQL internamente en `postgres:5432`
5. Respuesta vuelve al navegador

---

## Requisitos

- Docker ≥ 24.0
- Docker Compose v2 (incluido en Docker Desktop)

Verificar:
```bash
docker --version
docker compose version
```

---

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/Manumost93/Securefm-soc.git
cd Securefm-soc

# 2. Crear el archivo de variables de entorno
cp .env.example .env

# 3. IMPORTANTE: cambiar JWT_SECRET por uno seguro
#    Genera uno con:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#    Copia el resultado y pégalo en .env como JWT_SECRET=...

# 4. Construir y levantar todos los servicios
docker compose up --build

# 5. Cargar datos de prueba (primera vez, en otra terminal)
docker compose exec backend npm run seed

# 6. Abrir la aplicación
# http://localhost
```

**Primera vez:** el build tarda 2-4 minutos (descarga imágenes + compila).  
**Siguientes veces:** `docker compose up` sin `--build` arranca en segundos.

---

## Comandos esenciales

### Arrancar y parar

```bash
# Arrancar en primer plano (ver logs de todos los servicios)
docker compose up

# Arrancar en background
docker compose up -d

# Parar sin borrar datos
docker compose down

# Parar Y borrar la base de datos (cuidado!)
docker compose down -v
```

### Reconstruir

```bash
# Reconstruir un servicio específico tras cambios en código
docker compose build backend
docker compose build frontend

# Reconstruir todo
docker compose build

# Reconstruir y levantar
docker compose up --build
```

### Logs

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs solo del backend
docker compose logs -f backend

# Ver logs solo de PostgreSQL
docker compose logs -f postgres

# Ver las últimas 50 líneas
docker compose logs --tail=50 backend
```

### Ejecutar comandos en contenedores

```bash
# Cargar datos de prueba
docker compose exec backend npm run seed

# Abrir una shell en el backend
docker compose exec backend sh

# Conectarse a PostgreSQL directamente
docker compose exec postgres psql -U sfm_user -d securefm_soc

# Ver estado de los contenedores
docker compose ps
```

### Base de datos

```bash
# Ejecutar migraciones manualmente (ya se hace automático al arrancar)
docker compose exec backend node_modules/.bin/prisma migrate deploy

# Resetear la base de datos (borra todos los datos!)
docker compose exec backend node_modules/.bin/prisma migrate reset
docker compose exec backend npm run seed

# Abrir Prisma Studio (explorador visual de BD)
# Nota: desde el host, no desde Docker
cd backend && npm run db:studio
```

---

## Servicios y puertos

| Servicio | Puerto host | Puerto interno | Descripción |
|----------|-------------|---------------|-------------|
| `frontend` | 80 | 80 | Nginx sirviendo React + proxy API |
| `backend` | 3001 | 3001 | API Express (también accesible directamente) |
| `postgres` | 5432 | 5432 | PostgreSQL (para Prisma Studio local) |

Para cambiar los puertos, edita el archivo `.env`:
```bash
FRONTEND_PORT=8080   # Si el puerto 80 está ocupado
POSTGRES_PORT=5433   # Si tienes otro PostgreSQL corriendo
```

---

## Variables de entorno

El `docker-compose.yml` lee las variables del archivo `.env` en la raíz.

| Variable | Obligatorio | Por defecto | Descripción |
|----------|-------------|-------------|-------------|
| `JWT_SECRET` | **Sí** | — | Secreto para firmar JWT. Mínimo 32 chars. |
| `JWT_EXPIRES_IN` | No | `8h` | Tiempo de expiración del token |
| `POSTGRES_USER` | No | `sfm_user` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | No | `sfm_password` | Contraseña de PostgreSQL |
| `POSTGRES_DB` | No | `securefm_soc` | Nombre de la base de datos |
| `POSTGRES_PORT` | No | `5432` | Puerto expuesto de PostgreSQL en el host |
| `FRONTEND_PORT` | No | `80` | Puerto expuesto del frontend en el host |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Ventana de rate limiting (ms) |
| `RATE_LIMIT_MAX` | No | `200` | Peticiones máximas por ventana |

---

## Estructura de archivos Docker

```
securefm-soc/
├── .env.example              # Variables para docker-compose (copiar a .env)
├── .env                      # Variables reales (NO commitear)
├── docker-compose.yml        # Orquestación de los 3 servicios
│
├── backend/
│   ├── Dockerfile            # Multi-stage: builder + runner
│   ├── docker-entrypoint.sh  # Ejecuta migraciones y arranca el servidor
│   └── .dockerignore         # Excluye node_modules, dist, .env...
│
└── frontend/
    ├── Dockerfile            # Multi-stage: Vite build + Nginx serve
    ├── nginx.conf            # SPA routing + proxy /api al backend
    └── .dockerignore         # Excluye node_modules, dist, .env...
```

---

## Detalles técnicos de los Dockerfiles

### Backend (multi-stage)

**Stage 1 — Builder:**
- `node:18-alpine` con todas las dependencias (incluyendo devDeps)
- Genera el cliente Prisma (`prisma generate`)
- Compila TypeScript → JavaScript en `dist/`

**Stage 2 — Runner:**
- `node:18-alpine` limpio
- Solo dependencias de producción (`npm ci --omit=dev`)
- Copia el cliente Prisma del builder (evita tener el CLI en prod)
- Copia el binario `prisma` del builder (para ejecutar `migrate deploy`)
- Ejecuta como usuario no-root (`appuser`) por seguridad
- El `docker-entrypoint.sh` ejecuta `prisma migrate deploy` antes de arrancar

### Frontend (multi-stage)

**Stage 1 — Builder:**
- `node:18-alpine` compila React con Vite
- `VITE_API_URL=/api` → las peticiones van a `/api` (Nginx las proxea)

**Stage 2 — Runner:**
- `nginx:1.25-alpine` sirve los estáticos
- `nginx.conf` configura:
  - Routing SPA (`try_files` → `index.html`)
  - Proxy `/api` → `http://backend:3001`
  - Cabeceras de seguridad básicas

---

## Flujo de migraciones en Docker

Al arrancar el backend con Docker, el `docker-entrypoint.sh` ejecuta automáticamente:

```bash
node_modules/.bin/prisma migrate deploy
```

Esto aplica todas las migraciones pendientes de forma segura y no interactiva. Si la base de datos ya está actualizada, no hace nada.

**Primera vez:**
- PostgreSQL arranca vacío
- El healthcheck espera a que esté listo
- El backend espera al healthcheck (`depends_on: condition: service_healthy`)
- Se aplican todas las migraciones → se crean las tablas
- Arranca el servidor

---

## Persistencia de datos

Los datos de PostgreSQL se guardan en un volumen Docker nombrado:

```
securefm-postgres-data
```

Este volumen persiste aunque pares o elimines los contenedores con `docker compose down`.

**Para borrar los datos completamente:**
```bash
docker compose down -v
# El flag -v elimina los volúmenes
```

---

## Desarrollo con Docker vs sin Docker

| Aspecto | Docker Compose | Desarrollo local |
|---------|---------------|-----------------|
| **Arranque** | `docker compose up --build` | `npm run dev` en backend y frontend |
| **Hot reload** | No (imagen estática) | Sí (ts-node-dev + Vite HMR) |
| **PostgreSQL** | Incluido en compose | Requiere instalación o contenedor separado |
| **URL frontend** | `http://localhost` | `http://localhost:5173` |
| **URL backend** | `http://localhost:3001` (o `/api` vía Nginx) | `http://localhost:3001` |
| **Para qué** | Demo, QA, portfolio | Desarrollo activo |

**Recomendación:** Usa Docker Compose para demostrar el proyecto y para CI/CD. Usa desarrollo local para programar activamente.

---

## Solución de errores comunes

### `JWT_SECRET es obligatorio`

El archivo `.env` no existe o no tiene `JWT_SECRET`:
```bash
cp .env.example .env
# Editar .env y cambiar JWT_SECRET por un valor seguro
```

### `port 80 is already allocated`

El puerto 80 está en uso (IIS, otro nginx, etc.):
```bash
# En .env, cambiar:
FRONTEND_PORT=8080
# Luego acceder a http://localhost:8080
```

### `ECONNREFUSED` en el backend al arrancar

PostgreSQL aún no está listo. El `depends_on: condition: service_healthy` debería evitarlo, pero si persiste:
```bash
# Ver logs de postgres
docker compose logs postgres
# Reiniciar solo el backend
docker compose restart backend
```

### `Migration failed`

Suele pasar si hay migraciones en conflicto:
```bash
# Ver estado de migraciones
docker compose exec backend node_modules/.bin/prisma migrate status

# En desarrollo (borra datos):
docker compose down -v
docker compose up --build
docker compose exec backend npm run seed
```

### El frontend no conecta con la API

Verificar que el backend está corriendo:
```bash
docker compose ps
curl http://localhost:3001/api/health
```

Si `backend` no está en estado `running`, revisar sus logs:
```bash
docker compose logs backend
```

### Quiero ver los datos en tiempo real

```bash
# Conectarse a PostgreSQL directamente
docker compose exec postgres psql -U sfm_user -d securefm_soc

# Ejemplos de queries
\dt                           -- ver tablas
SELECT email, role FROM "User";
SELECT COUNT(*) FROM "SecurityLog";
```

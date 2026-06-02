# Base de Datos — SecureFM SOC

Guía completa de configuración, migraciones y operaciones de base de datos.

---

## Stack de base de datos

| Elemento | Tecnología |
|----------|------------|
| Motor | PostgreSQL 16 |
| ORM | Prisma 5.22 |
| Estrategia | Migraciones versionadas (`prisma migrate`) |
| BD de test | PostgreSQL separada (configurada en Fase 5) |

---

## Modelos

### User
Gestiona autenticación y roles del sistema.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | Clave primaria, auto-generada |
| email | String (unique) | Identificador de login |
| password | String | Hash bcrypt factor 12 |
| name | String | Nombre visible |
| role | String | `admin`, `technician`, `viewer` |
| active | Boolean | Permite desactivar sin borrar |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Ticket
Incidencias técnicas del sistema CAFM/CMMS.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | Clave primaria |
| title | String | Título de la incidencia |
| description | String | Descripción detallada |
| category | String | Electricidad, Climatización, IT... |
| location | String | Ubicación física |
| priority | String | `low`, `medium`, `high`, `critical` |
| status | String | `open`, `in_progress`, `pending`, `resolved`, `closed` |
| imageUrl | String? | Foto adjunta (opcional) |
| creatorId | UUID FK | Usuario que creó la incidencia |
| assigneeId | UUID FK? | Técnico asignado (opcional) |

Índices: `status`, `priority`, `category`, `assigneeId`, `creatorId`, `updatedAt`

### TicketComment
Historial de comentarios y acciones sobre cada ticket.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | Clave primaria |
| content | String | Texto del comentario |
| action | String? | `assigned`, `status_change` (opcional) |
| ticketId | UUID FK | Ticket al que pertenece |
| userId | UUID FK | Usuario que comentó |

Cascade delete: al borrar un ticket, se eliminan sus comentarios.

### SecurityLog
Registro de eventos de seguridad (SIEM básico).

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | Clave primaria |
| eventType | String | `login_success`, `login_failed`, `access_denied`... |
| userId | UUID FK? | Usuario implicado (si existe) |
| userEmail | String? | Email del usuario |
| ip | String? | IP de origen |
| country | String? | País de origen (si se puede determinar) |
| severity | String | `info`, `low`, `medium`, `high`, `critical` |
| description | String | Descripción legible del evento |
| userAgent | String? | User-Agent del cliente |

Índices: `severity`, `eventType`, `createdAt`, `ip`, `userId`

---

## Configuración rápida

### Opción A — Docker (recomendado, no requiere instalar PostgreSQL)

```bash
# Levantar solo PostgreSQL con Docker
docker run -d \
  --name securefm-db \
  -e POSTGRES_USER=sfm_user \
  -e POSTGRES_PASSWORD=sfm_password \
  -e POSTGRES_DB=securefm_soc \
  -p 5432:5432 \
  postgres:16-alpine

# Verificar que está corriendo
docker ps
```

En Fase 4 se añade `docker-compose.yml` que levanta todo el stack de una vez.

### Opción B — PostgreSQL local instalado

Asegúrate de tener PostgreSQL ≥14 instalado. Luego crea la BD:

```sql
-- Conecta como superusuario (psql -U postgres)
CREATE USER sfm_user WITH PASSWORD 'sfm_password';
CREATE DATABASE securefm_soc OWNER sfm_user;
GRANT ALL PRIVILEGES ON DATABASE securefm_soc TO sfm_user;
```

### Opción C — Servicio cloud gratuito (sin instalar nada)

| Servicio | Plan gratuito | URL de ejemplo |
|----------|--------------|----------------|
| [Neon](https://neon.tech) | 0.5 GB | `postgresql://user:pass@ep-xyz.neon.tech/securefm_soc` |
| [Supabase](https://supabase.com) | 500 MB | `postgresql://postgres:pass@db.xyz.supabase.co:5432/postgres` |
| [Railway](https://railway.app) | 500 MB / mes | `postgresql://postgres:pass@containers-us-west.railway.app:5432/railway` |

---

## Setup completo desde cero

```bash
# 1. Ir a la carpeta backend
cd backend

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de PostgreSQL

# 3. Instalar dependencias
npm install

# 4. Generar el cliente Prisma
npm run db:generate

# 5. Ejecutar migraciones (crea las tablas)
npm run db:migrate
# Cuando pregunte el nombre de la migración, escribe: init

# 6. Cargar datos de prueba
npm run seed

# 7. Arrancar el servidor
npm run dev
```

---

## Scripts de base de datos

| Script | Comando | Cuándo usar |
|--------|---------|-------------|
| `npm run db:generate` | `prisma generate` | Después de cambiar schema.prisma |
| `npm run db:migrate` | `prisma migrate dev` | Para aplicar cambios al schema en desarrollo |
| `npm run db:deploy` | `prisma migrate deploy` | Para aplicar migraciones en producción |
| `npm run db:reset` | `prisma migrate reset` | Borrar todo y empezar desde cero (solo dev) |
| `npm run db:studio` | `prisma studio` | Explorador visual de la BD en el navegador |
| `npm run seed` | `ts-node prisma/seed.ts` | Cargar datos de prueba |

---

## Ciclo de desarrollo con Prisma Migrate

### Añadir un nuevo campo al schema

```bash
# 1. Editar backend/prisma/schema.prisma
# 2. Crear la migración
npm run db:migrate
# Prisma pregunta el nombre → escribe algo descriptivo, ej: add_ticket_tags

# 3. Regenerar el cliente
npm run db:generate
```

Las migraciones se guardan en `prisma/migrations/` y deben commitearse en git.

### Resetear la base de datos (solo desarrollo)

```bash
# Borra todas las tablas y re-aplica migraciones + seed
npm run db:reset
# Luego recarga datos demo:
npm run seed
```

**Nunca usar `db:reset` en producción.**

---

## Aplicar migraciones en producción

En producción **no** se usa `migrate dev` (que es interactivo y puede pedir confirmación). Se usa:

```bash
npm run db:deploy
```

Este comando aplica todas las migraciones pendientes de forma no interactiva. Es seguro en CI/CD.

El script `render-build` ya incluye `prisma migrate deploy` en lugar de `db push`.

---

## Diferencia entre `migrate dev` y `db push`

| | `prisma migrate dev` | `prisma db push` |
|---|---|---|
| **Migraciones** | Crea archivos SQL versionados | No crea archivos |
| **Historial** | Sí, en `prisma/migrations/` | No |
| **Producción** | No (usar `migrate deploy`) | No recomendado |
| **Equipo** | Sí, migraciones compartidas por git | No |
| **Reset destructivo** | No por defecto | Puede serlo |

La versión anterior del proyecto usaba `db push` (adecuado para SQLite/prototipos). A partir de esta fase usamos `migrate dev` porque estamos en PostgreSQL con datos reales que importan.

---

## Datos de prueba (seed)

El seed incluye:

- **4 usuarios** con roles distintos y contraseñas hasheadas
- **15 tickets** con categorías, prioridades y estados variados
- **41 eventos de seguridad** con IPs reales de ejemplos (incluyendo IPs sospechosas simuladas de Rusia, China y nodos TOR)
- **Comentarios** en los primeros 5 tickets

### Usuarios demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@securefm.local` | `Admin123!` | admin |
| `tech@securefm.local` | `Tech123!` | technician |
| `tech2@securefm.local` | `Tech123!` | technician |
| `viewer@securefm.local` | `Viewer123!` | viewer |

---

## Conexión directa a la base de datos

### Con psql

```bash
psql postgresql://sfm_user:sfm_password@localhost:5432/securefm_soc
```

### Con Prisma Studio (interfaz visual)

```bash
npm run db:studio
# Abre http://localhost:5555 en el navegador
```

### Con Docker exec (si usas el contenedor)

```bash
docker exec -it securefm-db psql -U sfm_user -d securefm_soc
```

---

## Diferencias entre entornos

| Entorno | BD | Cómo inicializar |
|---------|-----|-----------------|
| **Desarrollo** | PostgreSQL local o Docker | `db:migrate` + `seed` |
| **Test** | PostgreSQL separada (Fase 5) | Automático en CI |
| **Producción** | PostgreSQL cloud (Neon/Render/Railway) | `db:deploy` (sin seed) |

---

## Solución de errores comunes

### `Can't reach database server at localhost:5432`

PostgreSQL no está corriendo. Arranca el contenedor Docker:
```bash
docker start securefm-db
# o si no existe:
docker run -d --name securefm-db -e POSTGRES_USER=sfm_user -e POSTGRES_PASSWORD=sfm_password -e POSTGRES_DB=securefm_soc -p 5432:5432 postgres:16-alpine
```

### `Migration failed to apply cleanly`

Suele pasar si se hizo `db push` antes y hay inconsistencias. Solución en desarrollo:
```bash
npm run db:reset
npm run seed
```

### `Environment variable not found: DATABASE_URL`

No has copiado `.env.example` a `.env`:
```bash
cp .env.example .env
# Y editar DATABASE_URL con tu conexión
```

### `P1001: Can't reach database server` en producción

Verificar que `DATABASE_URL` en las variables de entorno del servicio cloud apunta a la BD correcta y que el firewall/red permite la conexión.

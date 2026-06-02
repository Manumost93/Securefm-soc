# SecureFM SOC

**Plataforma fullstack de gestión de incidencias técnicas y monitorización de seguridad**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-Prisma-003B57?style=flat&logo=sqlite&logoColor=white)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ¿Qué es SecureFM SOC?

SecureFM SOC es un proyecto de portfolio fullstack que combina dos mundos reales:

- **Facility Management (CAFM/CMMS):** gestión de incidencias técnicas de mantenimiento (electricidad, climatización, seguridad, IT...) con flujo completo de tickets, roles y asignación de técnicos.
- **Ciberseguridad aplicada:** dashboard SOC con eventos de seguridad categorizados por severidad, auditor web pasivo que analiza cabeceras HTTP y genera informes de riesgo, logs de acceso y sistema de alertas.

El proyecto está pensado para demostrar competencias en desarrollo fullstack orientado a AppSec, automatización y sistemas de monitorización, con estética de panel táctico inspirada en entornos SOC reales.

---

## Stack Técnico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| **Backend** | Node.js, Express, TypeScript |
| **Base de datos** | SQLite + Prisma ORM |
| **Autenticación** | JWT + bcrypt (coste 12) |
| **Seguridad** | Helmet, CORS restrictivo, express-rate-limit, express-validator |
| **Visualización** | Recharts (AreaChart, BarChart, PieChart) |

---

## Módulos

### Módulo 1 — Gestión de Incidencias (CAFM/CMMS)
Sistema de tickets técnicos con flujo completo:
- Crear, editar, asignar, comentar y cerrar incidencias
- Control de acceso por rol: **admin**, **technician**, **viewer**
- Filtros por estado, prioridad, categoría, técnico asignado y texto libre
- Historial de acciones y comentarios por ticket
- **Exportación a CSV** del listado completo o filtrado
- Categorías: Electricidad, Climatización, Fontanería, Seguridad, IT, Prevención...

### Módulo 2 — SOC Dashboard
Panel de monitorización de eventos de seguridad:
- Métricas en tiempo real: total eventos, críticos, logins fallidos, accesos denegados
- **Gráfica de distribución** por tipo de evento (BarChart)
- **Distribución por severidad** (PieChart con donut)
- Actividad por país de origen de IP
- Listado de IPs con más alertas
- Filtros por severidad, tipo de evento y exportación a CSV
- Badge de notificación en navbar con polling de eventos críticos (60s)

### Módulo 3 — WebSec Auditor
Herramienta de análisis pasivo de seguridad web:
- Analiza cualquier URL mediante cabeceras HTTP (sin fuzzing ni técnicas agresivas)
- **Score de seguridad de 0 a 100**
- Checks: HTTPS, Content-Security-Policy, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Detección de servidor/tecnología expuesta en cabeceras
- Informe con riesgos, checks superados y recomendaciones priorizadas
- Cada auditoría genera un evento automático en el SOC Dashboard

---

## Seguridad Implementada

| Medida | Implementación |
|--------|----------------|
| Autenticación | JWT HS256, expiración 8h, middleware de verificación |
| Contraseñas | bcrypt factor 12, nunca se exponen en respuestas |
| Control de acceso | RBAC con middleware `authorize(...roles)` por endpoint |
| Rate limiting | Global: 200 req/15min · Login: 20 req/15min por IP |
| Cabeceras HTTP | Helmet (CSP, X-Frame-Options, HSTS, nosniff...) |
| CORS | Origen único configurable via `FRONTEND_URL` |
| Validación | express-validator en todos los inputs de entrada |
| Logs de seguridad | Registro automático de login, accesos denegados, cambios de rol, eliminaciones |
| Secretos | Variables de entorno, nunca hardcodeados en código |

Documentación completa en [`docs/SECURITY.md`](docs/SECURITY.md) y [`docs/OWASP_RISKS.md`](docs/OWASP_RISKS.md).

---

## Estructura del Proyecto

```
securefm-soc/
├── backend/
│   ├── src/
│   │   ├── controllers/         # Lógica de negocio por módulo
│   │   │   ├── auth.controller.ts
│   │   │   ├── tickets.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── logs.controller.ts
│   │   │   ├── audit.controller.ts
│   │   │   └── profile.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT verify + rol
│   │   │   └── error.middleware.ts  # Manejo centralizado
│   │   ├── routes/                  # Endpoints REST
│   │   ├── services/
│   │   │   └── log.service.ts       # Registro de eventos SOC
│   │   ├── types/index.ts
│   │   ├── app.ts                   # Config Express + middleware
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma            # Modelos: User, Ticket, Comment, SecurityLog
│   │   └── seed.ts                  # 4 usuarios + 15 tickets + 41 logs
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/              # Sidebar, Navbar, Layout
│   │   │   └── UI/                  # Badge, StatCard, LoadingSpinner, EmptyState
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Estado global de autenticación
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx        # Stats + timeline + eventos
│   │   │   ├── Tickets/             # List, Detail, Form
│   │   │   ├── SOCDashboard.tsx     # Eventos + gráficas + export
│   │   │   ├── WebSecAuditor.tsx    # Análisis de URLs
│   │   │   ├── Users.tsx            # Gestión de usuarios (admin)
│   │   │   ├── Profile.tsx          # Cambio de nombre y contraseña
│   │   │   └── NotFound.tsx
│   │   ├── services/
│   │   │   └── api.ts               # Axios + interceptors JWT
│   │   ├── types/index.ts
│   │   └── utils/
│   │       └── export.ts            # Exportación a CSV
│   ├── .env.example
│   └── package.json
│
└── docs/
    ├── SECURITY.md          # Medidas de seguridad detalladas
    ├── OWASP_RISKS.md       # OWASP Top 10 y mitigaciones
    ├── API.md               # Documentación de endpoints REST
    └── PORTFOLIO_SUMMARY.md # Descripción para CV/LinkedIn
```

---

## Instalación y Ejecución

### Requisitos
- Node.js 18+
- npm 9+

### 1. Clonar el repositorio

```bash
git clone https://github.com/Manumost93/Securefm-soc.git
cd Securefm-soc
```

### 2. Configurar el Backend

```bash
cd backend

# Variables de entorno
cp .env.example .env
# Editar .env si es necesario (el archivo de ejemplo ya funciona para desarrollo local)

# Instalar dependencias
npm install

# Generar cliente Prisma y crear base de datos SQLite
npm run db:setup

# Poblar base de datos con datos de prueba
npm run seed

# Iniciar servidor de desarrollo (puerto 3001)
npm run dev
```

### 3. Configurar el Frontend

```bash
# En otra terminal
cd frontend

# Variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 5173)
npm run dev
```

### 4. Abrir en el navegador

```
http://localhost:5173
```

---

## Usuarios de Prueba

| Email | Contraseña | Rol | Permisos |
|-------|------------|-----|----------|
| `admin@securefm.local` | `Admin123!` | **admin** | Acceso total: usuarios, tickets, logs, auditor, perfil |
| `tech@securefm.local` | `Tech123!` | **technician** | Tickets + SOC + auditor + perfil |
| `viewer@securefm.local` | `Viewer123!` | **viewer** | Solo lectura + auditor + perfil |

> Los usuarios de prueba ya están incluidos en el seed. No necesitas registrarte.

---

## Endpoints API

| Método | Ruta | Descripción | Rol mínimo |
|--------|------|-------------|------------|
| `POST` | `/api/auth/login` | Login, devuelve JWT | Público |
| `GET` | `/api/auth/me` | Usuario autenticado | Auth |
| `GET` | `/api/tickets` | Listado con filtros | Auth |
| `POST` | `/api/tickets` | Crear ticket | Technician |
| `PUT` | `/api/tickets/:id` | Editar ticket | Technician |
| `DELETE` | `/api/tickets/:id` | Eliminar ticket | Admin |
| `POST` | `/api/tickets/:id/comments` | Añadir comentario | Technician |
| `GET` | `/api/logs` | Eventos de seguridad | Technician |
| `GET` | `/api/logs/stats` | Estadísticas SOC | Technician |
| `POST` | `/api/audit` | Auditar URL | Auth |
| `GET` | `/api/users` | Listado usuarios | Admin |
| `POST` | `/api/users` | Crear usuario | Admin |
| `PUT` | `/api/profile/name` | Cambiar nombre | Auth |
| `PUT` | `/api/profile/password` | Cambiar contraseña | Auth |

Documentación completa en [`docs/API.md`](docs/API.md).

---

## Scripts Disponibles

### Backend
```bash
npm run dev        # Servidor de desarrollo con hot reload
npm run build      # Compilar TypeScript a dist/
npm run start      # Ejecutar build de producción
npm run db:setup   # Prisma generate + db push
npm run seed       # Poblar base de datos con datos de prueba
npm run db:studio  # Abrir Prisma Studio (explorador visual de BD)
```

### Frontend
```bash
npm run dev        # Servidor de desarrollo Vite
npm run build      # Build de producción
npm run preview    # Vista previa del build
```

---

## Datos de Prueba incluidos

El seed genera automáticamente:

- **4 usuarios** (admin, 2 técnicos, viewer)
- **15 tickets** con diferentes estados, prioridades, categorías y ubicaciones reales
- **41 eventos de seguridad** que incluyen:
  - Intentos de login fallidos desde IPs sospechosas (Rusia, China)
  - Intentos de acceso con usuarios inexistentes
  - Rate limit activado
  - Cambios de rol
  - IPs de nodos TOR detectadas
  - Auditorías web ejecutadas
  - Accesos denegados por permisos insuficientes

---

## Qué demuestra este proyecto

### Desarrollo Fullstack
- Arquitectura cliente-servidor desacoplada con API REST
- TypeScript estricto en frontend y backend
- Gestión de estado con React Context
- Componentes reutilizables y tipado fuerte

### Ciberseguridad Aplicada
- Autenticación JWT con expiración y refresh implícito
- Control de acceso basado en roles (RBAC) real, no simulado
- Protección contra brute force con rate limiting
- Análisis de seguridad web pasivo (OWASP A10: SSRF mitigado)
- Registro y visualización de eventos de seguridad estilo SIEM básico
- Documentación de riesgos OWASP con mitigaciones implementadas

### Experiencia Sectorial
- Conocimiento real de categorías y flujos de mantenimiento (CAFM/CMMS)
- Terminología correcta de facility management
- Integración natural entre gestión operacional y seguridad

---

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [`docs/SECURITY.md`](docs/SECURITY.md) | JWT, bcrypt, RBAC, rate limiting, Helmet, validación |
| [`docs/OWASP_RISKS.md`](docs/OWASP_RISKS.md) | OWASP Top 10 — riesgos analizados y mitigados |
| [`docs/API.md`](docs/API.md) | Todos los endpoints con parámetros y respuestas |
| [`docs/PORTFOLIO_SUMMARY.md`](docs/PORTFOLIO_SUMMARY.md) | Descripción lista para CV y LinkedIn |

---

## Autor

**Manuel** — Estudiante de DAM orientado a ciberseguridad, AppSec y automatización.

Prácticas en Prosegur · Conocimientos en Java, JavaScript, TypeScript, React, Python, SQL, microservicios y seguridad de aplicaciones.

---

## Licencia

MIT — Libre para uso, modificación y distribución con atribución.

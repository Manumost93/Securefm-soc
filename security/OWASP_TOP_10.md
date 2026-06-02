# OWASP Top 10 (2021) — SecureFM SOC

Análisis de cada riesgo OWASP aplicado al código real del proyecto, con referencias exactas a los archivos y líneas donde se mitigan.

---

## A01:2021 — Broken Access Control

**Riesgo:** Usuarios que acceden a recursos o acciones para las que no tienen permisos.

### Implementación en este proyecto

**Middleware de autenticación** (`backend/src/middleware/auth.middleware.ts`):
```typescript
export const authenticate = (req, res, next) => {
  // Verifica el JWT en cada petición a endpoints protegidos
  const payload = jwt.verify(token, secret) as AuthPayload;
  req.user = payload;
  next();
};
```

**Middleware de autorización por rol**:
```typescript
export const authorize = (...roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }
  };
};
```

**Aplicado por endpoint** (`backend/src/routes/`):
- `DELETE /api/tickets/:id` → `authorize('admin')`
- `GET /api/users` → `authorize('admin')`
- `POST /api/users` → `authorize('admin')`
- `GET /api/logs` → `authorize('admin', 'technician')`
- `POST /api/tickets` → `authorize('admin', 'technician')`

**Verificado en tests** (`backend/tests/rbac.test.ts`): 10 tests que cubren todos los roles vs todos los endpoints sensibles.

### Riesgo residual
Sin índice de propiedad explícito en tickets — un técnico puede editar tickets de otro técnico. Aceptado por diseño (equipo colaborativo).

---

## A02:2021 — Cryptographic Failures

**Riesgo:** Datos sensibles expuestos por uso de criptografía débil o ausente.

### Contraseñas

`backend/src/controllers/users.controller.ts` y `auth.controller.ts`:
```typescript
const hashed = await bcrypt.hash(password, 12); // factor 12 — ~300ms de cómputo
const valid = await bcrypt.compare(password, user.password);
```

- Factor 12 es el balance recomendado entre seguridad y rendimiento (2024).
- Las contraseñas **nunca** se devuelven en respuestas — el `select` de Prisma las excluye explícitamente.

### JWT

```typescript
jwt.sign({ userId, email, role }, secret, { expiresIn: '8h' });
```

- Algoritmo: HS256 (simétrico, adecuado para un único backend)
- Secret: mínimo 32 caracteres, validado al inicio del servidor
- El servidor **falla al arrancar** si `JWT_SECRET` no está definido

### HTTPS

En producción (Docker + Nginx o cloud), todo el tráfico debe ir sobre HTTPS. La app no fuerza HTTPS internamente (responsabilidad del servidor/proxy).

**Helmet** aplica HSTS si el proxy envía cabeceras HTTPS:
```typescript
app.use(helmet()); // Incluye Strict-Transport-Security
```

---

## A03:2021 — Injection

**Riesgo:** Inyección SQL, NoSQL, command injection, XSS.

### SQL Injection

Prisma ORM usa **queries parametrizadas** en todas las operaciones. No hay concatenación de strings SQL en ningún punto del código.

```typescript
// Seguro — Prisma parametriza automáticamente
await prisma.user.findUnique({ where: { email } });
await prisma.ticket.findMany({ where: { title: { contains: search, mode: 'insensitive' } } });
```

### Validación de inputs

`express-validator` en todos los endpoints que reciben datos:
```typescript
body('email').isEmail().normalizeEmail(),
body('password').isLength({ min: 6 }),
body('title').trim().isLength({ min: 3, max: 200 }),
```

### XSS

- Helmet aplica `Content-Security-Policy` en las respuestas del backend.
- El frontend (React) escapa automáticamente el contenido renderizado.
- No se usa `dangerouslySetInnerHTML` en ningún componente.

---

## A04:2021 — Insecure Design

**Riesgo:** Arquitectura que no contempla la seguridad desde el diseño.

### Principios aplicados

**Separación de responsabilidades:**
```
routes/ → Definición de endpoints y middleware
controllers/ → Lógica de negocio
services/ → Operaciones transversales (logging)
lib/ → Infraestructura (Prisma singleton)
middleware/ → Autenticación y manejo de errores
```

**Principio de mínimo privilegio:**
- Viewer: solo lectura. No puede escribir, no puede ver logs SOC.
- Technician: gestión de tickets, acceso SOC. No puede gestionar usuarios.
- Admin: acceso total, incluyendo gestión de usuarios y eliminación.

**Fail-safe por defecto:**
- Si no hay JWT_SECRET al arrancar → `process.exit(1)`. No hay fallback inseguro.
- Si el token es inválido o expirado → 401. Nunca se pasa al siguiente middleware.

**Defense in depth:**
- Rate limiting + JWT + RBAC + validación de inputs → capas de defensa independientes.

---

## A05:2021 — Security Misconfiguration

**Riesgo:** Configuración por defecto insegura, puertos abiertos, información expuesta.

### Helmet (`backend/src/app.ts`)

```typescript
app.use(helmet());
```

Aplica automáticamente:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (CSP es más efectivo)
- `Strict-Transport-Security` (si hay HTTPS)
- `Content-Security-Policy` (configuración por defecto)
- Elimina `X-Powered-By`

### CORS restrictivo

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

Solo el origen del frontend puede llamar a la API.

### Variables de entorno

- Todos los secretos van en `.env` (no commiteado)
- `.env.example` tiene valores de ejemplo sin secretos reales
- `JWT_SECRET` validado al arranque

---

## A06:2021 — Vulnerable and Outdated Components

**Riesgo:** Dependencias con CVEs conocidos.

### Controles implementados

**Dependabot** (`.github/dependabot.yml`):
- Revisa semanalmente las dependencias de backend, frontend, GitHub Actions y Docker.
- Abre PRs automáticos con las actualizaciones.

**npm audit en CI** (`.github/workflows/ci.yml`):
- Se ejecuta en cada push/PR.
- Nivel mínimo de alerta: `high` — solo falla el pipeline por vulnerabilidades high/critical.

**Versiones usadas (a fecha de desarrollo):**
- Express 4.18 — sin CVEs conocidos
- Prisma 5.22 — versión actual estable
- jsonwebtoken 9.0 — sin CVEs conocidos en esta versión
- bcryptjs 2.4 — librería madura, sin CVEs

### Comprobación manual

```bash
cd backend && npm audit
cd frontend && npm audit
```

---

## A07:2021 — Identification and Authentication Failures

**Riesgo:** Autenticación rota, sesiones mal gestionadas.

### Controles

| Control | Implementación |
|---------|---------------|
| Rate limiting en login | 20 req / 15 min por IP |
| Mensajes genéricos | "Credenciales inválidas" — no revela si el email existe |
| JWT con expiración | 8 horas |
| Verificación en cada request | Middleware `authenticate` en todas las rutas protegidas |
| Usuarios desactivados | Login rechazado aunque la contraseña sea correcta |
| Registro de fallos | `login_failed` con IP, severidad `medium` |

### Código relevante

```typescript
// auth.controller.ts — mismo mensaje para usuario inexistente y contraseña incorrecta
if (!user || !user.active) {
  res.status(401).json({ message: 'Credenciales inválidas' }); // No revela si el email existe
}
const valid = await bcrypt.compare(password, user.password);
if (!valid) {
  res.status(401).json({ message: 'Credenciales inválidas' }); // Mismo mensaje
}
```

### Riesgo residual documentado

Sin refresh tokens — cuando el JWT expira (8h), el usuario debe volver a autenticarse. Sin blacklist — un JWT robado es válido hasta que expira. Mitigación: tiempo de vida corto (8h).

---

## A08:2021 — Software and Data Integrity Failures

**Riesgo:** Deserialización insegura, dependencias de fuentes no confiables.

### Controles

**CORS:** Solo peticiones del frontend autorizado llegan al backend.

**CI/CD con verificación de builds:**
- Los tests deben pasar antes de hacer merge a `main`.
- El build de TypeScript falla si hay errores de tipos.
- Dependabot revisa la integridad de las dependencias semanalmente.

**package-lock.json commiteado:**
- Garantiza instalaciones reproducibles con versiones exactas.
- `npm ci` (usado en CI) solo instala lo que hay en el lockfile.

**No deserialización de datos no confiables:**
- `express.json()` parsea JSON estándar, sin eval ni deserialización custom.
- Prisma convierte resultados de BD a objetos TypeScript tipados.

---

## A09:2021 — Security Logging and Monitoring Failures

**Riesgo:** Eventos de seguridad no registrados, imposible detectar ataques.

### SecurityLog en base de datos

Todos los eventos relevantes se registran con:
- `eventType` — tipo de evento
- `userEmail` — email implicado
- `ip` — IP de origen
- `severity` — `info | low | medium | high | critical`
- `description` — texto legible
- `userAgent` — cliente usado
- `createdAt` — timestamp

**Eventos registrados:**

| Evento | Severidad | Cuándo |
|--------|-----------|--------|
| `login_success` | info | Login correcto |
| `login_failed` | medium | Contraseña incorrecta o usuario inexistente |
| `access_denied` | low/medium | Token sin permisos suficientes |
| `role_changed` | high | Admin cambia el rol de un usuario |
| `ticket_created` | info | Nuevo ticket |
| `ticket_deleted` | medium | Ticket eliminado |
| `suspicious_ip` | high/critical | IP marcada como sospechosa |
| `rate_limit_triggered` | high | Rate limit alcanzado |
| `web_audit_executed` | info/medium | Auditoría web realizada |
| `web_audit_blocked` | high | Auditoría bloqueada por SSRF |

### SOC Dashboard

- Visualización en tiempo real de todos los eventos.
- Filtros por severidad, tipo de evento, IP, fecha.
- Badge en navbar con polling de eventos críticos cada 60s.
- Exportación a CSV de los logs filtrados.

### Riesgo residual

Los logs están en la misma PostgreSQL que los datos. En producción real, deben exportarse a un sistema externo (Elastic Stack, Splunk, AWS CloudWatch) para garantizar su integridad e independencia.

---

## A10:2021 — Server-Side Request Forgery (SSRF)

**Riesgo:** El servidor hace peticiones HTTP a URLs controladas por el atacante, pudiendo acceder a la red interna.

**Este es el riesgo más relevante para SecureFM SOC** porque el módulo WebSec Auditor hace peticiones HTTP salientes.

### Controles implementados

`backend/src/controllers/audit.controller.ts`:

**1. Solo protocolos HTTP/HTTPS:**
```typescript
if (!['http:', 'https:'].includes(parsed.protocol)) {
  // Bloquea file://, ftp://, gopher://, etc.
}
```

**2. Bloqueo de IPs privadas y metadata cloud:**
```typescript
const BLOCKED_RANGES = [
  /^127\./,           // Loopback
  /^0\.0\.0\.0/,     // Any address
  /^::1$/,            // IPv6 loopback
  /^10\./,            // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC 1918
  /^192\.168\./,      // RFC 1918
  /^169\.254\./,      // Link-local (incluye 169.254.169.254 - metadata AWS/GCP)
  /^fc00:/i,          // IPv6 unique local
  /^fd/i,
  /^fe80:/i,          // IPv6 link-local
];
```

**3. Resolución DNS + validación de IP resultante:**
```typescript
// Si el hostname no es una IP directa, resuelve DNS y valida la IP resultante
const addresses = await dns.resolve4(hostname);
for (const ip of addresses) {
  if (isPrivateIp(ip)) {
    // Bloquea aunque el DNS apunte a una IP interna (DNS rebinding)
  }
}
```

**4. Timeout corto:**
```typescript
setTimeout(() => controller.abort(), 10000); // 10 segundos máximo
```

**5. Solo cabeceras, no body:**
El auditor solo lee los headers de la respuesta HTTP — nunca el body. Esto limita la cantidad de datos que puede exfiltrar.

**6. Rate limiting específico:**
`/api/audit` tiene su propio rate limiter: **10 requests / 15 minutos** por IP.

**7. Logging de intentos bloqueados:**
Cada intento de SSRF bloqueado genera un `web_audit_blocked` con severity `high` en el SOC.

### Documentación extendida

Ver `security/WEB_AUDITOR_SECURITY.md` para análisis completo del módulo auditor.

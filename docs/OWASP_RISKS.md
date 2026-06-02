# OWASP Top 10 — SecureFM SOC

## A01:2021 — Broken Access Control

**Riesgo:** Un usuario podría acceder a recursos de otro rol sin autorización.

**Mitigado:**
- Middleware `authenticate` verifica JWT en cada ruta protegida.
- Middleware `authorize(roles)` comprueba el rol del token antes de cada operación sensible.
- Los viewers no pueden crear, editar ni eliminar tickets.
- Solo admins pueden eliminar tickets o gestionar usuarios.

**Pendiente en producción:** Implementar auditoría de accesos más granular y alertas en tiempo real.

---

## A02:2021 — Cryptographic Failures

**Riesgo:** Contraseñas en texto plano o cifrado débil.

**Mitigado:**
- Bcrypt con coste 12 para todas las contraseñas.
- JWT firmado con secreto fuerte (mínimo 32 chars).
- Ninguna contraseña se devuelve en respuestas de API.

**Pendiente en producción:** Forzar HTTPS, HSTS en servidor, cifrado de base de datos en reposo.

---

## A03:2021 — Injection

**Riesgo:** SQL Injection, NoSQL Injection, Command Injection.

**Mitigado:**
- Prisma ORM usa queries parametrizadas. No hay concatenación de strings SQL.
- `express-validator` valida y sanitiza todos los inputs antes de procesarlos.
- Los campos de texto se trimean y limitan en longitud.

---

## A04:2021 — Insecure Design

**Mitigado:**
- Arquitectura por capas: rutas → controladores → servicios.
- Principio de menor privilegio en roles (viewer no puede modificar nada).
- Rate limiting como defensa por diseño contra brute force.

---

## A05:2021 — Security Misconfiguration

**Mitigado:**
- Helmet aplica cabeceras de seguridad por defecto.
- CORS limitado al origen del frontend.
- Variables de entorno gestionadas con `.env` (nunca en código).
- No se expone información del servidor (eliminación de cabeceras X-Powered-By).

---

## A06:2021 — Vulnerable and Outdated Components

**Mitigado:**
- Dependencias actualizadas a versiones recientes en `package.json`.
- Sin librerías con CVEs conocidos críticos en la versión usada.

**Pendiente en producción:** Pipeline de CI/CD con Dependabot o `npm audit` automatizado.

---

## A07:2021 — Identification and Authentication Failures

**Mitigado:**
- JWT con expiración de 8h.
- Rate limiting agresivo en endpoint de login (20 req/15 min).
- Mensajes de error genéricos ("Credenciales inválidas") que no revelan si el email existe.
- Registro de intentos fallidos en logs de seguridad.

**Pendiente en producción:** MFA, bloqueo de cuenta tras N intentos, notificación por email.

---

## A08:2021 — Software and Data Integrity Failures

**Mitigado:**
- Solo el frontend autorizado puede llamar a la API (CORS).
- No hay deserialización de datos no confiables.

---

## A09:2021 — Security Logging and Monitoring Failures

**Mitigado:**
- Registro de todos los eventos relevantes en `SecurityLog`.
- Dashboard SOC para visualizar los eventos en tiempo real.
- Los logs incluyen IP, User-Agent, email, severidad y descripción.

**Pendiente en producción:** Alertas automáticas, integración con SIEM, retención de logs configurada.

---

## A10:2021 — Server-Side Request Forgery (SSRF)

**Relevante para:** El módulo WebSec Auditor hace peticiones HTTP salientes.

**Mitigado:**
- La URL es validada y parseada antes de hacer fetch.
- Se acepta solo HTTP/HTTPS (no file://, ftp://, etc.).
- Timeout de 10 segundos para evitar hang.
- El auditor solo lee cabeceras, no ejecuta código ni sigue redirecciones arbitrarias.

**Pendiente en producción:** Whitelist de dominios permitidos, bloqueo de IPs privadas (169.254.x.x, 10.x.x.x, etc.) para evitar SSRF hacia la red interna.

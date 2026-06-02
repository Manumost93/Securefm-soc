# Threat Model — SecureFM SOC

Análisis de amenazas aplicado a la arquitectura real del proyecto.  
Metodología: STRIDE simplificado + análisis de superficie de ataque.

---

## Arquitectura del sistema

```
[Usuario/Navegador]
        │ HTTPS
        ▼
[Frontend React - Nginx]
        │ HTTP interno (Docker) o directo
        ▼
[Backend Express / Node.js]
   │              │
   ▼              ▼
[PostgreSQL]   [Internet - WebSec Auditor]
```

**Activos a proteger:**
- Credenciales de usuarios (contraseñas, tokens JWT)
- Datos de incidencias técnicas (tickets)
- Logs de seguridad (SOC Dashboard)
- Acceso al sistema de gestión de facilities

---

## Superficie de ataque

| Superficie | Descripción | Nivel de riesgo |
|------------|-------------|----------------|
| `POST /api/auth/login` | Punto de entrada pública | Alto |
| `POST /api/audit` | Hace peticiones HTTP salientes | Alto |
| Todos los endpoints `/api/*` | Requieren JWT válido | Medio |
| Base de datos PostgreSQL | Solo accesible desde backend | Bajo |
| Frontend estático | Solo HTML/JS, sin lógica sensible | Bajo |

---

## Análisis STRIDE

### S — Spoofing (Suplantación de identidad)

**Amenaza:** Un atacante intenta autenticarse como otro usuario.

| Vector | Mitigación | Estado |
|--------|-----------|--------|
| Robo de JWT por XSS | HttpOnly cookies serían más seguras; localStorage es un trade-off documentado | ⚠️ Parcial |
| Brute force en login | Rate limiting: 20 req/15min por IP | ✅ |
| JWT con firma débil | bcrypt factor 12 + JWT_SECRET mínimo 32 chars | ✅ |
| Token expirado usado | JWT con expiración 8h, verificación en cada request | ✅ |
| Cuenta inexistente sondeo | Mensaje genérico "Credenciales inválidas" | ✅ |

**Residual:** El JWT almacenado en localStorage es vulnerable si se consigue ejecutar XSS. Mitigado por la CSP que aplica Helmet, pero no completamente eliminado.

---

### T — Tampering (Manipulación de datos)

**Amenaza:** Un atacante modifica datos en tránsito o directamente en la base de datos.

| Vector | Mitigación | Estado |
|--------|-----------|--------|
| SQL Injection | Prisma ORM con queries parametrizadas | ✅ |
| Modificación de datos en tránsito | HTTPS en producción (Nginx o cloud) | ✅ |
| Escalar rol propio | RBAC en middleware, el rol viene del JWT firmado | ✅ |
| Modificar ticket de otro usuario | El controlador verifica propiedad implícitamente | ⚠️ Mejorable |
| Payload JSON malformado | express-validator en todos los endpoints | ✅ |
| Límite de tamaño del payload | `express.json({ limit: '2mb' })` | ✅ |

---

### R — Repudiation (Repudio)

**Amenaza:** Un usuario niega haber realizado una acción.

| Vector | Mitigación | Estado |
|--------|-----------|--------|
| Login no registrado | `login_success` / `login_failed` en SecurityLog | ✅ |
| Creación/eliminación de tickets | `ticket_created` / `ticket_deleted` en SecurityLog | ✅ |
| Cambio de rol | `role_changed` con severity `high` en SecurityLog | ✅ |
| Acceso denegado | `access_denied` registrado con IP y User-Agent | ✅ |
| Integridad de logs | Los logs no se pueden editar por el usuario (sin endpoint de DELETE en logs) | ✅ |

**Residual:** Los logs están en la misma base de datos. Un admin podría borrar la BD directamente. En producción, exportar logs a un sistema externo (SIEM).

---

### I — Information Disclosure (Revelación de información)

**Amenaza:** Datos sensibles expuestos a partes no autorizadas.

| Vector | Mitigación | Estado |
|--------|-----------|--------|
| Contraseñas en API response | `select` en Prisma excluye el campo `password` | ✅ |
| Stack traces en errores | `errorHandler` devuelve mensaje genérico en producción | ✅ |
| Cabeceras que revelan tecnología | Helmet elimina `X-Powered-By` | ✅ |
| Versión de Node/Express expuesta | Helmet + config de Nginx | ✅ |
| Datos de otro usuario | RBAC + verificación por ID de usuario autenticado | ✅ |
| Secretos en código | Variables de entorno, `.env` en `.gitignore` | ✅ |
| Logs con datos sensibles | IP y User-Agent sí se registran (necesarios para SOC) | ⚠️ Documentado |
| Servidor de BD expuesto | PostgreSQL en subnet privada (Docker/Cloud) | ✅ |

---

### D — Denial of Service (Denegación de servicio)

**Amenaza:** Un atacante satura el sistema para dejarlo inaccesible.

| Vector | Mitigación | Estado |
|--------|-----------|--------|
| Flood de peticiones | Rate limit global: 200 req/15min por IP | ✅ |
| Flood en login | Rate limit específico: 20 req/15min por IP | ✅ |
| Flood en auditor web | Rate limit específico: 10 req/15min por IP | ✅ |
| Payload enorme | Límite de 2MB en JSON | ✅ |
| Consultas BD lentas | Índices en campos de filtro frecuente | ✅ |
| Timeout en fetch externo (auditor) | AbortController con 10s timeout | ✅ |
| Respuesta enorme del auditor | Solo se leen cabeceras, no el body | ✅ |

---

### E — Elevation of Privilege (Escalada de privilegios)

**Amenaza:** Un usuario obtiene permisos superiores a los que debería tener.

| Vector | Mitigación | Estado |
|--------|-----------|--------|
| Viewer accede a endpoints de admin | `authorize('admin')` en cada endpoint protegido | ✅ |
| Technician borra tickets | `authorize('admin')` en DELETE /tickets/:id | ✅ |
| Modificar el propio rol vía API | Solo admin puede usar `PUT /api/users/:id` | ✅ |
| Token con rol falsificado | JWT firmado con secret ≥32 chars | ✅ |
| Usuario desactivado accede | Login rechazado para `active: false` | ✅ |
| Acceso tras cambio de rol | El JWT anterior sigue siendo válido hasta expirar | ⚠️ Conocido |

**Residual conocido:** Si un admin rebaja el rol de un usuario, el JWT antiguo del usuario sigue siendo válido hasta las 8h. Mitigación: el JWT expira relativamente pronto. Solución completa requiere blacklist de tokens o reducir la expiración.

---

## Actores y casos de abuso

| Actor | Intención | Vectores más probables |
|-------|-----------|----------------------|
| Usuario no autenticado externo | Acceso no autorizado | Brute force login, enumeración de endpoints |
| Viewer interno malicioso | Leer datos que no debería | Acceso directo a endpoints de admin con token propio |
| Technician interno | Escalar a admin | Modificar su propio rol (bloqueado) |
| Atacante externo pasivo | OSINT / reconocimiento | Cabeceras del servidor, endpoints públicos |
| Atacante SSRF | Acceder a red interna vía auditor | URLs de metadata cloud, IPs privadas |
| Bot automatizado | DoS / credential stuffing | Múltiples logins fallidos desde una IP |

---

## Riesgos residuales aceptados

| Riesgo | Por qué se acepta | Cuándo revisar |
|--------|------------------|----------------|
| JWT en localStorage | Trade-off de simplicidad vs seguridad; XSS mitigado por Helmet CSP | Si se implementa MFA |
| Sin refresh tokens | Simplicidad; sesión de 8h aceptable para este contexto | Si usuarios reportan desconexiones frecuentes |
| Sin blacklist de JWT | Complejidad adicional; tokens expiran en 8h | Si hay requisito de logout inmediato |
| Logs en misma BD | Suficiente para portfolio; prod real necesita SIEM externo | Antes de producción real |
| Sin MFA | Fuera del alcance del proyecto actual | Si se añade gestión de usuarios reales |

---

## Próximas mejoras de seguridad

1. **HttpOnly cookies** para el JWT (elimina riesgo de XSS → localStorage)
2. **Blacklist de JWT** en Redis para logout inmediato y revocación de rol
3. **MFA** para cuentas admin
4. **Rate limiting por usuario autenticado** (además de por IP)
5. **Alertas automáticas** cuando `severity = critical` en SecurityLog
6. **Export de logs a sistema externo** (Elastic, Splunk, CloudWatch)
7. **Webhook de Dependabot** para alertas inmediatas de CVEs críticos

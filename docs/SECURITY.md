# SECURITY.md — SecureFM SOC

## Autenticación JWT

- Tokens firmados con HS256 y un secreto de mínimo 32 caracteres.
- Expiración configurable (por defecto 8h). Al expirar, el frontend redirige a /login.
- El token viaja exclusivamente en el header `Authorization: Bearer <token>`.
- No se almacena en cookies para evitar CSRF.

## Hashing de Contraseñas

- Bcrypt con factor de coste 12 (lento por diseño, resiste brute force).
- Las contraseñas nunca se almacenan en texto plano ni se devuelven en respuestas de la API.

## Control de Roles y Permisos

| Acción | Admin | Technician | Viewer |
|--------|-------|------------|--------|
| Ver tickets | ✅ | ✅ | ✅ |
| Crear ticket | ✅ | ✅ | ❌ |
| Editar ticket | ✅ | ✅ | ❌ |
| Eliminar ticket | ✅ | ❌ | ❌ |
| Ver logs SOC | ✅ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Ejecutar auditorías | ✅ | ✅ | ✅ |

El middleware `authorize(...roles)` verifica el rol del JWT antes de cada operación sensible.

## Rate Limiting

- Global: 200 req/15 min por IP.
- Endpoint de login: 20 intentos/15 min por IP (protección brute force).
- Respuesta 429 con mensaje claro si se supera el límite.

## Helmet (Cabeceras HTTP)

Helmet aplica automáticamente las siguientes cabeceras de seguridad en el backend:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Referrer-Policy`

## CORS

- Solo el origen del frontend configurado en `FRONTEND_URL` puede hacer peticiones.
- Métodos y cabeceras permitidas explícitamente definidos.

## Validación y Sanitización de Inputs

- `express-validator` valida todos los inputs antes de llegar al controlador.
- Se trimean y normalizan strings (emails a lowercase, textos sin espacios extra).
- Los errores de validación retornan 400 con detalle, sin revelar información interna.
- Las consultas Prisma usan parámetros tipados (no concatenación de strings → sin SQL injection).

## Gestión de Errores

- Middleware centralizado `errorHandler` captura todos los errores no controlados.
- En producción (`NODE_ENV=production`) no se expone el stack trace al cliente.
- Los logs internos van a consola del servidor, no al cliente.

## Variables de Entorno

- Ningún secreto hardcodeado en código.
- `.env.example` documenta las variables necesarias sin valores reales.
- `.gitignore` excluye `.env` y los archivos `.db` de la base de datos.

## Registro de Eventos (Security Logs)

Todos los eventos relevantes se registran en la tabla `SecurityLog`:
- Logins exitosos y fallidos con IP y User-Agent.
- Accesos denegados por permisos insuficientes.
- Cambios de roles de usuario.
- Creación y eliminación de tickets.
- Auditorías web ejecutadas.

## Mejoras para Producción

En un entorno real se añadiría:
- Rotación de tokens con Refresh Tokens.
- MFA (autenticación multifactor).
- WAF (Web Application Firewall).
- TLS/HTTPS forzado en el servidor.
- Vault o Secret Manager para gestión de secretos.
- Centralización de logs en SIEM (Splunk, ELK).

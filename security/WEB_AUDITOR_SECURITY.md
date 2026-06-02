# Seguridad del WebSec Auditor — SecureFM SOC

Análisis detallado de los controles de seguridad del módulo de auditoría web pasiva.

---

## ¿Por qué este módulo es especialmente sensible?

El WebSec Auditor es el único componente del sistema que hace **peticiones HTTP salientes** desde el servidor. Esto lo convierte en el vector más relevante para ataques de tipo **SSRF (Server-Side Request Forgery)**.

Un atacante podría intentar usar este endpoint para:
- Escanear la red interna del servidor
- Acceder al servicio de metadata de instancias cloud (AWS: `169.254.169.254`, GCP: `169.254.169.254`, Azure: `169.254.169.254`)
- Acceder a servicios internos (bases de datos, Redis, servicios sin autenticación en red privada)
- Exfiltrar información de la red del servidor

---

## Controles de seguridad implementados

### 1. Validación de protocolo

Solo se permiten `http://` y `https://`. Cualquier otro protocolo es rechazado antes de hacer la petición:

```typescript
if (!['http:', 'https:'].includes(parsed.protocol)) {
  // Bloquea: file://, ftp://, gopher://, data://, javascript://, etc.
  return res.status(400).json({ message: 'Solo se permiten URLs http:// o https://' });
}
```

### 2. Bloqueo de IPs privadas y rangos especiales

Antes de hacer la petición HTTP, se verifica que la IP de destino no sea privada:

```
Bloqueado:
  127.0.0.0/8      → Loopback (localhost)
  0.0.0.0          → Any address
  ::1              → IPv6 loopback
  10.0.0.0/8       → RFC 1918 — red privada clase A
  172.16.0.0/12    → RFC 1918 — red privada clase B
  192.168.0.0/16   → RFC 1918 — red privada clase C
  169.254.0.0/16   → Link-local (incluye metadata de AWS, GCP, Azure)
  fc00::/7         → IPv6 unique local
  fe80::/10        → IPv6 link-local
```

### 3. Resolución DNS + validación (protección contra DNS rebinding)

Si el hostname es un nombre de dominio (no una IP directa), se resuelve con DNS y se valida la IP resultante:

```typescript
const addresses = await dns.resolve4(hostname);
for (const ip of addresses) {
  if (isPrivateIp(ip)) {
    // Bloquea aunque el dominio externo resuelva a una IP privada
    // Esto previene DNS rebinding attacks
  }
}
```

**¿Qué es DNS rebinding?** Un atacante controla `evil.com` y hace que su DNS resuelva a `192.168.1.1`. Sin esta validación, el servidor haría una petición a `192.168.1.1` creyendo que es una URL externa legítima.

### 4. Timeout de la petición

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos
```

Evita que peticiones a hosts lentos o que no responden bloqueen el servidor.

### 5. Solo lectura de cabeceras

El auditor **nunca lee el body** de la respuesta HTTP. Solo lee las cabeceras:

```typescript
response.headers.forEach((value, key) => {
  responseHeaders[key.toLowerCase()] = value;
});
// El body de response nunca se consume
```

Esto limita drásticamente la cantidad de datos que se pueden exfiltrar o que pueden causar problemas de memoria.

### 6. Rate limiting específico

El endpoint `/api/audit` tiene su propio rate limiter más restrictivo que el global:

```
Global:  200 requests / 15 minutos por IP
Auditor: 10 requests  / 15 minutos por IP
```

Esto limita el uso del auditor como herramienta de escaneo automatizado.

### 7. Registro de intentos bloqueados

Cada intento de SSRF bloqueado genera un evento en SecurityLog:

```typescript
await createLog({
  eventType: 'web_audit_blocked',
  severity: 'high',
  description: `SSRF bloqueado: ${reason} — URL: ${targetUrl}`,
  ip: clientIp,
  userEmail: req.user?.email,
});
```

Estos eventos son visibles en el SOC Dashboard con severidad `high`.

### 8. User-Agent identificable

```typescript
headers: { 'User-Agent': 'SecureFM-SOC-Auditor/1.0 (Security Scanner)' }
```

El servidor destino puede identificar y bloquear el auditor si lo desea.

---

## Ataques prevenidos

| Ataque | Cómo se previene |
|--------|-----------------|
| SSRF a localhost | Bloqueo de `127.0.0.1`, `::1`, `0.0.0.0` |
| SSRF a red privada | Bloqueo de rangos RFC 1918 |
| SSRF a metadata cloud | Bloqueo de `169.254.0.0/16` |
| DNS rebinding | Resolución DNS + validación de IP resultante |
| Protocolo no HTTP | Whitelist `http:` / `https:` |
| DoS vía audit lento | Timeout de 10 segundos |
| DoS vía respuesta grande | Solo se leen cabeceras, nunca el body |
| Abuso automatizado | Rate limit 10 req/15min por IP |
| Auditoría no registrada | Cada auditoría genera SecurityLog event |

---

## Riesgos residuales

| Riesgo | Descripción | Mitigación adicional posible |
|--------|-------------|----------------------------|
| Bypass de DNS check | Si el servidor DNS está comprometido | Whitelist de dominios permitidos |
| Amplificación HTTP | El auditor puede generar tráfico hacia terceros | Rate limit + User-Agent |
| Redirecciones | `redirect: 'follow'` puede seguir a URLs no validadas | Validar la URL final tras redireccionamiento |
| IPv6 incompleto | Solo se resuelve IPv4 con `dns.resolve4` | Añadir `dns.resolve6` y validación |

---

## Configuración recomendada en producción

```bash
# Variables de entorno para el auditor
AUDIT_TIMEOUT_MS=10000          # Timeout en ms (por defecto: 10000)
AUDIT_RATE_LIMIT_MAX=10         # Peticiones máximas por ventana (por defecto: 10)
AUDIT_RATE_LIMIT_WINDOW_MS=900000  # Ventana de rate limit en ms (15 min)
```

---

## Prueba de los controles de seguridad

Para verificar que el hardening funciona (en desarrollo):

```bash
# Debería ser bloqueado con 400
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url": "http://localhost:3001/api/users"}'

# Debería ser bloqueado (IP privada)
curl -X POST http://localhost:3001/api/audit \
  -d '{"url": "http://192.168.1.1/admin"}'

# Debería ser bloqueado (metadata AWS)
curl -X POST http://localhost:3001/api/audit \
  -d '{"url": "http://169.254.169.254/latest/meta-data/"}'

# Debería funcionar (URL externa válida)
curl -X POST http://localhost:3001/api/audit \
  -d '{"url": "https://example.com"}'
```

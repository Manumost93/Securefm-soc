# API Reference — SecureFM SOC

Base URL: `http://localhost:3001/api`

Todas las rutas protegidas requieren: `Authorization: Bearer <token>`

---

## Auth

### POST /auth/login
```json
Body: { "email": "admin@securefm.local", "password": "Admin123!" }
Response: { "token": "...", "user": { "id", "email", "name", "role" } }
```

### GET /auth/me
Devuelve el usuario autenticado.

---

## Tickets

### GET /tickets
Query params: `status`, `priority`, `category`, `assigneeId`, `search`, `from`, `to`

### GET /tickets/stats
```json
Response: { "total", "open", "inProgress", "resolved", "critical" }
```

### GET /tickets/:id

### POST /tickets (admin, technician)
```json
Body: { "title", "description", "category", "location", "priority?", "assigneeId?" }
```

### PUT /tickets/:id (admin, technician)
```json
Body: campos opcionales a actualizar (title, description, status, priority, assigneeId, etc.)
```

### DELETE /tickets/:id (solo admin)

### POST /tickets/:id/comments (admin, technician)
```json
Body: { "content": "texto del comentario" }
```

---

## Users (solo admin)

### GET /users
### GET /users/technicians (admin + technician)
### GET /users/:id
### POST /users
```json
Body: { "email", "password", "name", "role?" }
```
### PUT /users/:id
```json
Body: campos opcionales (name, role, active)
```

---

## Security Logs (admin, technician)

### GET /logs
Query params: `severity`, `eventType`, `userId`, `ip`, `from`, `to`, `limit`

### GET /logs/stats
```json
Response: {
  "total", "critical", "loginFailed", "accessDenied", "last24h",
  "suspiciousIps", "recent", "bySeverity", "byType", "byCountry"
}
```

---

## Audit

### POST /audit (autenticado)
```json
Body: { "url": "https://ejemplo.com" }
Response: {
  "url", "timestamp", "score", "httpsEnabled", "statusCode",
  "server", "headerChecks", "passed", "risks", "recommendations"
}
```

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| 400 | Validación fallida |
| 401 | No autenticado / token inválido |
| 403 | Sin permisos (rol insuficiente) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (email duplicado) |
| 429 | Rate limit superado |
| 500 | Error interno del servidor |

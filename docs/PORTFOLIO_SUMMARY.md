# Portfolio Summary — SecureFM SOC

## Descripción para CV / LinkedIn

**SecureFM SOC** es una plataforma fullstack de gestión de operaciones de seguridad desarrollada con React, TypeScript, Node.js y SQLite. El proyecto integra tres módulos: un sistema CAFM/CMMS de gestión de incidencias técnicas con control de roles, un dashboard SOC para monitorización de eventos de seguridad en tiempo real, y un auditor web pasivo que analiza cabeceras HTTP y genera informes de riesgo con puntuación. Implementa autenticación JWT, hashing bcrypt, control de acceso por roles, rate limiting, Helmet, validación de datos con express-validator, registro de eventos de seguridad y documentación de riesgos OWASP. Diseñado con estética de dashboard técnico profesional orientado a ciberseguridad.

---

## Qué demuestra este proyecto

### Desarrollo Fullstack
- Arquitectura cliente-servidor desacoplada (React + REST API).
- TypeScript en frontend y backend para tipado estricto.
- ORM Prisma con SQLite para gestión de base de datos relacional.
- Organización de código en capas: rutas → controladores → servicios.

### Ciberseguridad Aplicada
- Implementación real de JWT con expiración y middleware de autenticación.
- Hashing de contraseñas con bcrypt (factor de coste 12).
- Control de acceso por roles (RBAC) con admin/technician/viewer.
- Rate limiting para prevenir brute force en endpoints de autenticación.
- Cabeceras de seguridad con Helmet (CSP, X-Frame-Options, HSTS...).
- CORS configurado de forma restrictiva.
- Registro de eventos de seguridad (Security Logs) con severidad e IPs.
- Análisis pasivo de seguridad web (cabeceras HTTP, HTTPS, servidor expuesto).
- Documentación de riesgos OWASP Top 10 y mitigaciones aplicadas.

### Experiencia en Facility Management
- Integración de gestión de incidencias técnicas estilo CAFM/CMMS.
- Categorías reales del sector: Electricidad, Climatización, Seguridad, IT, Prevención...
- Flujo completo de tickets: creación → asignación → progreso → resolución.
- Historial de acciones y comentarios por ticket.

### Diseño Profesional
- Dashboard oscuro estilo SOC/SIEM con Tailwind CSS.
- Visualizaciones de datos con Recharts (gráficas de barras, pie charts).
- Diseño responsive con componentes reutilizables.
- UX pensada para operadores técnicos.

---

## Stack Técnico Resumido

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · Axios · Recharts · date-fns

**Backend:** Node.js · Express · TypeScript · Prisma · SQLite · JWT · bcrypt · Helmet · express-rate-limit · express-validator

**Seguridad:** JWT Auth · RBAC · bcrypt · Rate Limiting · Helmet · CORS restrictivo · Security Logging · WebSec Auditor

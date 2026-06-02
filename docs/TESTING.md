# Testing — SecureFM SOC

Guía completa de la suite de tests del backend.

---

## Stack de testing

| Herramienta | Rol |
|-------------|-----|
| [Jest](https://jestjs.io/) | Test runner + assertions |
| [Supertest](https://github.com/ladjs/supertest) | Tests HTTP de la API Express |
| [ts-jest](https://kulshekhar.github.io/ts-jest/) | Integración TypeScript con Jest |
| Mock de Prisma | Aislamiento de la base de datos |

---

## Estrategia de mocking

Los tests del backend usan **Prisma mockeado** — no requieren una base de datos real corriendo.

**Por qué esta estrategia:**
- Los tests son rápidos (milisegundos, no segundos)
- Pueden ejecutarse en CI sin PostgreSQL
- Permiten simular casos de error que serían difíciles de reproducir con datos reales
- No contaminan la base de datos de desarrollo

**Dónde está el mock:** `backend/src/lib/__mocks__/prisma.ts`

Cuando un test llama a `jest.mock('../src/lib/prisma')`, Jest reemplaza automáticamente el módulo real con este mock. Todos los métodos de Prisma son `jest.fn()` configurables por test.

**Trade-off documentado:** Los tests con Prisma mockeado no verifican queries SQL reales ni compatibilidad con PostgreSQL. Para eso se necesitarían tests de integración con base de datos real (ver sección de roadmap al final).

---

## Ejecutar los tests

```bash
cd backend

# Ejecutar todos los tests
npm run test

# Ejecutar en modo watch (re-ejecuta al guardar)
npm run test:watch

# Ejecutar con informe de cobertura
npm run test:coverage

# Ejecutar un archivo específico
npx jest tests/auth.test.ts

# Ejecutar tests que coincidan con un patrón
npx jest --testNamePattern="login"
```

---

## Estructura de tests

```
backend/
├── tests/
│   ├── setup.ts          # Variables de entorno para tests (JWT_SECRET, NODE_ENV)
│   ├── health.test.ts    # Endpoint /api/health
│   ├── auth.test.ts      # Login, /me, validación de inputs
│   ├── rbac.test.ts      # Control de acceso por roles
│   └── tickets.test.ts   # CRUD de tickets con permisos
│
└── src/lib/
    └── __mocks__/
        └── prisma.ts     # Mock automático de PrismaClient
```

---

## Cobertura de tests

### health.test.ts
| Test | Qué verifica |
|------|-------------|
| GET /api/health → 200 | El endpoint existe y responde correctamente |
| Content-Type JSON | La respuesta es JSON |
| Ruta inexistente → 404 | El error handler funciona |

### auth.test.ts
| Test | Qué verifica |
|------|-------------|
| Login con credenciales correctas | Devuelve token JWT y datos del usuario |
| Login con contraseña incorrecta | Responde 401, mensaje genérico |
| Login con usuario inexistente | Responde 401, no revela si el email existe |
| Login con usuario desactivado | Responde 401 aunque la contraseña sea correcta |
| Login con email inválido | Validación de formato, responde 400 |
| Login sin campos | Validación de campos obligatorios, 400 |
| GET /me con token válido | Devuelve perfil sin contraseña |
| GET /me sin token | Responde 401 |
| GET /me con token malformado | Responde 401 |

### rbac.test.ts
| Test | Qué verifica |
|------|-------------|
| Rutas protegidas sin token | Todas responden 401 |
| GET /users como admin | 200 — acceso permitido |
| GET /users como technician | 403 — acceso denegado |
| GET /users como viewer | 403 — acceso denegado |
| POST /tickets como technician | 201 — puede crear |
| POST /tickets como viewer | 403 — no puede crear |
| DELETE /tickets como technician | 403 — no puede eliminar |
| DELETE /tickets como admin | 200 — puede eliminar |
| GET /logs como viewer | 403 — sin acceso al SOC |
| GET /logs como technician | 200 — acceso al SOC |

### tickets.test.ts
| Test | Qué verifica |
|------|-------------|
| GET /tickets | Lista de tickets devuelta correctamente |
| GET /tickets con filtros | Acepta query params sin error |
| GET /tickets/:id | Devuelve ticket específico |
| GET /tickets/:id inexistente | Responde 404 |
| POST /tickets | Crea ticket, llama a Prisma una vez |
| POST /tickets sin campos | Validación de inputs, 400 |
| GET /tickets/stats | Devuelve objeto con contadores |

---

## Añadir nuevos tests

### 1. Crear el archivo de test

```typescript
// tests/mi-modulo.test.ts
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

jest.mock('../src/lib/prisma');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.securityLog.create.mockResolvedValue({} as any);
});

describe('Mi módulo', () => {
  it('hace lo que esperamos', async () => {
    // Configurar el mock para este test
    mockPrisma.user.findMany.mockResolvedValue([/* datos de prueba */] as any);

    const res = await request(app)
      .get('/api/mi-ruta')
      .set('Authorization', `Bearer ${tuToken}`);

    expect(res.status).toBe(200);
  });
});
```

### 2. Generar un token JWT para tests

```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: 'test-id', email: 'test@example.com', role: 'admin' },
  process.env.JWT_SECRET as string,
  { expiresIn: '1h' }
);
```

### 3. Notas al mocear Prisma

```typescript
// Mock que devuelve un valor resuelto
mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: '...' } as any);

// Mock que devuelve null (recurso no encontrado)
mockPrisma.user.findUnique.mockResolvedValue(null);

// Mock que simula un error de base de datos
mockPrisma.user.findUnique.mockRejectedValue(new Error('Connection timeout'));

// Verificar que se llamó una vez con argumentos específicos
expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
expect(mockPrisma.user.create).toHaveBeenCalledWith(
  expect.objectContaining({ email: 'nuevo@example.com' })
);
```

---

## Informe de cobertura

Tras ejecutar `npm run test:coverage`, se genera en:
- **Terminal:** tabla con porcentajes por archivo
- **HTML:** `backend/coverage/index.html` (abrir en navegador)
- **LCOV:** `backend/coverage/lcov.info` (para CI/codecov)

---

## Roadmap de tests

### Implementado
- [x] Tests unitarios con Prisma mockeado
- [x] Tests de autenticación (login, JWT, /me)
- [x] Tests de RBAC (roles y permisos por endpoint)
- [x] Tests de tickets (CRUD y validación)
- [x] Tests del health endpoint

### Pendiente (mejoras futuras)
- [ ] Tests de integración con PostgreSQL real (requiere base de datos de test)
- [ ] Tests del WebSec Auditor (mocking de `fetch`)
- [ ] Tests del endpoint de logs SOC
- [ ] Tests de rate limiting
- [ ] Tests del perfil de usuario (cambio nombre/contraseña)
- [ ] Tests E2E con Playwright o Cypress (frontend)
- [ ] Cobertura mínima del 70% en CI

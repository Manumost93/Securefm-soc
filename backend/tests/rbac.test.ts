/**
 * Tests de RBAC (Role-Based Access Control)
 * Verifica que los endpoints protegidos rechacen accesos no autorizados
 * y permitan los correctos según el rol del token JWT.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/lib/prisma';

jest.mock('../src/lib/prisma');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const JWT_SECRET = process.env.JWT_SECRET as string;

// Genera un token JWT válido con el rol especificado
function makeToken(role: 'admin' | 'technician' | 'viewer', userId = 'user-rbac-test') {
  return jwt.sign(
    { userId, email: `${role}@securefm.local`, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.securityLog.create.mockResolvedValue({} as any);
});

// ── Sin token ─────────────────────────────────────────────

describe('Acceso sin token', () => {
  const protectedRoutes = [
    { method: 'get', path: '/api/tickets' },
    { method: 'get', path: '/api/logs' },
    { method: 'get', path: '/api/users' },
  ];

  protectedRoutes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} → 401`, async () => {
      const res = await (request(app) as any)[method](path);
      expect(res.status).toBe(401);
    });
  });
});

// ── Rutas solo para admin ─────────────────────────────────

describe('GET /api/users — solo admin', () => {
  beforeEach(() => {
    mockPrisma.user.findMany.mockResolvedValue([]);
  });

  it('admin puede listar usuarios → 200', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeToken('admin')}`);
    expect(res.status).toBe(200);
  });

  it('technician no puede listar usuarios → 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeToken('technician')}`);
    expect(res.status).toBe(403);
  });

  it('viewer no puede listar usuarios → 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeToken('viewer')}`);
    expect(res.status).toBe(403);
  });
});

// ── Rutas que requieren technician o superior ─────────────

describe('POST /api/tickets — technician+', () => {
  const ticketPayload = {
    title: 'Test ticket RBAC',
    description: 'Descripción del ticket de prueba para RBAC',
    category: 'IT',
    location: 'Sala test',
    priority: 'medium',
  };

  it('technician puede crear tickets → 201', async () => {
    mockPrisma.ticket.create.mockResolvedValue({
      id: 'ticket-1',
      ...ticketPayload,
      status: 'open',
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      creatorId: 'user-rbac-test',
      assigneeId: null,
      creator: { id: 'user-rbac-test', name: 'Tech', email: 'technician@securefm.local' },
      assignee: null,
      comments: [],
    } as any);

    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${makeToken('technician')}`)
      .send(ticketPayload);

    expect(res.status).toBe(201);
  });

  it('viewer no puede crear tickets → 403', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${makeToken('viewer')}`)
      .send(ticketPayload);

    expect(res.status).toBe(403);
  });
});

// ── DELETE solo admin ─────────────────────────────────────

describe('DELETE /api/tickets/:id — solo admin', () => {
  it('technician no puede eliminar tickets → 403', async () => {
    const res = await request(app)
      .delete('/api/tickets/some-ticket-id')
      .set('Authorization', `Bearer ${makeToken('technician')}`);

    expect(res.status).toBe(403);
  });

  it('admin puede eliminar tickets (si existe)', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: 'ticket-del',
      title: 'A borrar',
    } as any);
    mockPrisma.ticket.delete.mockResolvedValue({} as any);

    const res = await request(app)
      .delete('/api/tickets/ticket-del')
      .set('Authorization', `Bearer ${makeToken('admin')}`);

    expect(res.status).toBe(200);
  });
});

// ── Logs SOC — technician+ ────────────────────────────────

describe('GET /api/logs — technician+', () => {
  it('viewer no puede ver logs SOC → 403', async () => {
    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${makeToken('viewer')}`);

    expect(res.status).toBe(403);
  });

  it('technician puede ver logs SOC → 200', async () => {
    mockPrisma.securityLog.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${makeToken('technician')}`);

    expect(res.status).toBe(200);
  });
});

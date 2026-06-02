import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/lib/prisma';

jest.mock('../src/lib/prisma');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const JWT_SECRET = process.env.JWT_SECRET as string;

const adminToken = jwt.sign(
  { userId: 'admin-id', email: 'admin@securefm.local', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);
const techToken = jwt.sign(
  { userId: 'tech-id', email: 'tech@securefm.local', role: 'technician' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const mockTicket = {
  id: 'ticket-001',
  title: 'Avería cuadro eléctrico',
  description: 'El diferencial salta de forma intermitente',
  category: 'Electricidad',
  location: 'Planta baja',
  priority: 'high',
  status: 'open',
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  creatorId: 'admin-id',
  assigneeId: null,
  creator: { id: 'admin-id', name: 'Admin', email: 'admin@securefm.local' },
  assignee: null,
  comments: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.securityLog.create.mockResolvedValue({} as any);
});

// ── GET /api/tickets ──────────────────────────────────────

describe('GET /api/tickets', () => {
  it('devuelve lista de tickets para usuario autenticado', async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([mockTicket] as any);

    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe('ticket-001');
  });

  it('acepta filtros de query sin errores', async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/tickets?status=open&priority=high&category=Electricidad')
      .set('Authorization', `Bearer ${techToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/tickets/:id ──────────────────────────────────

describe('GET /api/tickets/:id', () => {
  it('devuelve un ticket específico', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as any);

    const res = await request(app)
      .get('/api/tickets/ticket-001')
      .set('Authorization', `Bearer ${techToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('ticket-001');
    expect(res.body.title).toBe('Avería cuadro eléctrico');
  });

  it('responde 404 si el ticket no existe', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tickets/id-inexistente')
      .set('Authorization', `Bearer ${techToken}`);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/tickets ─────────────────────────────────────

describe('POST /api/tickets', () => {
  const payload = {
    title: 'Grieta en la pared',
    description: 'Se ha detectado una grieta horizontal de 30cm en la sala técnica',
    category: 'Mantenimiento general',
    location: 'Sala técnica planta 1',
    priority: 'high',
  };

  it('crea un ticket correctamente', async () => {
    mockPrisma.ticket.create.mockResolvedValue({ ...mockTicket, ...payload } as any);

    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${techToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(payload.title);
    expect(mockPrisma.ticket.create).toHaveBeenCalledTimes(1);
  });

  it('falla si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${techToken}`)
      .send({ title: 'Sin descripción ni categoría' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

// ── GET /api/tickets/stats ────────────────────────────────

describe('GET /api/tickets/stats', () => {
  it('devuelve estadísticas de tickets', async () => {
    mockPrisma.ticket.count
      .mockResolvedValueOnce(15)  // total
      .mockResolvedValueOnce(7)   // open
      .mockResolvedValueOnce(3)   // in_progress
      .mockResolvedValueOnce(4)   // resolved
      .mockResolvedValueOnce(2);  // critical

    const res = await request(app)
      .get('/api/tickets/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total', 15);
    expect(res.body).toHaveProperty('open', 7);
    expect(res.body).toHaveProperty('critical', 2);
  });
});

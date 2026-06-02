import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import prisma from '../src/lib/prisma';

jest.mock('../src/lib/prisma');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Usuario demo reutilizado en varios tests
const mockUser = {
  id: 'user-test-id-1',
  email: 'admin@securefm.local',
  password: '',
  name: 'Admin Test',
  role: 'admin',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeAll(async () => {
  mockUser.password = await bcrypt.hash('Admin123!', 12);
});

beforeEach(() => {
  jest.clearAllMocks();
  // securityLog.create siempre se llama en login — lo mockeamos para que no falle
  mockPrisma.securityLog.create.mockResolvedValue({} as any);
});

// ── Login exitoso ─────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('devuelve token y datos del usuario con credenciales correctas', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@securefm.local', password: 'Admin123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('admin@securefm.local');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('responde 401 con contraseña incorrecta', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@securefm.local', password: 'ContraseñaWrong!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
    expect(res.body).not.toHaveProperty('token');
  });

  it('responde 401 cuando el usuario no existe', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@securefm.local', password: 'Admin123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });

  it('responde 401 cuando el usuario está desactivado', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@securefm.local', password: 'Admin123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });

  it('responde 400 si el email tiene formato inválido', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-un-email', password: 'Admin123!' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('responde 400 si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@securefm.local' }); // sin password

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

// ── GET /api/auth/me ──────────────────────────────────────

describe('GET /api/auth/me', () => {
  let validToken: string;

  beforeAll(async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.securityLog.create.mockResolvedValue({} as any);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@securefm.local', password: 'Admin123!' });

    validToken = loginRes.body.token;
  });

  it('devuelve datos del usuario con token válido', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      active: mockUser.active,
      createdAt: mockUser.createdAt,
    } as any);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@securefm.local');
    expect(res.body).not.toHaveProperty('password');
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('responde 401 con token malformado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-invalido-que-no-es-jwt');

    expect(res.status).toBe(401);
  });
});

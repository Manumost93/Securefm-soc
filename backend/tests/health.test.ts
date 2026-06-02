import request from 'supertest';
import app from '../src/app';

describe('GET /api/health', () => {
  it('responde 200 con status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('version');
  });

  it('responde con Content-Type JSON', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('ruta inexistente responde 404', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.status).toBe(404);
  });
});

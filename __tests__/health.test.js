const request = require('supertest');
const app = require('../src/app');

describe('Health routes', () => {
  it('GET /health returns 200 and ok: true', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /health/db returns 200 when database is connected', async () => {
    const res = await request(app).get('/health/db');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.database).toBe('connected');
  });
});

const request = require('supertest');
const app = require('../src/app');

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Auth routes', () => {
  it('POST /api/auth/signup rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/signup').send({ username: 'u' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/auth/signup rejects weak password', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: unique(),
      email: `${unique()}@test.com`,
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/auth/signup creates user and returns 201', async () => {
    const u = unique();
    const res = await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}@test.com`,
      password: 'password1',
      name: 'Test User',
    });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe(u);
    expect(res.body.email).toBe(`${u}@test.com`);
    expect(res.body.password_hash).toBeUndefined();
  });

  it('POST /api/auth/signup returns 409 for duplicate username', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}@test.com`,
      password: 'password1',
    });
    const res = await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}-2@test.com`,
      password: 'password1',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/username/i);
  });

  it('POST /api/auth/signup returns 409 for duplicate email', async () => {
    const u = unique();
    const email = `${u}@test.com`;
    await request(app).post('/api/auth/signup').send({
      username: u,
      email,
      password: 'password1',
    });
    const res = await request(app).post('/api/auth/signup').send({
      username: `${u}-2`,
      email,
      password: 'password1',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  it('POST /api/auth/login accepts email as login', async () => {
    const u = unique();
    const email = `${u}@test.com`;
    await request(app).post('/api/auth/signup').send({
      username: u,
      email,
      password: 'password1',
    });
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ email, password: 'password1' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(u);
  });

  it('POST /api/auth/login rejects missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'x' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}@test.com`,
      password: 'password1',
    });
    const res = await request(app).post('/api/auth/login').send({
      username: u,
      password: 'wrong',
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login sets session and returns user', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}@test.com`,
      password: 'password1',
    });
    const agent = request.agent(app);
    const loginRes = await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.username).toBe(u);
    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.username).toBe(u);
  });

  it('POST /api/auth/logout requires auth and returns 204', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}@test.com`,
      password: 'password1',
    });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(204);
    const after = await agent.get('/api/auth/me');
    expect(after.status).toBe(401);
  });

  it('GET /api/auth/me returns 401 when not logged in', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

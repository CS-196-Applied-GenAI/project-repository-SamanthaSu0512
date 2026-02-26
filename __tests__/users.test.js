const request = require('supertest');
const app = require('../src/app');

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function signupAndLogin(agent, overrides = {}) {
  const u = unique();
  const data = { username: u, email: `${u}@test.com`, password: 'password1', ...overrides };
  return request(app)
    .post('/api/auth/signup')
    .send(data)
    .then(() => agent.post('/api/auth/login').send({ username: data.username, password: data.password }));
}

describe('Users routes', () => {
  it('GET /api/users/me returns 401 when not logged in', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/users/me returns current user when logged in', async () => {
    const agent = request.agent(app);
    const u = unique();
    await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}@test.com`,
      password: 'password1',
    });
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.get('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(u);
  });

  it('PATCH /api/users/me updates bio', async () => {
    const agent = request.agent(app);
    const u = unique();
    await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}@test.com`,
      password: 'password1',
    });
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.patch('/api/users/me').send({ bio: 'Hello world' });
    expect(res.status).toBe(200);
    expect(res.body.bio).toBe('Hello world');
  });

  it('POST /api/users/:id/follow returns 400 when following self', async () => {
    const agent = request.agent(app);
    const u = unique();
    await request(app).post('/api/auth/signup').send({
      username: u,
      email: `${u}@test.com`,
      password: 'password1',
    });
    const loginRes = await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const myId = loginRes.body.id;
    const res = await agent.post(`/api/users/${myId}/follow`);
    expect(res.status).toBe(400);
  });

  it('POST /api/users/:id/follow and DELETE /api/users/:id/follow work', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    const signup2 = await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const id2 = signup2.body.id;
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const followRes = await agent.post(`/api/users/${id2}/follow`);
    expect(followRes.status).toBe(204);
    const unfollowRes = await agent.delete(`/api/users/${id2}/follow`);
    expect(unfollowRes.status).toBe(204);
  });

  it('POST /api/users/:id/follow returns 404 for invalid id', async () => {
    const agent = request.agent(app);
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.post('/api/users/999999/follow');
    expect(res.status).toBe(404);
  });

  it('PATCH /api/users/me returns 409 when username already taken', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const res = await agent.patch('/api/users/me').send({ username: u2 });
    expect(res.status).toBe(409);
  });

  it('POST /api/users/:id/follow returns 404 for non-integer id', async () => {
    const agent = request.agent(app);
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.post('/api/users/abc/follow');
    expect(res.status).toBe(404);
  });

  it('POST /api/users/:id/block and DELETE /api/users/:id/block work', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    const signup2 = await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const id2 = signup2.body.id;
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const blockRes = await agent.post(`/api/users/${id2}/block`);
    expect(blockRes.status).toBe(204);
    const unblockRes = await agent.delete(`/api/users/${id2}/block`);
    expect(unblockRes.status).toBe(204);
  });

  it('POST /api/users/:id/block returns 400 when blocking self', async () => {
    const agent = request.agent(app);
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const loginRes = await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const myId = loginRes.body.id;
    const res = await agent.post(`/api/users/${myId}/block`);
    expect(res.status).toBe(400);
  });

  it('PATCH /api/users/me/avatar returns 400 when no file uploaded', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.patch('/api/users/me/avatar');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/file|profilePicture/i);
  });

  it('PATCH /api/users/me/avatar returns 400 for non-image file', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent
      .patch('/api/users/me/avatar')
      .attach('profilePicture', Buffer.from('not an image'), { filename: 'file.txt' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('PATCH /api/users/me/avatar accepts valid image and returns 200', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const res = await agent
      .patch('/api/users/me/avatar')
      .attach('profilePicture', minimalPng, 'avatar.png');
    expect(res.status).toBe(200);
    expect(res.body.profile_picture).toBeDefined();
    expect(res.body.profile_picture).toMatch(/^\/uploads\//);
  });
});

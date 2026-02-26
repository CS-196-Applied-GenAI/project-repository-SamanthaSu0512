const request = require('supertest');
const app = require('../src/app');

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Feed route', () => {
  it('GET /api/feed returns 401 when not logged in', async () => {
    const res = await request(app).get('/api/feed');
    expect(res.status).toBe(401);
  });

  it('GET /api/feed returns 200 and array', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.get('/api/feed');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/feed with limit and offset', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.get('/api/feed?limit=5&offset=0');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/feed includes own tweet after creating one', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    await agent.post('/api/tweets').send({ text: 'Feed test tweet' });
    const res = await agent.get('/api/feed');
    expect(res.status).toBe(200);
    const found = res.body.find((t) => t.text === 'Feed test tweet');
    expect(found).toBeDefined();
    expect(found.author.username).toBe(u);
  });

  it('GET /api/feed with before cursor', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const create = await agent.post('/api/tweets').send({ text: 'First' });
    const res = await agent.get(`/api/feed?before=${create.body.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/feed includes retweet with originalTweet', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const agent1 = request.agent(app);
    await agent1.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const orig = await agent1.post('/api/tweets').send({ text: 'Original tweet' });
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/login').send({ username: u2, password: 'password1' });
    await agent2.post(`/api/tweets/${orig.body.id}/retweet`);
    const res = await agent2.get('/api/feed');
    expect(res.status).toBe(200);
    const retweetItem = res.body.find((t) => t.retweeted_from === orig.body.id);
    expect(retweetItem).toBeDefined();
    expect(retweetItem.originalTweet).toBeDefined();
    expect(retweetItem.originalTweet.text).toBe('Original tweet');
  });
});

const request = require('supertest');
const app = require('../src/app');

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Tweets routes', () => {
  it('POST /api/tweets returns 401 when not logged in', async () => {
    const res = await request(app).post('/api/tweets').send({ text: 'Hi' });
    expect(res.status).toBe(401);
  });

  it('POST /api/tweets creates tweet and returns 201', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.post('/api/tweets').send({ text: 'Hello world' });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Hello world');
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/tweets rejects text over 240 chars', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const long = 'x'.repeat(241);
    const res = await agent.post('/api/tweets').send({ text: long });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/tweets/:id returns 204 for own tweet', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const create = await agent.post('/api/tweets').send({ text: 'To delete' });
    const tweetId = create.body.id;
    const res = await agent.delete(`/api/tweets/${tweetId}`);
    expect(res.status).toBe(204);
  });

  it('DELETE /api/tweets/:id returns 404 for invalid id', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.delete('/api/tweets/999999');
    expect(res.status).toBe(404);
  });

  it('DELETE /api/tweets/:id returns 403 when deleting another user tweet', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const agent1 = request.agent(app);
    await agent1.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const create = await agent1.post('/api/tweets').send({ text: 'User1 tweet' });
    const tweetId = create.body.id;
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/login').send({ username: u2, password: 'password1' });
    const res = await agent2.delete(`/api/tweets/${tweetId}`);
    expect(res.status).toBe(403);
  });

  it('POST /api/tweets/:id/like returns 404 for invalid id', async () => {
    const u = unique();
    await request(app).post('/api/auth/signup').send({ username: u, email: `${u}@test.com`, password: 'password1' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: u, password: 'password1' });
    const res = await agent.post('/api/tweets/0/like');
    expect(res.status).toBe(404);
  });

  it('POST /api/tweets/:id/like and DELETE /api/tweets/:id/like work', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const agent1 = request.agent(app);
    await agent1.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const create = await agent1.post('/api/tweets').send({ text: 'Tweet' });
    const tweetId = create.body.id;
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/login').send({ username: u2, password: 'password1' });
    const likeRes = await agent2.post(`/api/tweets/${tweetId}/like`);
    expect(likeRes.status).toBe(204);
    const unlikeRes = await agent2.delete(`/api/tweets/${tweetId}/like`);
    expect(unlikeRes.status).toBe(204);
  });

  it('POST /api/tweets/:id/retweet creates retweet', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const agent1 = request.agent(app);
    await agent1.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const create = await agent1.post('/api/tweets').send({ text: 'Original' });
    const originalId = create.body.id;
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/login').send({ username: u2, password: 'password1' });
    const retweetRes = await agent2.post(`/api/tweets/${originalId}/retweet`);
    expect(retweetRes.status).toBe(201);
    expect(retweetRes.body.retweeted_from).toBe(originalId);
  });

  it('POST /api/tweets/:id/retweet returns 409 when already retweeted', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const agent1 = request.agent(app);
    await agent1.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const create = await agent1.post('/api/tweets').send({ text: 'Original' });
    const originalId = create.body.id;
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/login').send({ username: u2, password: 'password1' });
    await agent2.post(`/api/tweets/${originalId}/retweet`);
    const second = await agent2.post(`/api/tweets/${originalId}/retweet`);
    expect(second.status).toBe(409);
  });

  it('DELETE /api/tweets/:id/retweet returns 204', async () => {
    const u1 = unique();
    const u2 = unique();
    await request(app).post('/api/auth/signup').send({ username: u1, email: `${u1}@test.com`, password: 'password1' });
    await request(app).post('/api/auth/signup').send({ username: u2, email: `${u2}@test.com`, password: 'password1' });
    const agent1 = request.agent(app);
    await agent1.post('/api/auth/login').send({ username: u1, password: 'password1' });
    const create = await agent1.post('/api/tweets').send({ text: 'Original' });
    const originalId = create.body.id;
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/login').send({ username: u2, password: 'password1' });
    await agent2.post(`/api/tweets/${originalId}/retweet`);
    const res = await agent2.delete(`/api/tweets/${originalId}/retweet`);
    expect(res.status).toBe(204);
  });
});

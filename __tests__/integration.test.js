/**
 * Integration tests: multi-step user journeys through the API.
 * These ensure auth, users, tweets, feed, follow, block, and replies work together.
 */
const request = require('supertest');
const app = require('../src/app');

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function createUser(overrides = {}) {
  const u = unique();
  return {
    username: u,
    email: `${u}@test.com`,
    password: 'password1',
    ...overrides,
  };
}

async function signupAndLogin(agent, user) {
  await request(app).post('/api/auth/signup').send(user);
  const loginRes = await agent.post('/api/auth/login').send({
    username: user.username,
    password: user.password,
  });
  return loginRes.body;
}

describe('Integration: full user journey', () => {
  it('signup -> login -> get me -> post tweet -> feed shows tweet -> delete tweet -> feed excludes it', async () => {
    const user = createUser();
    const agent = request.agent(app);

    await request(app).post('/api/auth/signup').send(user);
    const loginBody = await signupAndLogin(agent, user);
    expect(loginBody.username).toBe(user.username);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.id).toBeDefined();

    const postRes = await agent.post('/api/tweets').send({ text: 'Integration test tweet' });
    expect(postRes.status).toBe(201);
    const tweetId = postRes.body.id;

    const feedRes = await agent.get('/api/feed');
    expect(feedRes.status).toBe(200);
    const inFeed = feedRes.body.find((t) => t.id === tweetId);
    expect(inFeed).toBeDefined();
    expect(inFeed.text).toBe('Integration test tweet');

    const deleteRes = await agent.delete(`/api/tweets/${tweetId}`);
    expect(deleteRes.status).toBe(204);

    const feedAfter = await agent.get('/api/feed');
    const stillInFeed = feedAfter.body.find((t) => t.id === tweetId);
    expect(stillInFeed).toBeUndefined();
  });

  it('update profile (PATCH /users/me) then GET /users/me and /users/me/tweets reflect it', async () => {
    const user = createUser({ name: 'Original' });
    const agent = request.agent(app);
    await signupAndLogin(agent, user);

    const patchRes = await agent.patch('/api/users/me').send({ bio: 'My new bio' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.bio).toBe('My new bio');

    const meRes = await agent.get('/api/users/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.bio).toBe('My new bio');

    const tweetsRes = await agent.get('/api/users/me/tweets?limit=5');
    expect(tweetsRes.status).toBe(200);
    expect(Array.isArray(tweetsRes.body)).toBe(true);
  });

  it('user A gets profile of user B by username; is_following false; A follows B; is_following true', async () => {
    const userA = createUser();
    const userB = createUser();
    await request(app).post('/api/auth/signup').send(userA);
    await request(app).post('/api/auth/signup').send(userB);

    const agentA = request.agent(app);
    await agentA.post('/api/auth/login').send({ username: userA.username, password: userA.password });

    const profileRes = await agentA.get(`/api/users/${encodeURIComponent(userB.username)}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.username).toBe(userB.username);
    expect(profileRes.body.is_following).toBe(false);

    const followRes = await agentA.post(`/api/users/${profileRes.body.id}/follow`);
    expect(followRes.status).toBe(204);

    const profileAfter = await agentA.get(`/api/users/${encodeURIComponent(userB.username)}`);
    expect(profileAfter.body.is_following).toBe(true);
  });

  it('user B blocks user A; B’s feed does not include A’s tweets', async () => {
    const userA = createUser();
    const userB = createUser();
    const signupA = await request(app).post('/api/auth/signup').send(userA);
    await request(app).post('/api/auth/signup').send(userB);

    const agentA = request.agent(app);
    const agentB = request.agent(app);
    await agentA.post('/api/auth/login').send({ username: userA.username, password: userA.password });
    await agentB.post('/api/auth/login').send({ username: userB.username, password: userB.password });

    const tweetRes = await agentA.post('/api/tweets').send({ text: 'Tweet from A' });
    expect(tweetRes.status).toBe(201);

    const feedBBefore = await agentB.get('/api/feed');
    const seenByB = feedBBefore.body.find((t) => t.text === 'Tweet from A');
    expect(seenByB).toBeDefined();

    await agentB.post(`/api/users/${signupA.body.id}/block`);
    const feedBAfter = await agentB.get('/api/feed');
    const stillSeen = feedBAfter.body.find((t) => t.text === 'Tweet from A');
    expect(stillSeen).toBeUndefined();
  });

  it('post reply (parent_tweet_id); GET /tweets/:id/replies returns the reply', async () => {
    const userA = createUser();
    const userB = createUser();
    await request(app).post('/api/auth/signup').send(userA);
    await request(app).post('/api/auth/signup').send(userB);

    const agentA = request.agent(app);
    const agentB = request.agent(app);
    await agentA.post('/api/auth/login').send({ username: userA.username, password: userA.password });
    await agentB.post('/api/auth/login').send({ username: userB.username, password: userB.password });

    const parentRes = await agentA.post('/api/tweets').send({ text: 'Original post' });
    expect(parentRes.status).toBe(201);
    const parentId = parentRes.body.id;

    const replyRes = await agentB.post('/api/tweets').send({
      text: 'A reply',
      parent_tweet_id: parentId,
    });
    expect(replyRes.status).toBe(201);
    expect(replyRes.body.parent_tweet_id).toBe(parentId);

    const repliesRes = await agentB.get(`/api/tweets/${parentId}/replies`);
    expect(repliesRes.status).toBe(200);
    const replies = repliesRes.body;
    expect(Array.isArray(replies)).toBe(true);
    const replyRow = replies.find((r) => r.text === 'A reply');
    expect(replyRow).toBeDefined();
  });

  it('GET /api/users/me/blocks returns blocked users; unblock removes them', async () => {
    const userA = createUser();
    const userB = createUser();
    await request(app).post('/api/auth/signup').send(userA);
    const signupB = await request(app).post('/api/auth/signup').send(userB);

    const agentA = request.agent(app);
    await agentA.post('/api/auth/login').send({ username: userA.username, password: userA.password });

    const blocksBefore = await agentA.get('/api/users/me/blocks');
    expect(blocksBefore.status).toBe(200);
    expect(blocksBefore.body).toHaveLength(0);

    await agentA.post(`/api/users/${signupB.body.id}/block`);
    const blocksAfter = await agentA.get('/api/users/me/blocks');
    expect(blocksAfter.body.length).toBe(1);
    expect(blocksAfter.body[0].username).toBe(userB.username);

    await agentA.delete(`/api/users/${signupB.body.id}/block`);
    const blocksFinal = await agentA.get('/api/users/me/blocks');
    expect(blocksFinal.body).toHaveLength(0);
  });

  it('logout invalidates session; subsequent /api/auth/me returns 401', async () => {
    const user = createUser();
    const agent = request.agent(app);
    await signupAndLogin(agent, user);

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(204);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });
});

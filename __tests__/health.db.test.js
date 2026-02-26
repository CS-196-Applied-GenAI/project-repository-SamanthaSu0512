jest.mock('../src/config/db', () => ({
  pool: { query: jest.fn() },
}));

const request = require('supertest');
const { pool } = require('../src/config/db');

// Load app after mock so app uses mocked pool
const app = require('../src/app');

describe('Health DB route when DB fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockRejectedValue(new Error('Connection refused'));
  });

  it('GET /health/db returns 503 when database errors', async () => {
    const res = await request(app).get('/health/db');
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.database).toBe('error');
    expect(res.body.message).toBeDefined();
  });
});

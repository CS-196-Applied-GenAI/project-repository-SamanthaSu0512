const { getBlockedSet, block, unblock } = require('../src/services/blocks');
const { getFollowedSet, getFeedRows, getLikedTweetIds, getRetweetedTweetIds } = require('../src/services/feed');

jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require('../src/config/db');

describe('blocks service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getBlockedSet returns set of blocker and blocked ids', async () => {
    pool.query.mockResolvedValue([[{ id: 2 }, { id: 3 }]]);
    const set = await getBlockedSet(1);
    expect(set).toEqual(new Set([2, 3]));
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('blocks'),
      [1, 1]
    );
  });
});

describe('feed service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getFollowedSet returns set of followee ids', async () => {
    pool.query.mockResolvedValue([[{ id: 2 }, { id: 3 }]]);
    const set = await getFollowedSet(1);
    expect(set).toEqual(new Set([2, 3]));
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('follows'),
      [1]
    );
  });

  it('getFeedRows returns rows from query', async () => {
    const rows = [{ id: 1, text: 'Hi', author_username: 'u' }];
    pool.query.mockResolvedValue([rows]);
    const result = await getFeedRows(1, { limit: 5, offset: 0 });
    expect(result).toEqual(rows);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('tweets'), [1, 1, 1, 5, 0]);
  });

  it('getLikedTweetIds returns empty set for empty tweetIds', async () => {
    const set = await getLikedTweetIds(1, []);
    expect(set).toEqual(new Set());
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('getRetweetedTweetIds returns empty set for empty tweetIds', async () => {
    const set = await getRetweetedTweetIds(1, []);
    expect(set).toEqual(new Set());
    expect(pool.query).not.toHaveBeenCalled();
  });
});

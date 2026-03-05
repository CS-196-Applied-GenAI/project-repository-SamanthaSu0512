const { pool } = require('../config/db');

/**
 * Set of user IDs that the viewer follows (followee_id where follower_id = viewer).
 */
async function getFollowedSet(viewerId) {
  const [rows] = await pool.query(
    'SELECT followee_id AS id FROM follows WHERE follower_id = ?',
    [viewerId]
  );
  return new Set(rows.map((r) => r.id));
}

const FEED_SELECT = `SELECT
       t.id AS id,
       t.user_id AS user_id,
       t.text AS text,
       t.created_at AS created_at,
       t.retweeted_from AS retweeted_from,
       u.id AS author_id,
       u.username AS author_username,
       u.name AS author_name,
       u.profile_picture AS author_profile_picture,
       orig.id AS original_id,
       orig.text AS original_text,
       orig.created_at AS original_created_at,
       ou.id AS original_author_id,
       ou.username AS original_author_username,
       ou.name AS original_author_name,
       ou.profile_picture AS original_author_profile_picture
     FROM tweets t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN tweets orig ON t.retweeted_from = orig.id
     LEFT JOIN users ou ON orig.user_id = ou.id`;
const FEED_WHERE_BLOCK = `t.user_id NOT IN (
       SELECT blocker_id FROM blocks WHERE blocked_id = ?
       UNION
       SELECT blocked_id FROM blocks WHERE blocker_id = ?
     )
     AND NOT EXISTS (
       SELECT 1 FROM blocks b WHERE b.blocker_id = t.user_id AND b.blocked_id = ?
     )`;

/**
 * Feed query: tweets (including retweets) where author not in blocked set.
 * Excludes replies when parent_tweet_id exists (run migrations/add_parent_tweet_id.sql).
 */
async function getFeedRows(viewerId, { limit = 10, offset = 0 } = {}) {
  const withRepliesFilter = `WHERE (t.parent_tweet_id IS NULL)
     AND ${FEED_WHERE_BLOCK}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`;
  try {
    const [rows] = await pool.query(
      `${FEED_SELECT} ${withRepliesFilter}`,
      [viewerId, viewerId, viewerId, limit, offset]
    );
    return rows;
  } catch (err) {
    if (err.errno === 1054 && /parent_tweet_id/.test(err.message)) {
      const [rows] = await pool.query(
        `${FEED_SELECT} WHERE ${FEED_WHERE_BLOCK}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
        [viewerId, viewerId, viewerId, limit, offset]
      );
      return rows;
    }
    throw err;
  }
}

/**
 * Blended feed: prefer tweets from followed users, then by created_at DESC.
 * Excludes replies when parent_tweet_id exists.
 */
async function getBlendedFeedRows(viewerId, { limit = 10, offset = 0, before = null } = {}) {
  const params = [viewerId, viewerId, viewerId];
  let whereCursor = '';
  if (before) {
    whereCursor = 'AND t.created_at < (SELECT created_at FROM tweets WHERE id = ?) ';
    params.push(before);
  }
  params.push(viewerId, limit, offset);
  const withRepliesFilter = `WHERE (t.parent_tweet_id IS NULL)
     AND ${FEED_WHERE_BLOCK}
     ${whereCursor}
     ORDER BY (t.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)) DESC, t.created_at DESC
     LIMIT ? OFFSET ?`;
  try {
    const [rows] = await pool.query(`${FEED_SELECT} ${withRepliesFilter}`, params);
    return rows;
  } catch (err) {
    if (err.errno === 1054 && /parent_tweet_id/.test(err.message)) {
      const [rows] = await pool.query(
        `${FEED_SELECT} WHERE ${FEED_WHERE_BLOCK}
     ${whereCursor}
     ORDER BY (t.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)) DESC, t.created_at DESC
     LIMIT ? OFFSET ?`,
        params
      );
      return rows;
    }
    throw err;
  }
}

/**
 * Get tweet IDs the viewer has liked. Returns Set of tweet_id.
 */
async function getLikedTweetIds(viewerId, tweetIds) {
  if (!tweetIds.length) return new Set();
  const placeholders = tweetIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT tweet_id FROM likes WHERE user_id = ? AND tweet_id IN (${placeholders})`,
    [viewerId, ...tweetIds]
  );
  return new Set(rows.map((r) => r.tweet_id));
}

/**
 * Get original tweet IDs that the viewer has retweeted. Returns Set of original tweet id (retweeted_from).
 */
async function getRetweetedTweetIds(viewerId, tweetIds) {
  if (!tweetIds.length) return new Set();
  const placeholders = tweetIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT retweeted_from AS id FROM tweets WHERE user_id = ? AND retweeted_from IN (${placeholders})`,
    [viewerId, ...tweetIds]
  );
  return new Set(rows.map((r) => r.id));
}

module.exports = {
  getFollowedSet,
  getFeedRows,
  getBlendedFeedRows,
  getLikedTweetIds,
  getRetweetedTweetIds,
};

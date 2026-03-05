const { pool } = require('../config/db');

const MAX_TEXT_LENGTH = 240;

/**
 * Create a tweet (or reply). Enforces text length <= 240. Returns created row.
 * For replies: pass parentTweetId; parent must exist and be a top-level tweet.
 * @param {number} userId
 * @param {string} text
 * @param {number|null} retweetedFrom
 * @param {number|null} parentTweetId
 * @returns {Promise<object>} created tweet row
 * @throws {Error} if text length > 240 or reply validation fails
 */
async function createTweet(userId, text, retweetedFrom = null, parentTweetId = null) {
  if (text != null && text.length > MAX_TEXT_LENGTH) {
    const err = new Error('Tweet text exceeds 240 characters');
    err.statusCode = 400;
    throw err;
  }
  if (parentTweetId != null) {
    const pid = Number(parentTweetId);
    if (!Number.isInteger(pid) || pid < 1) {
      const err = new Error('Invalid parent tweet id');
      err.statusCode = 400;
      throw err;
    }
    const parent = await getTweetById(pid);
    if (!parent) {
      const err = new Error('Parent tweet not found');
      err.statusCode = 404;
      throw err;
    }
    if (parent.parent_tweet_id != null) {
      const err = new Error('Cannot reply to a reply');
      err.statusCode = 400;
      throw err;
    }
  }
  const params = [userId, text || null, retweetedFrom, parentTweetId ?? null];
  let result;
  try {
    [result] = await pool.query(
      'INSERT INTO tweets (user_id, text, retweeted_from, parent_tweet_id) VALUES (?, ?, ?, ?)',
      params
    );
  } catch (err) {
    if (err.errno === 1054 && /parent_tweet_id/.test(err.message)) {
      if (parentTweetId == null) {
        const [r] = await pool.query(
          'INSERT INTO tweets (user_id, text, retweeted_from) VALUES (?, ?, ?)',
          [userId, text || null, retweetedFrom]
        );
        result = r;
      } else {
        const migrationErr = new Error(
          'Replies are not available. Run the database migration: migrations/add_parent_tweet_id.sql'
        );
        migrationErr.statusCode = 503;
        throw migrationErr;
      }
    } else {
      throw err;
    }
  }
  const selectCols = 'id, user_id, text, image_url, created_at, retweeted_from, parent_tweet_id';
  try {
    const [rows] = await pool.query(
      `SELECT ${selectCols} FROM tweets WHERE id = ?`,
      [result.insertId]
    );
    return rows[0];
  } catch (err) {
    if (err.errno === 1054 && /parent_tweet_id/.test(err.message)) {
      const [rows] = await pool.query(
        'SELECT id, user_id, text, image_url, created_at, retweeted_from FROM tweets WHERE id = ?',
        [result.insertId]
      );
      return rows[0];
    }
    throw err;
  }
}

/**
 * Delete a tweet only if it belongs to the given user. Returns true if a row was deleted.
 */
async function deleteTweetByIdAndOwner(tweetId, userId) {
  const [result] = await pool.query(
    'DELETE FROM tweets WHERE id = ? AND user_id = ?',
    [tweetId, userId]
  );
  return result.affectedRows > 0;
}

/**
 * Get one tweet by id (for ownership check). Returns row or null.
 * parent_tweet_id included when column exists (run migrations/add_parent_tweet_id.sql).
 */
async function getTweetById(tweetId) {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_id, text, created_at, retweeted_from, parent_tweet_id FROM tweets WHERE id = ?',
      [tweetId]
    );
    return rows[0] || null;
  } catch (err) {
    if (err.errno === 1054 && /parent_tweet_id/.test(err.message)) {
      const [rows] = await pool.query(
        'SELECT id, user_id, text, created_at, retweeted_from FROM tweets WHERE id = ?',
        [tweetId]
      );
      return rows[0] || null;
    }
    throw err;
  }
}

/**
 * Get tweets by user id (top-level only when parent_tweet_id exists). For profile page.
 */
async function getTweetsByUserId(userId, limit = 5) {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid < 1) return [];
  const limitVal = Math.min(limit, 50);
  const withParent = `SELECT t.id, t.user_id, t.text, t.created_at, t.retweeted_from, t.parent_tweet_id,
            u.username AS author_username, u.name AS author_name, u.profile_picture AS author_profile_picture
     FROM tweets t JOIN users u ON u.id = t.user_id
     WHERE t.user_id = ? AND (t.parent_tweet_id IS NULL) ORDER BY t.created_at DESC LIMIT ?`;
  try {
    const [rows] = await pool.query(withParent, [uid, limitVal]);
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      text: r.text,
      created_at: r.created_at,
      retweeted_from: r.retweeted_from,
      parent_tweet_id: r.parent_tweet_id,
      author: {
        id: r.user_id,
        username: r.author_username,
        name: r.author_name,
        profile_picture: r.author_profile_picture,
      },
    }));
  } catch (err) {
    if (err.errno === 1054 && /parent_tweet_id/.test(err.message)) {
      const [rows] = await pool.query(
        `SELECT t.id, t.user_id, t.text, t.created_at, t.retweeted_from,
            u.username AS author_username, u.name AS author_name, u.profile_picture AS author_profile_picture
     FROM tweets t JOIN users u ON u.id = t.user_id
     WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT ?`,
        [uid, limitVal]
      );
      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        text: r.text,
        created_at: r.created_at,
        retweeted_from: r.retweeted_from,
        author: {
          id: r.user_id,
          username: r.author_username,
          name: r.author_name,
          profile_picture: r.author_profile_picture,
        },
      }));
    }
    throw err;
  }
}

/**
 * Get replies to a tweet (parent_tweet_id = tweetId). Returns [] when column does not exist.
 */
async function getReplies(tweetId) {
  const id = Number(tweetId);
  if (!Number.isInteger(id) || id < 1) return [];
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.user_id AS author_id, t.text, t.created_at, t.parent_tweet_id,
              u.username, u.name, u.profile_picture
       FROM tweets t
       JOIN users u ON u.id = t.user_id
       WHERE t.parent_tweet_id = ?
       ORDER BY t.created_at ASC`,
      [id]
    );
    return rows.map((r) => ({
      id: r.id,
      author_id: r.author_id,
      text: r.text,
      created_at: r.created_at,
      parent_tweet_id: r.parent_tweet_id,
      author: {
        username: r.username,
        name: r.name,
        profile_picture: r.profile_picture,
      },
    }));
  } catch (err) {
    if (err.errno === 1054 && /parent_tweet_id/.test(err.message)) return [];
    throw err;
  }
}

/**
 * Like a tweet. Idempotent (INSERT IGNORE).
 */
async function likeTweet(tweetId, userId) {
  await pool.query(
    'INSERT IGNORE INTO likes (tweet_id, user_id) VALUES (?, ?)',
    [tweetId, userId]
  );
}

/**
 * Unlike a tweet.
 */
async function unlikeTweet(tweetId, userId) {
  await pool.query(
    'DELETE FROM likes WHERE tweet_id = ? AND user_id = ?',
    [tweetId, userId]
  );
}

/**
 * Create a retweet (tweet with retweeted_from set, text null). Returns created tweet row.
 * If user already retweeted this original, returns null (caller should treat as 409).
 */
async function createRetweet(userId, originalTweetId) {
  const [existing] = await pool.query(
    'SELECT id FROM tweets WHERE user_id = ? AND retweeted_from = ?',
    [userId, originalTweetId]
  );
  if (existing.length > 0) return null;
  return createTweet(userId, null, originalTweetId);
}

/**
 * Remove the current user's retweet of the given original tweet. Returns true if a row was deleted.
 */
async function deleteRetweet(userId, originalTweetId) {
  const [result] = await pool.query(
    'DELETE FROM tweets WHERE user_id = ? AND retweeted_from = ?',
    [userId, originalTweetId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createTweet,
  deleteTweetByIdAndOwner,
  getTweetById,
  getReplies,
  getTweetsByUserId,
  likeTweet,
  unlikeTweet,
  createRetweet,
  deleteRetweet,
  MAX_TEXT_LENGTH,
};

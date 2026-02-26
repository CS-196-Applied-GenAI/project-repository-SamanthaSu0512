const { pool } = require('../config/db');

const MAX_TEXT_LENGTH = 240;

/**
 * Create a tweet. Enforces text length <= 240. Returns created row.
 * @param {number} userId
 * @param {string} text
 * @param {number|null} retweetedFrom
 * @returns {Promise<object>} created tweet row
 * @throws {Error} if text length > 240
 */
async function createTweet(userId, text, retweetedFrom = null) {
  if (text != null && text.length > MAX_TEXT_LENGTH) {
    const err = new Error('Tweet text exceeds 240 characters');
    err.statusCode = 400;
    throw err;
  }
  const [result] = await pool.query(
    'INSERT INTO tweets (user_id, text, retweeted_from) VALUES (?, ?, ?)',
    [userId, text || null, retweetedFrom]
  );
  const [rows] = await pool.query(
    'SELECT id, user_id, text, image_url, created_at, retweeted_from FROM tweets WHERE id = ?',
    [result.insertId]
  );
  return rows[0];
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
 */
async function getTweetById(tweetId) {
  const [rows] = await pool.query(
    'SELECT id, user_id, text, created_at, retweeted_from FROM tweets WHERE id = ?',
    [tweetId]
  );
  return rows[0] || null;
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
  likeTweet,
  unlikeTweet,
  createRetweet,
  deleteRetweet,
  MAX_TEXT_LENGTH,
};

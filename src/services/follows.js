const { pool } = require('../config/db');

/**
 * Follow a user. No-op if follower_id === followee_id (self-follow).
 * Idempotent: duplicate insert is ignored (unique key on follower_id, followee_id).
 */
async function follow(followerId, followeeId) {
  if (followerId === followeeId) return;
  await pool.query(
    'INSERT IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)',
    [followerId, followeeId]
  );
}

/**
 * Unfollow a user. Removes the follow row.
 */
async function unfollow(followerId, followeeId) {
  await pool.query(
    'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?',
    [followerId, followeeId]
  );
}

module.exports = { follow, unfollow };

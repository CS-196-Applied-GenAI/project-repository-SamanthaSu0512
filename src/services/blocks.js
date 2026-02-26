const { pool } = require('../config/db');

/**
 * Set of user IDs that the viewer must not see (and who must not see the viewer).
 * Union of: users who blocked the viewer, users the viewer blocked.
 */
async function getBlockedSet(viewerId) {
  const [rows] = await pool.query(
    `SELECT blocker_id AS id FROM blocks WHERE blocked_id = ?
     UNION
     SELECT blocked_id AS id FROM blocks WHERE blocker_id = ?`,
    [viewerId, viewerId]
  );
  return new Set(rows.map((r) => r.id));
}

/**
 * Block a user. No-op if blocker_id === blocked_id (self-block).
 * Idempotent: duplicate insert is ignored (unique key on blocker_id, blocked_id).
 */
async function block(blockerId, blockedId) {
  if (blockerId === blockedId) return;
  await pool.query(
    'INSERT IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)',
    [blockerId, blockedId]
  );
}

/**
 * Unblock a user. Removes the block row.
 */
async function unblock(blockerId, blockedId) {
  await pool.query(
    'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
    [blockerId, blockedId]
  );
}

module.exports = { getBlockedSet, block, unblock };

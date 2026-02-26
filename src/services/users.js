const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

/**
 * Check if username or email is already taken. Returns { taken: 'username' | 'email' | null, row }.
 * If both are taken, prioritizes reporting username.
 */
async function findDuplicateUsernameOrEmail(username, email) {
  const [rows] = await pool.query(
    'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
    [username, email]
  );
  if (rows.length === 0) return { taken: null };
  for (const row of rows) {
    if (row.username === username) return { taken: 'username', row };
    if (row.email === email) return { taken: 'email', row };
  }
  return { taken: 'email', row: rows[0] };
}

/**
 * Find user by username or email (for login). Returns full row including password_hash, or null.
 */
async function findByUsernameOrEmail(login) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password_hash, name, bio, profile_picture, created_at FROM users WHERE username = ? OR email = ? LIMIT 1',
    [login, login]
  );
  return rows[0] || null;
}

/**
 * Find user by id (for session). Returns user without password_hash.
 */
async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, email, name, bio, profile_picture, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Check if username is taken by another user (excluding excludeUserId). Returns boolean.
 */
async function isUsernameTakenByOther(username, excludeUserId) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE username = ? AND id != ?',
    [username, excludeUserId]
  );
  return rows.length > 0;
}

/**
 * Update user profile (bio, username). Only updates provided fields. Returns updated user or null.
 */
async function updateProfile(userId, { bio, username }) {
  const updates = [];
  const values = [];
  if (bio !== undefined) {
    updates.push('bio = ?');
    values.push(bio);
  }
  if (username !== undefined) {
    updates.push('username = ?');
    values.push(username);
  }
  if (updates.length === 0) return findById(userId);
  values.push(userId);
  await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return findById(userId);
}

/**
 * Update profile_picture path for user. Returns updated user.
 */
async function updateProfilePicture(userId, profilePicturePath) {
  await pool.query('UPDATE users SET profile_picture = ? WHERE id = ?', [
    profilePicturePath,
    userId,
  ]);
  return findById(userId);
}

/**
 * Insert a new user. Hashes password. Returns user without password_hash.
 */
async function createUser({ username, email, password, name = null }) {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash, name) VALUES (?, ?, ?, ?)',
    [username, email, password_hash, name]
  );
  const [rows] = await pool.query(
    'SELECT id, username, email, name, bio, profile_picture, created_at FROM users WHERE id = ?',
    [result.insertId]
  );
  return rows[0];
}

module.exports = {
  findDuplicateUsernameOrEmail,
  findByUsernameOrEmail,
  findById,
  isUsernameTakenByOther,
  updateProfile,
  updateProfilePicture,
  createUser,
};

const express = require('express');
const bcrypt = require('bcrypt');
const requireAuth = require('../middleware/requireAuth');
const { validatePassword } = require('../lib/validatePassword');
const {
  findDuplicateUsernameOrEmail,
  findByUsernameOrEmail,
  findById,
  createUser,
} = require('../services/users');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'username, email, and password are required',
      });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    const { taken } = await findDuplicateUsernameOrEmail(username, email);
    if (taken === 'username') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    if (taken === 'email') {
      return res.status(409).json({ error: 'Email already taken' });
    }

    const user = await createUser({ username, email, password, name });
    return res.status(201).json(user);
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const login = username ?? email;
    if (!login || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'username or email, and password are required',
      });
    }
    const user = await findByUsernameOrEmail(login);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    const { password_hash: _, ...safeUser } = user;
    return res.status(200).json(safeUser);
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(204).send();
  });
});

module.exports = router;

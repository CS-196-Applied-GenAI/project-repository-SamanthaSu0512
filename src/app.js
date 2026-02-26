require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const { pool } = require('./config/db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const tweetsRoutes = require('./routes/tweets');
const feedRoutes = require('./routes/feed');

const app = express();
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'chirper.sid',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tweets', tweetsRoutes);
app.use('/api/feed', feedRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ ok: true, database: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, database: 'error', message: err.message });
  }
});

module.exports = app;

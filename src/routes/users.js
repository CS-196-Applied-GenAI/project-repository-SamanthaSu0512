const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const requireAuth = require('../middleware/requireAuth');
const { findById, isUsernameTakenByOther, updateProfile, updateProfilePicture } = require('../services/users');
const { uploadAvatar } = require('../middleware/upload');
const { follow, unfollow } = require('../services/follows');
const { block, unblock } = require('../services/blocks');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    return res.status(200).json(user);
  } catch (err) {
    console.error('GET /users/me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { bio, username } = req.body;
    const userId = req.session.userId;

    if (username !== undefined) {
      const taken = await isUsernameTakenByOther(username, userId);
      if (taken) return res.status(409).json({ error: 'Username already taken' });
    }

    const user = await updateProfile(userId, { bio, username });
    return res.status(200).json(user);
  } catch (err) {
    console.error('PATCH /users/me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/me/avatar', requireAuth, (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large (max 2MB)' });
      }
      if (err.message) return res.status(400).json({ error: err.message });
      console.error('Avatar upload error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded; use field name profilePicture' });
    }
    try {
      const userId = req.session.userId;
      const user = await findById(userId);
      const previousPath = user?.profile_picture;
      const profilePicturePath = `/uploads/${req.file.filename}`;
      await updateProfilePicture(userId, profilePicturePath);
      if (previousPath) {
        const prevFile = path.join(process.cwd(), 'uploads', path.basename(previousPath));
        await fs.unlink(prevFile).catch(() => {});
      }
      const updated = await findById(userId);
      return res.status(200).json(updated);
    } catch (e) {
      console.error('Avatar save error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

router.post('/:id/follow', requireAuth, async (req, res) => {
  try {
    const followerId = req.session.userId;
    const followeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(followeeId) || followeeId < 1) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (followerId === followeeId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    const target = await findById(followeeId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    await follow(followerId, followeeId);
    return res.status(204).send();
  } catch (err) {
    console.error('POST /users/:id/follow error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/follow', requireAuth, async (req, res) => {
  try {
    const followerId = req.session.userId;
    const followeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(followeeId) || followeeId < 1) {
      return res.status(404).json({ error: 'User not found' });
    }
    await unfollow(followerId, followeeId);
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /users/:id/follow error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/block', requireAuth, async (req, res) => {
  try {
    const blockerId = req.session.userId;
    const blockedId = parseInt(req.params.id, 10);
    if (!Number.isInteger(blockedId) || blockedId < 1) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }
    const target = await findById(blockedId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    await block(blockerId, blockedId);
    return res.status(204).send();
  } catch (err) {
    console.error('POST /users/:id/block error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/block', requireAuth, async (req, res) => {
  try {
    const blockerId = req.session.userId;
    const blockedId = parseInt(req.params.id, 10);
    if (!Number.isInteger(blockedId) || blockedId < 1) {
      return res.status(404).json({ error: 'User not found' });
    }
    await unblock(blockerId, blockedId);
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /users/:id/block error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  createTweet,
  deleteTweetByIdAndOwner,
  getTweetById,
  likeTweet,
  unlikeTweet,
  createRetweet,
  deleteRetweet,
  MAX_TEXT_LENGTH,
} = require('../services/tweets');

const router = express.Router({ mergeParams: true });

router.post('/', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.session.userId;
    if (text != null && text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        error: `Tweet text must be at most ${MAX_TEXT_LENGTH} characters`,
      });
    }
    const tweet = await createTweet(userId, text || null, null);
    return res.status(201).json(tweet);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    console.error('POST /tweets error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const tweetId = Number(req.params.id);
    const userId = req.session.userId;
    if (!Number.isInteger(tweetId) || tweetId < 1) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    const deleted = await deleteTweetByIdAndOwner(tweetId, userId);
    if (!deleted) {
      const tweet = await getTweetById(tweetId);
      if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
      return res.status(403).json({ error: 'Forbidden: not your tweet' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /tweets/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const tweetId = Number(req.params.id);
    const userId = req.session.userId;
    if (!Number.isInteger(tweetId) || tweetId < 1) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    const tweet = await getTweetById(tweetId);
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });
    await likeTweet(tweetId, userId);
    return res.status(204).send();
  } catch (err) {
    console.error('POST /tweets/:id/like error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/like', requireAuth, async (req, res) => {
  try {
    const tweetId = Number(req.params.id);
    const userId = req.session.userId;
    if (!Number.isInteger(tweetId) || tweetId < 1) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    await unlikeTweet(tweetId, userId);
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /tweets/:id/like error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/retweet', requireAuth, async (req, res) => {
  try {
    const originalId = Number(req.params.id);
    const userId = req.session.userId;
    if (!Number.isInteger(originalId) || originalId < 1) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    const original = await getTweetById(originalId);
    if (!original) return res.status(404).json({ error: 'Tweet not found' });
    const retweet = await createRetweet(userId, originalId);
    if (!retweet) {
      return res.status(409).json({ error: 'Already retweeted' });
    }
    return res.status(201).json(retweet);
  } catch (err) {
    console.error('POST /tweets/:id/retweet error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/retweet', requireAuth, async (req, res) => {
  try {
    const originalId = Number(req.params.id);
    const userId = req.session.userId;
    if (!Number.isInteger(originalId) || originalId < 1) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    const deleted = await deleteRetweet(userId, originalId);
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /tweets/:id/retweet error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

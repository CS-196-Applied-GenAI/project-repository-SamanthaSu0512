const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  getBlendedFeedRows,
  getLikedTweetIds,
  getRetweetedTweetIds,
} = require('../services/feed');

const router = express.Router();

// Refresh on frontend = GET /api/feed with no params (first page).

router.get('/', requireAuth, async (req, res) => {
  try {
    const viewerId = req.session.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = parseInt(req.query.offset, 10) || 0;
    const before = req.query.before ? parseInt(req.query.before, 10) : null;

    const rows = await getBlendedFeedRows(viewerId, {
      limit,
      offset: before ? 0 : offset,
      before: before && Number.isInteger(before) ? before : null,
    });

    const tweetIds = rows.map((r) => r.id);
    const canonicalIds = rows.map((r) => r.original_id || r.id);
    const [likedSet, retweetedSet] = await Promise.all([
      getLikedTweetIds(viewerId, tweetIds),
      getRetweetedTweetIds(viewerId, canonicalIds),
    ]);

    const feed = rows.map((row) => {
      const author = {
        id: row.author_id,
        username: row.author_username,
        name: row.author_name,
        profile_picture: row.author_profile_picture,
      };
      const tweet = {
        id: row.id,
        user_id: row.user_id,
        text: row.text,
        created_at: row.created_at,
        retweeted_from: row.retweeted_from,
        author,
        liked: likedSet.has(row.id),
        retweeted: retweetedSet.has(row.original_id || row.id),
      };
      if (row.retweeted_from && row.original_id) {
        tweet.originalTweet = {
          id: row.original_id,
          text: row.original_text,
          created_at: row.original_created_at,
          author: {
            id: row.original_author_id,
            username: row.original_author_username,
            name: row.original_author_name,
            profile_picture: row.original_author_profile_picture,
          },
        };
      }
      return tweet;
    });

    return res.status(200).json(feed);
  } catch (err) {
    console.error('GET /feed error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

-- Add reply support: replies reference a parent tweet (nullable = top-level tweet).
ALTER TABLE tweets
  ADD COLUMN parent_tweet_id INT NULL,
  ADD CONSTRAINT fk_tweets_parent
    FOREIGN KEY (parent_tweet_id) REFERENCES tweets(id) ON DELETE CASCADE;

CREATE INDEX idx_tweets_parent ON tweets(parent_tweet_id);

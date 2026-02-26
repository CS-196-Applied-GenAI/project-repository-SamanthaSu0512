USE chirper;

-- Tweets table
-- Stores all tweets, including original tweets and retweets
CREATE TABLE tweets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    text VARCHAR(240),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retweeted_from INT,
    INDEX (user_id),
    INDEX (retweeted_from),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (retweeted_from) REFERENCES tweets(id) ON DELETE SET NULL
); 
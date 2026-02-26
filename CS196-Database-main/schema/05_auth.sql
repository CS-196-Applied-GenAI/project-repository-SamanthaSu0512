USE chirper;

-- Blacklisted tokens table
-- Stores invalidated JWT tokens for logout functionality
CREATE TABLE blacklisted_tokens (
    token VARCHAR(512) PRIMARY KEY,
    expiration_time INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 
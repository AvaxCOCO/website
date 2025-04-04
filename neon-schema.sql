-- Database schema for $COCO X Authentication and Leaderboard

-- Users table to store X user information
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  x_id VARCHAR(255) UNIQUE NOT NULL,
  handle VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table to track X engagement
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'tweet', 'retweet', 'like', etc.
  content TEXT,
  x_activity_id VARCHAR(255),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points table to track user points and rankings
CREATE TABLE points (
  user_id INTEGER REFERENCES users(id) PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  level VARCHAR(50) DEFAULT 'Beginner',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_points_total_points ON points(total_points DESC);

-- Sample data for testing (optional)
INSERT INTO users (x_id, handle, name, profile_image_url) VALUES
('123456', '@cocouser1', 'COCO User 1', 'https://via.placeholder.com/50'),
('234567', '@cocouser2', 'COCO User 2', 'https://via.placeholder.com/50'),
('345678', '@cocouser3', 'COCO User 3', 'https://via.placeholder.com/50');

INSERT INTO points (user_id, total_points, rank, level) VALUES
(1, 15000, 1, 'Bronze'),
(2, 8000, 2, 'Beginner'),
(3, 5000, 3, 'Beginner');

INSERT INTO activities (user_id, type, content, x_activity_id, points) VALUES
(1, 'tweet', 'Just bought some $COCO! To the moon! 🚀', '1111', 10),
(1, 'retweet', 'Retweeted: $COCO is the best memecoin on AVAX!', '2222', 15),
(2, 'tweet', 'Loving my $COCO investment!', '3333', 10),
(3, 'like', 'Liked: Check out the new $COCO sticker campaign!', '4444', 2);
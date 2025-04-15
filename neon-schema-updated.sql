-- Database schema for $COCO X Authentication, Leaderboard, and Referral System

-- Users table to store X user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  x_id VARCHAR(255) UNIQUE NOT NULL,
  handle VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_image_url TEXT,
  referral_code VARCHAR(36) UNIQUE,   -- Unique code for referrals
  referral_points INTEGER DEFAULT 0,  -- Points earned from referrals
  verified_at TIMESTAMP DEFAULT NULL, -- New: Timestamp when user completed initial verification post
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table to track X engagement
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'tweet', 'retweet', 'like', 'verification' etc.
  content TEXT,
  x_activity_id VARCHAR(255), -- Can be tweet ID, etc.
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points table to track user points and rankings (original engagement points)
CREATE TABLE IF NOT EXISTS points (
  user_id INTEGER REFERENCES users(id) PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  level VARCHAR(50) DEFAULT 'Beginner',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New: Referral Emails table
CREATE TABLE IF NOT EXISTS referral_emails (
    id SERIAL PRIMARY KEY,
    referrer_user_id INTEGER REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referrer_user_id, email) -- Prevent duplicate emails per referrer
);

-- New: Referral Events table to track individual referral actions
CREATE TABLE IF NOT EXISTS referral_events (
    id SERIAL PRIMARY KEY,
    referrer_user_id INTEGER REFERENCES users(id),
    visitor_identifier TEXT NOT NULL, -- Can be session ID, new user ID, email, or wallet address
    event_type VARCHAR(20) NOT NULL, -- 'visit', 'email', 'x_connect', 'wallet_connect'
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referrer_user_id, visitor_identifier, event_type) -- Prevent duplicate events
);

-- New: Session table for express-session with connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

-- Add primary key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'session' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
END;
$$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_points_total_points ON points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_user_id);

-- Add new columns to users table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(36) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referral_points') THEN
        ALTER TABLE users ADD COLUMN referral_points INTEGER DEFAULT 0;
    END IF;
    -- Add verified_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verified_at') THEN
        ALTER TABLE users ADD COLUMN verified_at TIMESTAMP DEFAULT NULL;
    END IF;
END;
$$;


-- Function to trigger updated_at timestamp changes on users table
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table update (Create OR REPLACE)
DROP TRIGGER IF EXISTS set_timestamp ON users; -- Drop existing trigger first
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Trigger for points table update (optional, if you want last_updated on points too)
-- DROP TRIGGER IF EXISTS set_points_timestamp ON points;
-- CREATE TRIGGER set_points_timestamp
-- BEFORE UPDATE ON points
-- FOR EACH ROW
-- EXECUTE PROCEDURE trigger_set_timestamp(); -- Reuse the same function if only timestamp matters

-- Note: You might need to enable the uuid-ossp extension if you want to generate UUIDs in SQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Then you could potentially run:
-- UPDATE users SET referral_code = uuid_generate_v4() WHERE referral_code IS NULL;
-- However, the application logic will generate UUIDs if this isn't run.

-- Consider adding foreign key constraints if not already present and desired
-- ALTER TABLE activities ADD CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE points ADD CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE referral_emails ADD CONSTRAINT fk_referral_emails_user FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE referral_events ADD CONSTRAINT fk_referral_events_user FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE;
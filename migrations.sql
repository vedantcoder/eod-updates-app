-- Migration: Add missing user fields

-- Add missing column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'User';

-- Ensure created_at has default
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add team_id index for team-based queries
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);

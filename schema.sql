-- DevPulse Database Schema
-- Supabase SQL - Copy entire content into SQL Editor and run

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team_id ON users(team_id);

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT now()
);

-- Create index on tag name for faster lookups
CREATE INDEX idx_tags_name ON tags(name);

-- ============================================
-- EOD_LOGS TABLE
-- ============================================
CREATE TABLE eod_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    done TEXT,
    in_progress TEXT,
    blockers TEXT,
    hours INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create composite index for faster user log queries
CREATE INDEX idx_eod_logs_user_date ON eod_logs(user_id, date DESC);
CREATE INDEX idx_eod_logs_date ON eod_logs(date);

-- ============================================
-- LOG_TAGS JUNCTION TABLE (Many-to-Many)
-- ============================================
CREATE TABLE log_tags (
    log_id UUID NOT NULL REFERENCES eod_logs(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (log_id, tag_id)
);

-- Create index on tag_id for faster tag searches
CREATE INDEX idx_log_tags_tag_id ON log_tags(tag_id);

-- ============================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================

-- Function: Get user's stats for a specific week
CREATE OR REPLACE FUNCTION get_user_weekly_stats(user_uuid UUID, week_start_date DATE)
RETURNS TABLE (
    total_hours INTEGER,
    avg_hours_per_day DECIMAL,
    log_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(el.hours), 0)::INTEGER as total_hours,
        COALESCE(AVG(el.hours), 0)::DECIMAL as avg_hours_per_day,
        COUNT(el.id)::INTEGER as log_count
    FROM eod_logs el
    WHERE el.user_id = user_uuid
        AND el.date >= week_start_date
        AND el.date < week_start_date + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function: Get all collective stats
CREATE OR REPLACE FUNCTION get_collective_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_logs BIGINT,
    total_hours_logged BIGINT,
    avg_hours_per_log DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT u.id) as total_users,
        COUNT(el.id) as total_logs,
        COALESCE(SUM(el.hours), 0)::BIGINT as total_hours_logged,
        CASE WHEN COUNT(el.id) > 0 THEN COALESCE(AVG(el.hours), 0)::DECIMAL ELSE 0::DECIMAL END as avg_hours_per_log
    FROM users u
    LEFT JOIN eod_logs el ON u.id = el.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get team stats
CREATE OR REPLACE FUNCTION get_team_stats(team_uuid UUID)
RETURNS TABLE (
    team_name TEXT,
    member_count BIGINT,
    total_hours BIGINT,
    avg_hours_per_member DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.name as team_name,
        COUNT(DISTINCT u.id) as member_count,
        COALESCE(SUM(el.hours), 0)::BIGINT as total_hours,
        CASE WHEN COUNT(DISTINCT u.id) > 0 THEN COALESCE(SUM(el.hours), 0)::DECIMAL / COUNT(DISTINCT u.id) ELSE 0::DECIMAL END as avg_hours_per_member
    FROM teams t
    LEFT JOIN users u ON t.id = u.team_id
    LEFT JOIN eod_logs el ON u.id = el.user_id
    WHERE t.id = team_uuid
    GROUP BY t.id, t.name;
END;
$$ LANGUAGE plpgsql;
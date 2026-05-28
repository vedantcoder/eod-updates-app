-- DevPulse Dummy Data for Testing
-- Run this in Supabase SQL Editor after creating users, teams, and eod_logs tables

-- Insert Teams
INSERT INTO teams (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Frontend', 'Frontend Development Team'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Backend', 'Backend Development Team'),
  ('550e8400-e29b-41d4-a716-446655440003', 'DevOps', 'DevOps and Infrastructure Team')
ON CONFLICT DO NOTHING;

-- Insert Users
INSERT INTO users (id, email, name, password_hash, is_admin, team_id, created_at) VALUES
  -- Admin user (password: admin123)
  ('550e8400-e29b-41d4-a716-446655440010', 'admin@devpulse.com', 'Admin User', '$2b$12$TQv6ta3w_4VCZjATIUQwKOW8vQAVGI4l2wZSmNHl5xw5N5JMPfAky', true, '550e8400-e29b-41d4-a716-446655440001', NOW()),
  
  -- Frontend Team Users
  ('550e8400-e29b-41d4-a716-446655440011', 'alice@devpulse.com', 'Alice Johnson', '$2b$12$TQv6ta3w_4VCZjATIUQwKOW8vQAVGI4l2wZSmNHl5xw5N5JMPfAky', false, '550e8400-e29b-41d4-a716-446655440001', NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', 'bob@devpulse.com', 'Bob Smith', '$2b$12$TQv6ta3w_4VCZjATIUQwKOW8vQAVGI4l2wZSmNHl5xw5N5JMPfAky', false, '550e8400-e29b-41d4-a716-446655440001', NOW()),
  
  -- Backend Team Users
  ('550e8400-e29b-41d4-a716-446655440013', 'charlie@devpulse.com', 'Charlie Brown', '$2b$12$TQv6ta3w_4VCZjATIUQwKOW8vQAVGI4l2wZSmNHl5xw5N5JMPfAky', false, '550e8400-e29b-41d4-a716-446655440002', NOW()),
  ('550e8400-e29b-41d4-a716-446655440014', 'diana@devpulse.com', 'Diana Prince', '$2b$12$TQv6ta3w_4VCZjATIUQwKOW8vQAVGI4l2wZSmNHl5xw5N5JMPfAky', false, '550e8400-e29b-41d4-a716-446655440002', NOW()),
  
  -- DevOps Team User
  ('550e8400-e29b-41d4-a716-446655440015', 'evan@devpulse.com', 'Evan Davis', '$2b$12$TQv6ta3w_4VCZjATIUQwKOW8vQAVGI4l2wZSmNHl5xw5N5JMPfAky', false, '550e8400-e29b-41d4-a716-446655440003', NOW())
ON CONFLICT DO NOTHING;

-- Insert EOD Logs for this week (adjust dates as needed)
-- Alice's logs
INSERT INTO eod_logs (id, user_id, date, done, in_progress, blockers, hours, tags, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '4 days', 'Fixed login button styling', 'Working on form validation', 'None', 8, ARRAY['frontend', 'css'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '3 days', 'Implemented responsive design', 'Testing on mobile', 'Safari compatibility issues', 7, ARRAY['frontend', 'responsive'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '2 days', 'Merged PR for navigation', 'Building dashboard pages', 'None', 9, ARRAY['frontend', 'ui'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE - INTERVAL '1 day', 'Analytics page complete', 'Refactoring components', 'Performance issues', 8, ARRAY['frontend', 'performance'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE, 'Component tests passing', 'Working on admin panel', 'None', 6, ARRAY['frontend', 'testing'], NOW()),

-- Bob's logs
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '4 days', 'Setup development environment', 'Initial project structure', 'Node version mismatch', 5, ARRAY['setup', 'devops'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '3 days', 'Created base components', 'Styling theme', 'Design not finalized', 7, ARRAY['frontend', 'design'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '2 days', 'Fixed bugs from review', 'Writing documentation', 'None', 8, ARRAY['bugfix', 'docs'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE - INTERVAL '1 day', 'Documentation complete', 'Code review of PRs', 'Network issues', 6, ARRAY['docs', 'review'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440012', CURRENT_DATE, 'Merged documentation', 'Planning next features', 'None', 7, ARRAY['frontend', 'planning'], NOW()),

-- Charlie's logs
  ('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440013', CURRENT_DATE - INTERVAL '4 days', 'Database schema designed', 'Writing migrations', 'Schema approval pending', 8, ARRAY['backend', 'database'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440013', CURRENT_DATE - INTERVAL '3 days', 'API endpoints created', 'Testing with Postman', 'Auth not integrated', 9, ARRAY['backend', 'api'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440013', CURRENT_DATE - INTERVAL '2 days', 'Integrated authentication', 'Optimizing queries', 'Performance tuning needed', 8, ARRAY['backend', 'auth'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440013', CURRENT_DATE - INTERVAL '1 day', 'Query optimization done', 'Writing API tests', 'None', 9, ARRAY['backend', 'optimization'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440013', CURRENT_DATE, 'Test coverage at 85%', 'Deploying to staging', 'None', 8, ARRAY['backend', 'testing'], NOW()),

-- Diana's logs
  ('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440014', CURRENT_DATE - INTERVAL '4 days', 'API integration started', 'Building user service', 'API documentation missing', 7, ARRAY['backend', 'integration'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440014', CURRENT_DATE - INTERVAL '3 days', 'User service complete', 'Working on caching layer', 'Redis connection issues', 6, ARRAY['backend', 'cache'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440014', CURRENT_DATE - INTERVAL '2 days', 'Caching implemented', 'Code review feedback', 'None', 8, ARRAY['backend', 'performance'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440014', CURRENT_DATE - INTERVAL '1 day', 'All feedback addressed', 'Preparing for merge', 'None', 7, ARRAY['backend', 'review'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440014', CURRENT_DATE, 'Merged to main branch', 'Monitoring production', 'None', 5, ARRAY['backend', 'deployment'], NOW()),

-- Evan's logs
  ('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440015', CURRENT_DATE - INTERVAL '4 days', 'Infrastructure setup', 'Docker configuration', 'AWS credentials needed', 8, ARRAY['devops', 'docker'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440015', CURRENT_DATE - INTERVAL '3 days', 'CI/CD pipeline created', 'Setting up monitoring', 'None', 9, ARRAY['devops', 'cicd'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440015', CURRENT_DATE - INTERVAL '2 days', 'Monitoring configured', 'Writing runbooks', 'Alert thresholds pending', 7, ARRAY['devops', 'monitoring'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440015', CURRENT_DATE - INTERVAL '1 day', 'Runbooks complete', 'Testing disaster recovery', 'None', 8, ARRAY['devops', 'docs'], NOW()),
  ('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440015', CURRENT_DATE, 'DR plan tested successfully', 'Optimizing build time', 'Build time above target', 6, ARRAY['devops', 'optimization'], NOW())
ON CONFLICT DO NOTHING;

-- Verify data was inserted
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_teams FROM teams;
SELECT COUNT(*) as total_logs FROM eod_logs;

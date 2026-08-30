-- Migration: Add user settings and update activities table

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add timestamp_local_date column to activities if it doesn't exist
-- This stores the local date (YYYY-MM-DD) in the user's timezone
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS timestamp_local_date DATE;

-- Add user_timezone column to activities for historical tracking
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS user_timezone VARCHAR(100);

-- Backfill existing activities with default timezone and computed local date
UPDATE activities 
SET 
  user_timezone = 'America/New_York',
  timestamp_local_date = DATE(timestamp AT TIME ZONE 'America/New_York')
WHERE timestamp_local_date IS NULL OR user_timezone IS NULL;

-- Create index on timestamp_local_date for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_local_date ON activities(timestamp_local_date);
CREATE INDEX IF NOT EXISTS idx_activities_type_date ON activities(type, timestamp_local_date);

-- Insert default user settings if none exist
INSERT INTO user_settings (timezone) 
SELECT 'America/New_York' 
WHERE NOT EXISTS (SELECT 1 FROM user_settings);

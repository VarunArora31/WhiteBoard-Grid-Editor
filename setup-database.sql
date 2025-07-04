-- Setup script for the enhanced collaborative whiteboard database
-- Run this in your Supabase SQL editor

-- Update the rooms table to include admin_id and share_link
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS admin_id TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS share_link TEXT UNIQUE;

-- Create room_users table for managing users in rooms
CREATE TABLE IF NOT EXISTS room_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  can_draw BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create user_cursors table for live cursor tracking
CREATE TABLE IF NOT EXISTS user_cursors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_users_room_id ON room_users(room_id);
CREATE INDEX IF NOT EXISTS idx_room_users_user_id ON room_users(user_id);
CREATE INDEX IF NOT EXISTS idx_room_users_last_active ON room_users(last_active);
CREATE INDEX IF NOT EXISTS idx_user_cursors_room_id ON user_cursors(room_id);
CREATE INDEX IF NOT EXISTS idx_user_cursors_updated_at ON user_cursors(updated_at);
CREATE INDEX IF NOT EXISTS idx_rooms_share_link ON rooms(share_link);

-- Enable RLS (Row Level Security) for the new tables
ALTER TABLE room_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cursors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for room_users
CREATE POLICY "Enable read access for all users" ON room_users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON room_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON room_users
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON room_users
  FOR DELETE USING (true);

-- Create RLS policies for user_cursors
CREATE POLICY "Enable read access for all users" ON user_cursors
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON user_cursors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_cursors
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_cursors
  FOR DELETE USING (true);

-- Function to clean up old cursors automatically
CREATE OR REPLACE FUNCTION cleanup_old_cursors()
RETURNS void AS $$
BEGIN
  DELETE FROM user_cursors 
  WHERE updated_at < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled function to clean up old cursors (optional)
-- You can set this up in your Supabase dashboard under Database > Functions
-- and create a cron job to run it periodically

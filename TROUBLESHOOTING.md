# Troubleshooting Guide

## Room Creation Issues

If you're unable to create rooms, here are the steps to fix it:

### 1. Basic Room Creation (Should Work Immediately)

The app has been updated to work with the existing database schema. You should be able to:
- Create basic rooms with just a room name
- Join rooms and draw collaboratively  
- Use all basic whiteboard features

### 2. Enhanced Features Setup (Optional)

For advanced features like admin controls, user management, and live cursors:

#### Step 1: Copy the Setup Script
The app will show a setup guide on first run, or you can copy this script:

```sql
-- Enhanced Collaborative Whiteboard Setup Script
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
CREATE INDEX IF NOT EXISTS idx_user_cursors_room_id ON user_cursors(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_share_link ON rooms(share_link);

-- Enable RLS for the new tables
ALTER TABLE room_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cursors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for development)
CREATE POLICY "Enable all operations" ON room_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations" ON user_cursors FOR ALL USING (true) WITH CHECK (true);
```

#### Step 2: Run in Supabase
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Paste the script above
4. Click "Run"

#### Step 3: Reload the App
After running the script, reload the app to access enhanced features.

### 3. Common Issues

#### Issue: "Failed to create room"
**Solution**: Check your Supabase connection:
1. Verify your environment variables are set
2. Check Supabase project URL and anon key
3. Ensure the `rooms` table exists in your database

#### Issue: Drawing not working after joining
**Solution**: This is fixed in the latest version. The app now:
- Works with basic features immediately
- Allows drawing for all users by default
- Shows enhanced permission controls after setup

#### Issue: Setup guide keeps showing
**Solution**: 
1. Run the setup script in Supabase
2. Reload the page
3. If it still shows, click "Continue with Basic Features"

### 4. Features Available

#### Without Setup (Basic Mode):
- ✅ Room creation and joining
- ✅ Real-time collaborative drawing
- ✅ Drawing tools (pen, eraser, colors)
- ✅ Undo/redo functionality
- ✅ Canvas export

#### With Setup (Enhanced Mode):
- ✅ All basic features
- ✅ Admin room management
- ✅ User permission controls
- ✅ Live cursor tracking
- ✅ Secure room sharing
- ✅ User removal capabilities

### 5. Getting Help

If you continue to have issues:
1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Ensure you're using the latest version of the code
4. Try creating a room with just the room name (leave admin name empty)

The app is designed to work immediately with basic features, so you should be able to create and use rooms right away!

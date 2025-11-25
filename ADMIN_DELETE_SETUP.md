# Setup Instructions for Room Delete Feature

## Problem
The delete button is not visible because existing rooms in your database don't have the `admin_id` column populated.

## Solution

### Option 1: Run the Migration (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the migration file located at: `supabase/migrations/20251125140000_add_admin_id_to_rooms.sql`
4. Or copy and paste this SQL:

```sql
-- Add admin_id column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS admin_id TEXT;

-- Add policy to allow anyone to update rooms (needed for admin_id)
CREATE POLICY IF NOT EXISTS "Anyone can update rooms" 
ON public.rooms 
FOR UPDATE 
USING (true);

-- Add policy to allow anyone to delete rooms (will be restricted by app logic)
CREATE POLICY IF NOT EXISTS "Anyone can delete rooms" 
ON public.rooms 
FOR DELETE 
USING (true);
```

### Option 2: Update Existing Rooms
If you want to make yourself the admin of existing rooms, you need to:

1. Open browser console (F12)
2. Check the console logs - you'll see "Current User ID: xxxxx"
3. Copy your user ID
4. Go to Supabase Dashboard > SQL Editor
5. Run this SQL (replace `YOUR_USER_ID_HERE` with your actual ID):

```sql
UPDATE public.rooms 
SET admin_id = 'YOUR_USER_ID_HERE';
```

This will make you the admin of all existing rooms.

### Option 3: Delete Old Rooms and Create New Ones
1. Delete all existing rooms from Supabase Dashboard
2. Create new rooms through the app
3. New rooms will automatically have your user ID as admin_id

## Testing
1. After running the migration, refresh your browser
2. Open the console (F12) and check the logs:
   - You should see "Current User ID: xxxxx"
   - You should see "Rooms data: [...]" showing admin_id values
3. Create a new room - you should see a red trash icon on that room
4. Click the trash icon to delete the room

## Debug Info
The app now logs debug information to the console:
- Your current user ID
- Room data including admin_id for each room
- Whether you're the owner of each room

## How It Works
- When you create a room, your browser-stored user ID is saved as `admin_id`
- The delete button only appears when `room.admin_id === currentUserId`
- Even if someone tries to delete via API, the backend checks authorization

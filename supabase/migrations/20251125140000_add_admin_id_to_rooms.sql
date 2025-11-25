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

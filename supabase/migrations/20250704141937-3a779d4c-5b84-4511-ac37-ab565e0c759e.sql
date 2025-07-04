-- Create rooms table for whiteboard sessions
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drawing_strokes table for storing drawing data
CREATE TABLE public.drawing_strokes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  stroke_data JSONB NOT NULL,
  stroke_color TEXT NOT NULL DEFAULT '#000000',
  stroke_width INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_strokes ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms (public access for collaborative whiteboard)
CREATE POLICY "Anyone can view rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create rooms" 
ON public.rooms 
FOR INSERT 
WITH CHECK (true);

-- Create policies for drawing strokes (public access for collaborative whiteboard)
CREATE POLICY "Anyone can view drawing strokes" 
ON public.drawing_strokes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create drawing strokes" 
ON public.drawing_strokes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete drawing strokes" 
ON public.drawing_strokes 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaborative features
ALTER TABLE public.drawing_strokes REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.drawing_strokes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
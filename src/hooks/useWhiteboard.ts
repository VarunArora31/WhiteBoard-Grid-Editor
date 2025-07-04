import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DrawingStroke {
  id?: string;
  room_id: string;
  user_id: string;
  stroke_data: {
    points: { x: number; y: number }[];
    color: string;
    width: number;
  };
  stroke_color: string;
  stroke_width: number;
  created_at?: string;
}

export const useWhiteboard = (
  roomId: string, 
  userId?: string, 
  userName?: string
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  
  // Generate fallback userId if not provided
  const currentUserId = userId || useRef(Math.random().toString(36).substr(2, 9)).current;
  const currentUserName = userName || 'Anonymous';


  // Load existing strokes
  const loadStrokes = useCallback(async () => {
    const { data, error } = await supabase
      .from('drawing_strokes')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading strokes:', error);
      return;
    }

    // Transform the data to match our interface
    const transformedStrokes = (data || []).map(stroke => ({
      ...stroke,
      stroke_data: stroke.stroke_data as { points: { x: number; y: number }[]; color: string; width: number; }
    }));

    setStrokes(transformedStrokes);
  }, [roomId]);

  // Initialize data
  useEffect(() => {
    loadStrokes();
  }, [loadStrokes]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('whiteboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drawing_strokes',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newStroke = payload.new as any;
          if (newStroke.user_id !== currentUserId) {
            // Transform the stroke data
            const transformedStroke: DrawingStroke = {
              ...newStroke,
              stroke_data: newStroke.stroke_data as { points: { x: number; y: number }[]; color: string; width: number; }
            };
            setStrokes(prev => [...prev, transformedStroke]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'drawing_strokes',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadStrokes();
        }
      )
      .subscribe();

    // Presence tracking
    const presenceChannel = supabase.channel(`room:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flat().map((presence: any) => presence.user_name).filter(Boolean);
        setConnectedUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: currentUserId,
            user_name: currentUserName,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId, loadStrokes]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    strokes.forEach(stroke => {
      if (stroke.stroke_data?.points && stroke.stroke_data.points.length > 1) {
        ctx.beginPath();
        
        if (stroke.stroke_color === 'ERASER') {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = stroke.stroke_color;
        }
        
        ctx.lineWidth = stroke.stroke_width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const points = stroke.stroke_data.points;
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
    });
  }, [strokes]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Save stroke to database
  const saveStroke = async (strokeData: { x: number; y: number }[]) => {
    if (strokeData.length < 2) return;

    const stroke: Omit<DrawingStroke, 'id' | 'created_at'> = {
      room_id: roomId,
      user_id: currentUserId,
      stroke_data: {
        points: strokeData,
        color: isEraser ? 'ERASER' : strokeColor,
        width: isEraser ? strokeWidth * 2 : strokeWidth,
      },
      stroke_color: isEraser ? 'ERASER' : strokeColor,
      stroke_width: isEraser ? strokeWidth * 2 : strokeWidth,
    };

    const { error } = await supabase
      .from('drawing_strokes')
      .insert([stroke]);

    if (error) {
      console.error('Error saving stroke:', error);
    } else {
      // Add to local state immediately for smooth UX
      setStrokes(prev => [...prev, { ...stroke, id: Date.now().toString() }]);
      // Save current state to undo stack
      setUndoStack(prev => [...prev, strokes]);
      setRedoStack([]);
    }
  };

  // Drawing functions (with mobile support)
  const getEventPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on mobile
    setIsDrawing(true);
    const { x, y } = getEventPosition(e);
    setCurrentStroke([{ x, y }]);
  };

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getEventPosition(e);
    
    setCurrentStroke(prev => {
      const newStroke = [...prev, { x, y }];
      
        // Draw current stroke in real-time
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && newStroke.length > 1) {
          ctx.beginPath();
          
          if (isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = strokeWidth * 2;
          } else {
            ctx.globalCompositeOperation = 'source-over';  
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
          }
          
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          const lastPoint = newStroke[newStroke.length - 2];
          const currentPoint = newStroke[newStroke.length - 1];
          
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(currentPoint.x, currentPoint.y);
          ctx.stroke();
          
          ctx.globalCompositeOperation = 'source-over';
        }
      
      return newStroke;
    });
  }, [isDrawing, strokeColor, strokeWidth, isEraser]);

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 1) {
      saveStroke(currentStroke);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // Clear canvas
  const clearCanvas = async () => {
    const { error } = await supabase
      .from('drawing_strokes')
      .delete()
      .eq('room_id', roomId);

    if (error) {
      console.error('Error clearing canvas:', error);
      toast.error('Failed to clear canvas');
    } else {
      toast.success('Canvas cleared');
    }
  };

  // Undo/Redo
  const undo = () => {
    if (undoStack.length === 0) return;
    
    const prevState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, strokes]);
    setStrokes(prevState);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, strokes]);
    setStrokes(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Export canvas
  const exportCanvas = (format: 'png' | 'jpeg' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    link.click();
  };

  return {
    canvasRef,
    isDrawing,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    isEraser,
    setIsEraser,
    connectedUsers,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    undo,
    redo,
    exportCanvas,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
};
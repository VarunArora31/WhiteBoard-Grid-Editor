import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserCursor } from '@/hooks/useRooms';

interface LiveCursorsProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface CursorComponentProps {
  cursor: UserCursor;
  color: string;
}

const CursorComponent = ({ cursor, color }: CursorComponentProps) => (
  <div
    className="absolute pointer-events-none z-50 transition-all duration-75"
    style={{
      left: cursor.x,
      top: cursor.y,
      transform: 'translate(-50%, -50%)',
    }}
  >
    {/* Cursor SVG */}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 3L19 12L12 13L9 20L5 3Z"
        fill={color}
        stroke="white"
        strokeWidth="1"
      />
    </svg>
    
    {/* User name label */}
    <div
      className="absolute top-6 left-0 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
      style={{ backgroundColor: color }}
    >
      {cursor.user_name}
    </div>
  </div>
);

export const LiveCursors = ({ 
  roomId, 
  currentUserId, 
  currentUserName, 
  canvasRef 
}: LiveCursorsProps) => {
  const [cursors, setCursors] = useState<UserCursor[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const updateCursorTimeoutRef = useRef<NodeJS.Timeout>();

  // Color palette for different users
  const cursorColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8', '#00B894'
  ];

  const getUserColor = (userId: string) => {
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return cursorColors[index % cursorColors.length];
  };

  // Update cursor position in database (throttled)
  const updateCursorPosition = async (x: number, y: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 50) return; // Throttle to max 20 updates per second
    
    lastUpdateRef.current = now;

    // Clear existing timeout
    if (updateCursorTimeoutRef.current) {
      clearTimeout(updateCursorTimeoutRef.current);
    }

    // Debounce the update
    updateCursorTimeoutRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('user_cursors')
          .upsert([{
            room_id: roomId,
            user_id: currentUserId,
            user_name: currentUserName,
            x,
            y,
          }], {
            onConflict: 'room_id,user_id'
          });
      } catch (error) {
        console.error('Error updating cursor position:', error);
      }
    }, 100);
  };

  // Handle mouse move on canvas
  const handleMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateCursorPosition(x, y);
  };

  // Handle mouse leave - remove cursor
  const handleMouseLeave = async () => {
    try {
      await supabase
        .from('user_cursors')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', currentUserId);
    } catch (error) {
      console.error('Error removing cursor:', error);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup on unmount
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      handleMouseLeave(); // Remove cursor when component unmounts
    };
  }, [roomId, currentUserId, currentUserName]);

  useEffect(() => {
    // Subscribe to cursor updates
    const channel = supabase
      .channel('user-cursors')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cursors',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Reload all cursors
          const { data, error } = await supabase
            .from('user_cursors')
            .select('*')
            .eq('room_id', roomId)
            .neq('user_id', currentUserId); // Exclude current user's cursor

          if (error) {
            console.error('Error loading cursors:', error);
            return;
          }

          setCursors(data || []);
        }
      )
      .subscribe();

    // Initial load
    const loadCursors = async () => {
      const { data, error } = await supabase
        .from('user_cursors')
        .select('*')
        .eq('room_id', roomId)
        .neq('user_id', currentUserId);

      if (!error) {
        setCursors(data || []);
      }
    };

    loadCursors();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId]);

  // Clean up old cursors periodically
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      try {
        await supabase
          .from('user_cursors')
          .delete()
          .eq('room_id', roomId)
          .lt('updated_at', fiveMinutesAgo);
      } catch (error) {
        console.error('Error cleaning up old cursors:', error);
      }
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanupInterval);
  }, [roomId]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {cursors.map((cursor) => (
        <CursorComponent
          key={cursor.user_id}
          cursor={cursor}
          color={getUserColor(cursor.user_id)}
        />
      ))}
    </div>
  );
};

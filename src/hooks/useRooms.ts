import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Room {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const useRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const generateShareLink = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const loadRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading rooms:', error);
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  };

  const createRoom = async (name: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
      return null;
    }
    
    await loadRooms();
    toast.success('Room created successfully!');
    return data;
  };

  const deleteRoom = async (roomId: string) => {
    console.log('🗑️ Starting room deletion process for roomId:', roomId);
    
    // First delete all drawing strokes in the room
    console.log('🔍 Deleting drawing strokes for room:', roomId);
    const { data: deletedStrokes, error: strokesError, count: strokesCount } = await supabase
      .from('drawing_strokes')
      .delete()
      .eq('room_id', roomId)
      .select('*', { count: 'exact' });

    if (strokesError) {
      console.error('❌ Error deleting room strokes:', {
        error: strokesError,
        message: strokesError.message,
        details: strokesError.details,
        hint: strokesError.hint,
        code: strokesError.code
      });
      toast.error('Failed to delete room content');
      return false;
    }
    
    console.log('✅ Successfully deleted', strokesCount || 0, 'drawing strokes');

    // Then delete the room itself
    console.log('🏠 Deleting room:', roomId);
    const { data: deletedRoom, error: roomError, count: roomCount } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
      .select('*', { count: 'exact' });

    if (roomError) {
      console.error('❌ Error deleting room:', {
        error: roomError,
        message: roomError.message,
        details: roomError.details,
        hint: roomError.hint,
        code: roomError.code
      });
      toast.error('Failed to delete room');
      return false;
    }
    
    console.log('✅ Successfully deleted', roomCount || 0, 'room(s)');
    console.log('🔄 Refreshing rooms list...');
    
    await loadRooms();
    toast.success('Room deleted successfully!');
    console.log('🎉 Room deletion completed successfully!');
    return true;
  };


  useEffect(() => {
    loadRooms();

    const channel = supabase
      .channel('rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',  
          table: 'rooms',
        },
        () => {
          loadRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    rooms,
    loading,
    createRoom,
    deleteRoom,
    refreshRooms: loadRooms,
  };
};

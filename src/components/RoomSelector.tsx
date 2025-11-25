import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calendar, Palette, Brush, Trash2 } from 'lucide-react';
import { useRooms, Room } from '@/hooks/useRooms';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface RoomSelectorProps {
  onRoomSelect: (roomId: string) => void;
}

export const RoomSelector = ({ onRoomSelect }: RoomSelectorProps) => {
  const { rooms, loading, createRoom, deleteRoom } = useRooms();
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const generateUserId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Get or create a persistent user ID
  useEffect(() => {
    let userId = localStorage.getItem('whiteboard_user_id');
    if (!userId) {
      userId = generateUserId();
      localStorage.setItem('whiteboard_user_id', userId);
    }
    console.log('Current User ID:', userId);
    setCurrentUserId(userId);
  }, []);

  // Debug: Log rooms data
  useEffect(() => {
    if (rooms.length > 0) {
      console.log('Rooms data:', rooms.map(r => ({ 
        name: r.name, 
        admin_id: r.admin_id, 
        isOwner: r.admin_id === currentUserId 
      })));
      console.log('Current user ID:', currentUserId);
    }
  }, [rooms, currentUserId]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || creating || !currentUserId) return;

    setCreating(true);
    const room = await createRoom(newRoomName.trim(), currentUserId);
    if (room) {
      setNewRoomName('');
      setIsCreateDialogOpen(false);
      onRoomSelect(room.id);
    }
    setCreating(false);
  };

  const handleDeleteRoom = async (roomId: string, roomName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    if (!currentUserId) {
      toast.error('User ID not found');
      return;
    }

    setDeletingRoomId(roomId);
    const success = await deleteRoom(roomId, currentUserId);
    setDeletingRoomId(null);
    
    if (!success) {
      toast.error('Failed to delete room');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-25 to-teal-50 p-4 sm:p-6" style={{backgroundColor: '#f0fdf4'}}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="mb-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <div className="relative">
                  <Palette className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
                  <Brush className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-200 absolute -bottom-1 -right-1 rotate-45" />
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Collaborative Whiteboard
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Create or join a room to start drawing together in real-time
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Available Rooms</h2>
            <p className="text-muted-foreground mt-1">Join an existing room or create a new one</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2">
                <Plus className="w-4 h-4 mr-2" />
                Create New Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter room name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim() || creating}
                    className="flex-1"
                  >
                    {creating ? 'Creating...' : 'Create Room'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No rooms yet</p>
              <p className="text-muted-foreground mb-4">
                Create your first room to start collaborating
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {rooms.map((room) => (
              <Card 
                key={room.id} 
                className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 shadow-md bg-white/70 backdrop-blur-sm hover:bg-white/90 relative"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle 
                      className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition-colors cursor-pointer flex-1"
                      onClick={() => onRoomSelect(room.id)}
                    >
                      {room.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {room.admin_id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => handleDeleteRoom(room.id, room.name, e)}
                          disabled={deletingRoomId === room.id}
                          title="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="cursor-pointer" onClick={() => onRoomSelect(room.id)}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDistanceToNow(new Date(room.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                      <Users className="w-4 h-4" />
                      <span>Join & Draw</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

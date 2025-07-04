import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calendar } from 'lucide-react';
import { useRooms, Room } from '@/hooks/useRooms';
import { formatDistanceToNow } from 'date-fns';

interface RoomSelectorProps {
  onRoomSelect: (roomId: string) => void;
}

export const RoomSelector = ({ onRoomSelect }: RoomSelectorProps) => {
  const { rooms, loading, createRoom } = useRooms();
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const generateUserId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || creating) return;

    setCreating(true);
    const room = await createRoom(newRoomName.trim());
    if (room) {
      setNewRoomName('');
      setIsCreateDialogOpen(false);
      onRoomSelect(room.id);
    }
    setCreating(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2">
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
                      className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors cursor-pointer flex-1"
                      onClick={() => onRoomSelect(room.id)}
                    >
                      {room.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
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

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Users, DoorOpen } from 'lucide-react';
import { useRooms, Room } from '@/hooks/useRooms';
import { toast } from 'sonner';

interface UserJoinDialogProps {
  isOpen: boolean;
  room: Room | null;
  onJoin: (userId: string, userName: string) => void;
  onCancel: () => void;
}

export const UserJoinDialog = ({ 
  isOpen, 
  room, 
  onJoin, 
  onCancel 
}: UserJoinDialogProps) => {
  const [userName, setUserName] = useState('');
  const [joining, setJoining] = useState(false);
  const { addUserToRoom } = useRooms();

  const generateUserId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleJoin = async () => {
    if (!userName.trim() || !room) return;

    setJoining(true);
    const userId = generateUserId();
    
    try {
      const success = await addUserToRoom(room.id, userId, userName.trim());
      
      if (success) {
        onJoin(userId, userName.trim());
        toast.success(`Welcome to ${room.name}!`);
      } else {
        toast.error('Failed to join room. Please try again.');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('An error occurred while joining the room.');
    } finally {
      setJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => !joining && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5" />
            Join Room
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Room Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <p className="text-sm text-muted-foreground">
                  You've been invited to collaborate on this whiteboard
                </p>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Join and start drawing together!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Info Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Your Name</Label>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {userName ? getUserInitials(userName) : '?'}
                  </AvatarFallback>
                </Avatar>
                <Input
                  id="userName"
                  placeholder="Enter your name..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={joining}
                  className="flex-1"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This name will be visible to other users in the room
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={joining}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleJoin}
              disabled={!userName.trim() || joining}
              className="flex-1"
            >
              {joining ? 'Joining...' : 'Join Room'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

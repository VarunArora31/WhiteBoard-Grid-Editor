import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Shield, 
  Users, 
  UserMinus, 
  Pencil, 
  PencilOff, 
  MoreVertical,
  Copy,
  Crown
} from 'lucide-react';
import { useRooms, RoomUser } from '@/hooks/useRooms';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UserManagementProps {
  roomId: string;
  isAdmin: boolean;
  currentUserId: string;
  roomShareLink: string;
}

export const UserManagement = ({ 
  roomId, 
  isAdmin, 
  currentUserId,
  roomShareLink 
}: UserManagementProps) => {
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  
  const { 
    removeUserFromRoom, 
    updateUserPermissions, 
    getRoomUsers 
  } = useRooms();

  const loadUsers = async () => {
    setLoading(true);
    const roomUsers = await getRoomUsers(roomId);
    setUsers(roomUsers);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();

    // Subscribe to user changes
    const channel = supabase
      .channel('room-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_users',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleRemoveUser = async (userId: string) => {
    const success = await removeUserFromRoom(roomId, userId);
    if (success) {
      setShowRemoveDialog(null);
      loadUsers();
    }
  };

  const handleToggleDrawPermission = async (userId: string, currentCanDraw: boolean) => {
    const success = await updateUserPermissions(roomId, userId, !currentCanDraw);
    if (success) {
      loadUsers();
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}?share=${roomShareLink}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Share link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Share Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Invite Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
              {window.location.origin}?share={roomShareLink}
            </div>
            <Button onClick={handleCopyShareLink} size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Share this link to invite others to the room
          </p>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Room Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {getUserInitials(user.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.user_name}</span>
                      {user.role === 'admin' && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Admin
                        </Badge>
                      )}
                      {user.user_id === currentUserId && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Joined {new Date(user.joined_at).toLocaleDateString()}</span>
                      {user.can_draw ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Pencil className="w-3 h-3" />
                          Can Draw
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <PencilOff className="w-3 h-3" />
                          View Only
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && user.user_id !== currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleToggleDrawPermission(user.user_id, user.can_draw)}
                      >
                        {user.can_draw ? (
                          <>
                            <PencilOff className="w-4 h-4 mr-2" />
                            Revoke Drawing
                          </>
                        ) : (
                          <>
                            <Pencil className="w-4 h-4 mr-2" />
                            Allow Drawing
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowRemoveDialog(user.user_id)}
                        className="text-destructive"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remove User Dialog */}
      <Dialog open={!!showRemoveDialog} onOpenChange={() => setShowRemoveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to remove this user from the room? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showRemoveDialog && handleRemoveUser(showRemoveDialog)}
            >
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

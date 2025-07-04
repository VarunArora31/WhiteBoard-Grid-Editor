import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface SetupGuideProps {
  onDismiss: () => void;
}

export const SetupGuide = ({ onDismiss }: SetupGuideProps) => {
  const copySetupScript = () => {
    const script = `-- Enhanced Collaborative Whiteboard Setup Script
-- Run this in your Supabase SQL editor

-- Update the rooms table to include admin_id and share_link
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS admin_id TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS share_link TEXT UNIQUE;

-- Create room_users table for managing users in rooms
CREATE TABLE IF NOT EXISTS room_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  can_draw BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create user_cursors table for live cursor tracking
CREATE TABLE IF NOT EXISTS user_cursors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_users_room_id ON room_users(room_id);
CREATE INDEX IF NOT EXISTS idx_room_users_user_id ON room_users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cursors_room_id ON user_cursors(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_share_link ON rooms(share_link);

-- Enable RLS for the new tables
ALTER TABLE room_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cursors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for development)
CREATE POLICY "Enable all operations" ON room_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations" ON user_cursors FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(script).then(() => {
      toast.success('Setup script copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy script');
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            Database Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              To enable the enhanced collaborative features (admin controls, user management, live cursors), 
              you need to run a setup script in your Supabase database.
            </p>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Current Features Available
              </h3>
              <ul className="space-y-1 text-sm">
                <li>• Basic room creation and joining</li>
                <li>• Real-time collaborative drawing</li>
                <li>• Drawing tools and canvas export</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                Enhanced Features (Requires Setup)
              </h3>
              <ul className="space-y-1 text-sm text-yellow-700">
                <li>• Admin room management</li>
                <li>• User permission controls</li>
                <li>• Live cursor tracking</li>
                <li>• Secure room sharing</li>
                <li>• User removal and management</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Setup Instructions:</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <Badge variant="outline">1</Badge>
                <span>Copy the setup script below</span>
              </li>
              <li className="flex gap-3">
                <Badge variant="outline">2</Badge>
                <span>Open your Supabase dashboard → SQL Editor</span>
              </li>
              <li className="flex gap-3">
                <Badge variant="outline">3</Badge>
                <span>Paste and run the script</span>
              </li>
              <li className="flex gap-3">
                <Badge variant="outline">4</Badge>
                <span>Reload this page to access enhanced features</span>
              </li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={copySetupScript} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copy Setup Script
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Supabase
            </Button>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={onDismiss} className="flex-1">
              Continue with Basic Features
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

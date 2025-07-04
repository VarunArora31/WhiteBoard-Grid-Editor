import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { 
  Palette, 
  Download, 
  Trash2, 
  Undo, 
  Redo,
  Users,
  Share2
} from 'lucide-react';
import { Eraser } from 'lucide-react';

interface DrawingToolbarProps {
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  isEraser: boolean;
  setIsEraser: (eraser: boolean) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: (format: 'png' | 'jpeg') => void;
  onShare: () => void;
  canUndo: boolean;
  canRedo: boolean;
  connectedUsers: string[];
}

const colorPalette = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  '#800080', '#008000', '#800000', '#000080'
];

export const DrawingToolbar = ({
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  isEraser,
  setIsEraser,
  onClear,
  onUndo,
  onRedo,
  onExport,
  onShare,
  canUndo,
  canRedo,
  connectedUsers,
}: DrawingToolbarProps) => {
  return (
    <Card className="p-3 sm:p-4 mb-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        {/* Drawing Tools */}
        <div className="flex items-center gap-2">
          <Button
            variant={!isEraser ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEraser(false)}
          >
            <Palette className="w-4 h-4" />
          </Button>
          <Button
            variant={isEraser ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEraser(true)}
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        {/* Color Palette */}
        {!isEraser && (
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 ${
                    strokeColor === color
                      ? 'border-white shadow-lg scale-110' 
                      : 'border-gray-300 hover:scale-105 hover:shadow-md'
                  } transition-all duration-200`}
                  style={{ backgroundColor: color }}
                  onClick={() => setStrokeColor(color)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stroke Width */}
        <div className="flex items-center gap-2 min-w-[100px] sm:min-w-[120px]">
          <span className="text-xs sm:text-sm font-medium">Size:</span>
          <Slider
            value={[strokeWidth]}
            onValueChange={(value) => setStrokeWidth(value[0])}
            max={20}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="text-xs sm:text-sm text-muted-foreground w-4 sm:w-6">{strokeWidth}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="px-2 sm:px-3"
          >
            <Undo className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1">Undo</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="px-2 sm:px-3"
          >
            <Redo className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1">Redo</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="px-2 sm:px-3"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1">Clear</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('png')}
            className="px-2 sm:px-3"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1">Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="px-2 sm:px-3"
          >
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1">Share</span>
          </Button>
        </div>

        {/* Connected Users */}
        <div className="flex items-center gap-2 ml-auto">
          <Users className="w-4 h-4" />
          <span className="text-sm text-muted-foreground">
            {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online
          </span>
        </div>
      </div>
    </Card>
  );
};
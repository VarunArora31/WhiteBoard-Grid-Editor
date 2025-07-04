import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DrawingToolbar } from './DrawingToolbar';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { toast } from 'sonner';

interface WhiteboardCanvasProps {
  roomId: string;
  onBack: () => void;
}

export const WhiteboardCanvas = ({ 
  roomId, 
  onBack 
}: WhiteboardCanvasProps) => {
  const {
    canvasRef,
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
    canUndo,
    canRedo,
  } = useWhiteboard(roomId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Set up canvas context
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    const handleResize = () => {
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleShare = () => {
    const roomUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(roomUrl).then(() => {
      toast.success('Room link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-md">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBack} size="sm" className="shrink-0">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Rooms</span>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Collaborative Whiteboard
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Drawing Toolbar */}
          <DrawingToolbar
            strokeColor={strokeColor}
            setStrokeColor={setStrokeColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            isEraser={isEraser}
            setIsEraser={setIsEraser}
            onClear={clearCanvas}
            onUndo={undo}
            onRedo={redo}
            onExport={exportCanvas}
            onShare={handleShare}
            canUndo={canUndo}
            canRedo={canRedo}
            connectedUsers={connectedUsers}
          />

          {/* Canvas Container */}
          <Card className="relative overflow-auto shadow-xl border-0 bg-white/90 backdrop-blur-sm" style={{ height: 'calc(100vh - 320px)' }}>
            <div className="relative w-full h-full min-h-[400px]">
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 bg-white rounded-lg ${
                  isEraser ? 'cursor-grab' : 'cursor-crosshair'
                }`}
                width={1200}
                height={800}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ 
                  touchAction: 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

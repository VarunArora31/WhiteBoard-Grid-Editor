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
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-emerald-25 to-teal-50 p-2" style={{backgroundColor: '#f0fdf4'}}>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 bg-white/70 backdrop-blur-sm rounded-lg p-2 sm:p-3 shadow-md">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBack} size="sm" className="shrink-0">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Rooms</span>
            </Button>
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Collaborative Whiteboard
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online</span>
          </div>
        </div>

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
        <Card className="relative flex-1 overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur-sm mt-2">
          <div className="relative w-full h-full">
            <canvas
              ref={canvasRef}
              className={`w-full h-full bg-white rounded-lg ${
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
                touchAction: 'none'
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { RoomSelector } from '@/components/RoomSelector';
import { WhiteboardCanvas } from '@/components/WhiteboardCanvas';

const Index = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Check URL for room parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    if (roomId) {
      setSelectedRoomId(roomId);
    }
  }, []);

  if (selectedRoomId) {
    return (
      <WhiteboardCanvas 
        roomId={selectedRoomId} 
        onBack={() => setSelectedRoomId(null)} 
      />
    );
  }

  return <RoomSelector onRoomSelect={setSelectedRoomId} />;
};

export default Index;

import WatchRoom from '../models/WatchRoom.js';

// Create a new watch room
export const createRoom = async (req, res) => {
  try {
    const { hostId, hostName } = req.body;
    
    // Generate a unique 6-character room code
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newRoom = new WatchRoom({
      roomId,
      hostId,
      participants: [{
        userId: hostId,
        userName: hostName,
        role: 'host'
      }]
    });
    
    await newRoom.save();
    
    res.status(201).json({ success: true, room: newRoom });
  } catch (error) {
    console.error('Error creating watch room:', error);
    res.status(500).json({ success: false, error: 'Failed to create watch room' });
  }
};

// Get room details
export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await WatchRoom.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    res.status(200).json({ success: true, room });
  } catch (error) {
    console.error('Error fetching watch room:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch watch room' });
  }
};

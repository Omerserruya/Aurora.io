import { Server, Socket } from 'socket.io';
import mcpService from '../services/mcpService';

// Socket handler for chat functionality
export default function setupSocketHandlers(io: Server) {
  // Map to track active rooms and their connections
  const activeRooms = new Map<string, string[]>();

  io.on('connection', (socket: Socket) => {
    let currentRoom: string | null = null;
    
    // Handle joining a room
    socket.on('join_room', (data: { userId: string, connectionId: string }) => {
      const { userId, connectionId } = data;
      
      if (!userId || !connectionId) {
        socket.emit('error', { 
          message: 'Missing userId or connectionId' 
        });
        return;
      }
      
      // Create a unique room ID based on userId and connectionId
      const roomId = `room:${userId}:${connectionId}`;
      currentRoom = roomId;
      
      // Join the room
      socket.join(roomId);
      
      // Track active rooms
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, []);
      }
      activeRooms.get(roomId)?.push(socket.id);
      
      socket.emit('room_joined', { 
        roomId,
        message: `Joined conversation room for user ${userId}`
      });
    });
    
    // Handle chat messages
    socket.on('send_message', async (data: any) => {
      const { prompt, userId, connectionId, options } = data;
      
      if (!prompt || !userId || !connectionId) {
        socket.emit('error', { 
          message: 'Missing required parameters: prompt, userId, or connectionId' 
        });
        return;
      }
      
      // Make sure the user is in the correct room
      const roomId = `room:${userId}:${connectionId}`;
      
      // If not in the correct room yet, join it
      if (currentRoom !== roomId) {
        socket.join(roomId);
        currentRoom = roomId;
        
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, []);
        }
        activeRooms.get(roomId)?.push(socket.id);
        
      }
      
      
      try {
        // Process the query through MCP service
        const response = await mcpService.processQuery(prompt, userId, connectionId, options);
        
        // Send response back to the specific room
        io.to(roomId).emit('receive_message', {
          response: response.response,
          timestamp: new Date().toISOString()
        });
        
      } catch (error: any) {
        console.error(`[Socket:${roomId}] Error processing message:`, error);
        io.to(roomId).emit('error', { 
          message: error.message || 'Failed to process message' 
        });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      
      if (currentRoom) {
        // Remove socket from active rooms tracking
        const sockets = activeRooms.get(currentRoom);
        if (sockets) {
          const index = sockets.indexOf(socket.id);
          if (index !== -1) {
            sockets.splice(index, 1);
          }
          
          // If room is empty, remove it
          if (sockets.length === 0) {
            activeRooms.delete(currentRoom);
          }
        }
      }
    });
  });
} 
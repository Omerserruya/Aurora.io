import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

// Enable debugging by uncommenting:
// localStorage.setItem('debug', 'socket.io-client:socket');

class SocketService {
  private socket: ReturnType<typeof io> | null = null;
  private currentRoom: string | null = null;
  private connectionAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  
  connect() {
    if (!this.socket) {
      try {
        console.log('Connecting to Socket.IO server');
        this.connectionAttempts++;
        
        // Connect to the Socket.IO server
        this.socket = io('/', {
          path: '/socket.io',
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ['websocket', 'polling'] // Prefer WebSocket, fallback to polling
        });
        
        // Connection event handlers
        this.socket.on('connect', () => {
          console.log('Socket connected successfully:', this.socket?.id);
          this.connectionAttempts = 0; // Reset reconnection counter on successful connection
        });
        
        this.socket.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error.message);
          
          if (this.connectionAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            console.error(`Failed to connect after ${this.connectionAttempts} attempts. Giving up.`);
            this.disconnect();
          }
        });
        
        this.socket.on('disconnect', (reason: string) => {
          console.log('Socket disconnected, reason:', reason);
          // Reset room tracking on disconnect
          this.currentRoom = null;
        });

        // Room event handlers
        this.socket.on('room_joined', (data: { roomId: string, message: string }) => {
          console.log(`Successfully joined room: ${data.roomId}`, data.message);
          this.currentRoom = data.roomId;
        });
        
        // General error handler
        this.socket.on('error', (error: any) => {
          console.error('Socket general error:', error);
        });
      } catch (error) {
        console.error('Failed to initialize socket connection:', error);
        this.socket = null;
      }
    }
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      try {
        console.log('Disconnecting socket');
        this.socket.disconnect();
      } catch (error) {
        console.error('Error during socket disconnect:', error);
      } finally {
        this.socket = null;
        this.currentRoom = null;
        console.log('Socket disconnected and reset');
      }
    }
  }
  
  // Get existing socket or create a new connection
  getSocket() {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }
  
  // Check if socket is connected
  isConnected(): boolean {
    return !!this.socket?.connected;
  }
  
  // Join a room for the conversation
  joinRoom(userId: string, connectionId: string) {
    if (!userId || !connectionId) {
      console.error('Cannot join room: missing userId or connectionId');
      return false;
    }
    
    const socket = this.getSocket();
    if (!socket) {
      console.error('Cannot join room: socket connection failed');
      return false;
    }
    
    const targetRoom = `room:${userId}:${connectionId}`;
    
    // Only join if not already in this room
    if (this.currentRoom !== targetRoom) {
      console.log(`Joining room for user ${userId}, connection ${connectionId}`);
      socket.emit('join_room', { userId, connectionId });
      return true;
    } else {
      console.log(`Already in room: ${this.currentRoom}`);
    }
    
    return false;
  }
  
  // Send a chat message
  sendMessage(message: { prompt: string; userId: string; connectionId: string; options?: any }) {
    if (!message.prompt || !message.userId || !message.connectionId) {
      console.error('Cannot send message: missing required fields');
      return false;
    }
    
    const socket = this.getSocket();
    if (!socket) {
      console.error('Cannot send message: socket connection failed');
      return false;
    }
    
    // Join room first if needed
    this.joinRoom(message.userId, message.connectionId);
    
    // Send the message
    try {
      console.log(`Sending message to room for user ${message.userId}`);
      socket.emit('send_message', message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
  
  // Subscribe to receive messages
  onReceiveMessage(callback: (data: any) => void) {
    const socket = this.getSocket();
    if (!socket) return () => {};
    
    socket.on('receive_message', callback);
    return () => socket.off('receive_message', callback);
  }
  
  // Subscribe to error events
  onError(callback: (error: any) => void) {
    const socket = this.getSocket();
    if (!socket) return () => {};
    
    socket.on('error', callback);
    return () => socket.off('error', callback);
  }
}

// Export as a singleton
export default new SocketService(); 
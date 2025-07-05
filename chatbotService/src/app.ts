import createServer from './server';
import { environment } from './config/environment';
import { Server } from 'socket.io';
import setupSocketHandlers from './socket/chatSocketHandler';

const app = createServer();

// Start server
const PORT = environment.port;
const server = app.listen(PORT, () => {
  console.log(`Chatbot service running on port ${PORT} in ${environment.nodeEnv} mode`);
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app; 
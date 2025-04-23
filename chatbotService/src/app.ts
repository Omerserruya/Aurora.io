import createServer from './server';
import { environment } from './config/environment';

const app = createServer();

// Start server
const PORT = environment.port;
const server = app.listen(PORT, () => {
  console.log(`Chatbot service running on port ${PORT} in ${environment.nodeEnv} mode`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app; 
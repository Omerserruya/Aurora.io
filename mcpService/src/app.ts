import createServer from './server';
import { environment } from './config/environment';
import logger from './utils/logger';

const app = createServer();
const port = environment.port;

// Start the server
const server = app.listen(port, () => {
  logger.info(`MCP Service is running on port ${port}`);
  logger.info(`Environment: ${environment.nodeEnv}`);
});

// Handle SIGTERM signal for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
  process.exit(1);
});

export default app; 
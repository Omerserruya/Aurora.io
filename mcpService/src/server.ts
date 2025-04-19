import express, { Express } from 'express';
import cors from 'cors';
import { environment } from './config/environment';
import mcpRoutes from './routes/mcpRoutes';
import logger from './utils/logger';

const createServer = (): Express => {
  const app = express();
  
  // CORS setup
  const corsOptions = {
    origin: '*', // In production, this should be restricted
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());
  
  // Logging middleware
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
  
  // API routes
  app.use('/api/mcp', mcpRoutes);
  
  // Root health check
  app.get('/', (req, res) => {
    res.status(200).json({ message: 'MCP Service is running' });
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  
  return app;
};

export default createServer; 
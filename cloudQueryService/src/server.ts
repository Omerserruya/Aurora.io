import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { cloudQueryRoutes } from './routes/cloudQueryRoutes';
import { logger } from './utils/logger';
import cookieParser from 'cookie-parser';

export const createServer = () => {
  const app = express();
  const corsOptions = {
      origin: process.env.FRONTEND_URL || 'http://localhost',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
    
  // Middleware
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser());
  
  // Routes
  app.use('/', cloudQueryRoutes);

  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}; 
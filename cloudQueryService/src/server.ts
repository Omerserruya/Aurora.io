import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { cloudQueryRoutes } from './routes/cloudQueryRoutes';
import { logger } from './utils/logger';

export const createServer = () => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/', cloudQueryRoutes);

  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}; 
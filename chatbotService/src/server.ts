import express, { Express } from 'express';
import cors from 'cors';
import { environment } from './config/environment';
import chatbotRoutes from './routes/chatbotRoutes';

const createServer = (): Express => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
  
  // Routes
  app.use('/api/chatbot', chatbotRoutes);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      service: 'Cloud Architecture Chatbot Service',
      status: 'running'
    });
  });
  
  return app;
};

export default createServer; 
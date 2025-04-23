import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { environment } from './config/environment';
import chatbotRoutes from './routes/chatbotRoutes';

const createServer = (): Express => {
  const app = express();
  
  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  };
  
  // Middleware
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser());
  
  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
  
  // Routes
  app.use('/', chatbotRoutes);
  
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
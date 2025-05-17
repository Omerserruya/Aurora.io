import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import chatbotRoutes from './routes/chatbotRoutes';
import aiRecommendationsRoutes from './routes/aiRecommendations.routes';

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
  
  app.use('/recommendations', aiRecommendationsRoutes);
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
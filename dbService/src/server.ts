import dotenv from "dotenv";
import path from 'path';

// Load environment variables before anything else
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import awsConnectionRoutes from './routes/awsConnection.routes';
import MongoDBManager from './config/mongodb';
import Neo4jManager from './config/neo4j';
import neoRoutes from './routes/cloudQueryResults.routes';
import resourceMetricsRoutes from './routes/resourceMetrics.routes';
import aiRecommendationsRoutes from './routes/aiRecommendations.routes';
import { Neo4jService } from './services/neo4j.service';

const app = express();
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Cookies:', req.cookies);
  if (req.cookies && req.cookies.accessToken) {
    console.log('Access Token found in cookies');
  } else {
    console.log('No Access Token in cookies');
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// AWS Connection routes
app.use('/aws-connections', awsConnectionRoutes);
app.use('/neo', neoRoutes);
app.use('/resources', resourceMetricsRoutes);
app.use('/ai-recommendations', aiRecommendationsRoutes);

// Initialize database connections
const mongoManager = MongoDBManager.getInstance();
const neo4jManager = Neo4jManager.getInstance();

// Initialize Neo4j
Neo4jService.initialize();

const initApp = () => {
  return new Promise<Express>((resolve, reject) => {
    Promise.all([
      mongoManager.connect(),
      neo4jManager.connect()
    ])
    .then(() => {
      console.log('All database connections established successfully');
      resolve(app);
    })
    .catch((error) => {
      console.error('Failed to initialize databases:', error);
      reject(error);
    });
  });
};

export default initApp;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database connections...');
  await Promise.all([
    mongoManager.disconnect(),
    neo4jManager.disconnect()
  ]);
  await Neo4jService.close();
  process.exit(0);
}); 
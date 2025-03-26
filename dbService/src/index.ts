import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import MongoDBManager from './config/mongodb';
import Neo4jManager from './config/neo4j';
import awsConnectionRoutes from './routes/awsConnection.routes';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const app = express();
const port = process.env.PORT || 4003;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser()); // Add cookie-parser middleware

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

// Initialize database connections
const mongoManager = MongoDBManager.getInstance();
const neo4jManager = Neo4jManager.getInstance();

// Connect to databases on startup
async function initializeDatabases() {
  try {
    await Promise.all([
      mongoManager.connect(),
      neo4jManager.connect()
    ]);
    console.log('All database connections established successfully');
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// AWS Connection routes
app.use('/aws-connections', awsConnectionRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Database service running on port ${port}`);
  initializeDatabases();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database connections...');
  await Promise.all([
    mongoManager.disconnect(),
    neo4jManager.disconnect()
  ]);
  process.exit(0);
}); 
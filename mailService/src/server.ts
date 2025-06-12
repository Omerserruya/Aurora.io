import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { mailRoutes } from './routes/mail.routes';

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

app.use('/api/mail', mailRoutes); 

const initApp = () => {
  return new Promise<Express>((resolve) => {
    console.log('Mail service initialized successfully');
    console.log('Note: Mail service is internal-only, accessible only by user service');
    resolve(app);
  });
};

export default initApp; 
import express from 'express';
import cors from 'cors';
import { environment } from './config/environment';
import chatbotRoutes from './routes/chatbotRoutes';

const app = express();
app.use(cors());
app.use(express.json());

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

// Start server
const PORT = environment.port;
const server = app.listen(PORT, () => {
  console.log(`Chatbot service running on port ${PORT} in ${environment.nodeEnv} mode`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app; 
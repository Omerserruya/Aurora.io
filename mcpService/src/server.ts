import express, { Express } from 'express';
import cors from 'cors';
import { environment } from './config/environment';
import mcpRoutes from './routes/mcpRoutes';
import logger from './utils/logger';

class Server {
  private app: Express;
  
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  private setupMiddleware(): void {
    // CORS setup
    const corsOptions = {
      origin: '*', // In production, this should be restricted
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
    
    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    
    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`);
      next();
    });
  }
  
  private setupRoutes(): void {
    // API routes
    this.app.use('/api/mcp', mcpRoutes);
    
    // Root health check
    this.app.get('/', (req, res) => {
      res.status(200).json({ message: 'MCP Service is running' });
    });
    
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }
  
  public start(): void {
    const port = environment.port;
    
    this.app.listen(port, () => {
      logger.info(`MCP Service is running on port ${port}`);
      logger.info(`Environment: ${environment.nodeEnv}`);
    });
  }
}

export default Server; 
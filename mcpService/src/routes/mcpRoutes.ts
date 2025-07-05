import { Router } from 'express';
import { mcpController } from '../controllers/mcpController';

const router = Router();

// Process a query
router.post('/query', mcpController.processQuery);

// Health check endpoint
router.get('/health', mcpController.healthCheck);

export default router; 
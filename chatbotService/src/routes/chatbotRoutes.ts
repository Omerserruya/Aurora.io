import { Router } from 'express';
import { chatbotController } from '../controllers/chatbotController';

const router = Router();

// Health check endpoint
router.get('/health', chatbotController.healthCheck);

// Process user query endpoint
router.post('/query', chatbotController.processQuery);

export default router; 
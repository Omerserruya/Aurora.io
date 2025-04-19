import { Router } from 'express';
import { chatbotController } from '../controllers/chatbotController';

const router = Router();

// Health check endpoint
router.get('/health', chatbotController.healthCheck);

// Process user query endpoint - now uses userId and connectionId as URL parameters
router.post('/query/:userId/:connectionId', chatbotController.processQuery);

export default router; 
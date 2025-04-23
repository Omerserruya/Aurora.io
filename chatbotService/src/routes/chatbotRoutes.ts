import { Router } from 'express';
import { chatbotController } from '../controllers/chatbotController';
import { authentification } from '../shared/authMiddleware';

const router = Router();

// Health check endpoint - publicly accessible
router.get('/health', chatbotController.healthCheck);

// Process user query endpoint - protected by authentication
router.post('/query/:userId/:connectionId', authentification, chatbotController.processQuery);

export default router; 
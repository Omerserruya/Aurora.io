import express from 'express';
import { getRecommendations } from '../controllers/aiRecommendations.controller';

const router = express.Router();

// REST endpoint for AI recommendations
router.get('/', getRecommendations);

export default router; 
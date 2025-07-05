import express from 'express';
import { getResourceMetrics, getResourceDetails } from '../controllers/resourceMetrics.controller';

const router = express.Router();

// Get resource metrics for a specific user and connection
router.get('/metrics', getResourceMetrics);

// Get detailed resource information
router.get('/details', getResourceDetails);

export default router; 
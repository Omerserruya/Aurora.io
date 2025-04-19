import { Router } from 'express';
import { CloudArchitectureController } from '../controllers/cloudArchitecture.controller';

const router = Router();

// Get cloud architecture data for a specific user
router.get('/cloud-data/:userId', CloudArchitectureController.getUserCloudData);

// Insert sample cloud architecture data for a specific user
router.post('/cloud-data/:userId/sample', CloudArchitectureController.insertSampleData);
router.post('/cloud-data/:userId/sample-azure', CloudArchitectureController.insertSampleAzureData);

export default router;
import { Router } from 'express';
import { processCloudQueryResults, getInfrastructureData, getTerraformInfrastructureData, getInfrastructureDataWithUserId } from '../controllers/cloudQueryResults.controller';
import authentification from '@/shared/authMiddleware';

const router = Router();

router.post('/cloud-query-results', processCloudQueryResults);
router.get('/cloud-query-results/:userId/:connectionId', getInfrastructureDataWithUserId);
router.get('/tf-query-results/:userId/:connectionId', getTerraformInfrastructureData);
router.get('/visualization/:connectionId', authentification, getInfrastructureData);

export default router; 
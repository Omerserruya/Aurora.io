import { Router } from 'express';
import { processCloudQueryResults, getInfrastructureData, getTerraformInfrastructureData } from '../controllers/cloudQueryResults.controller';
import authentification from '@/shared/authMiddleware';

const router = Router();

router.post('/cloud-query-results', processCloudQueryResults);
router.get('/cloud-query-results/:connectionId', authentification, getInfrastructureData);
router.get('/tf-query-results/:userId/:connectionId', getTerraformInfrastructureData);

export default router; 
import { Router } from 'express';
import { processCloudQueryResults, getInfrastructureData } from '../controllers/cloudQueryResults.controller';

const router = Router();

router.post('/cloud-query-results', processCloudQueryResults);
router.get('/cloud-query-results/:userId/:connectionId', getInfrastructureData);
router.get('/tf-query-results/:userId/:connectionId', getInfrastructureData);

export default router; 
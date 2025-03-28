import { Router } from 'express';
import { CloudQueryController } from '../controllers/cloudQueryController';

const router = Router();
const controller = new CloudQueryController();

router.post('/validate', controller.validate.bind(controller));
router.post('/query', controller.query.bind(controller));
router.get('/status', controller.getStatus.bind(controller));

export const cloudQueryRoutes = router; 
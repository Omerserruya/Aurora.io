import { Router } from 'express';
import { CloudQueryController } from '../controllers/cloudQueryController';
import { authentification } from '../shared/authMiddleware';

const router = Router();
const controller = new CloudQueryController();

router.post('/validate',authentification,  controller.validate.bind(controller));
router.post('/query', authentification, controller.query.bind(controller));
router.get('/status',controller.getStatus.bind(controller));

export const cloudQueryRoutes = router; 
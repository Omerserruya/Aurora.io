import { Router } from 'express';
import { MailController } from '../controllers/mail.controller';
import { internalServiceMiddleware } from '../shared/authMiddleware';

const router = Router();
const mailController = new MailController();

// Send email endpoint - Internal service only
router.post('/send', internalServiceMiddleware, mailController.sendEmail);

// Send template email endpoint - Internal service only
router.post('/send-template', internalServiceMiddleware, mailController.sendTemplateEmail);

export const mailRoutes = router; 
import { Router } from 'express';
import { MailController } from '../controllers/mail.controller';

const router = Router();
const mailController = new MailController();

// Send email endpoint
router.post('/send', mailController.sendEmail);

// Send template email endpoint
router.post('/send-template', mailController.sendTemplateEmail);

export const mailRoutes = router; 
import { Request, Response } from 'express';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import { TemplateService } from '../services/template.service';

export class MailController {
  private brevoApiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private templateService: TemplateService;

  constructor() {
    this.templateService = new TemplateService();

    const apiKey = process.env.MAIL_API_KEY;
    
    if (!apiKey) {
      throw new Error('MAIL_API_KEY environment variable is required');
    }

    console.log('Initializing mail controller with Brevo API');
    
    // Initialize Brevo API following official documentation
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKeyAuth = defaultClient.authentications['api-key'];
    apiKeyAuth.apiKey = apiKey;
    this.brevoApiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    }

  sendTemplateEmail = async (req: Request, res: Response) => {
    try {
      const { to, subject, template, context } = req.body;

      if (!to || !subject || !template || !context) {
        return res.status(400).json({ 
          error: 'Missing required fields: to, subject, template, and context are required' 
        });
      }

      // Render the template
      const html = await this.templateService.render(template, context);

      // Use Brevo API
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.sender = {
          name: 'Aurora.io',
        email: process.env.FROM_EMAIL || 'auroraioapp@gmail.com'
      };
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;

      const result = await this.brevoApiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Template email sent successfully via API:', result.body?.messageId || 'success');
      
      res.status(200).json({ 
        message: 'Email sent successfully',
        messageId: result.body?.messageId || 'sent'
      });
    } catch (error) {
      console.error('Failed to send template email:', error);
      res.status(500).json({ 
        error: 'Failed to send template email',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
} 
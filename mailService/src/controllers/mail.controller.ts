import { Request, Response } from 'express';
import { TransactionalEmailsApi, ApiClient, SendSmtpEmail } from 'sib-api-v3-sdk';
import { TemplateService } from '../services/template.service';

export class MailController {
  private brevoApiInstance: TransactionalEmailsApi;
  private templateService: TemplateService;

  constructor() {
    this.templateService = new TemplateService();

    const apiKey = process.env.MAIL_API_KEY;
    
    if (!apiKey) {
      throw new Error('MAIL_API_KEY environment variable is required');
    }
    
    // Initialize Brevo API following official documentation
    const defaultClient = ApiClient.instance;
    const apiKeyAuth = defaultClient.authentications['api-key'];
    apiKeyAuth.apiKey = apiKey;
    this.brevoApiInstance = new TransactionalEmailsApi();
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
      let html: string;
      try {
        html = await this.templateService.render(template, context);
      } catch (error) {
        console.error(`Template rendering failed for '${template}':`, error instanceof Error ? error.message : error);
        return res.status(500).json({ 
          error: 'Template rendering failed',
          details: `Could not render template '${template}': ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // Use Brevo API
      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.sender = {
          name: 'Aurora.io',
        email: process.env.FROM_EMAIL || 'auroraioapp@gmail.com'
      };
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;

      try {
        const result = await this.brevoApiInstance.sendTransacEmail(sendSmtpEmail);
        
        res.status(200).json({ 
          message: 'Email sent successfully',
          messageId: result.body?.messageId || 'sent'
        });
      } catch (error) {
        console.error(`Brevo API call failed for email to '${to}':`, error instanceof Error ? error.message : error);
        return res.status(500).json({ 
          error: 'Email delivery failed',
          details: `Brevo API error sending to '${to}': ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error(`Unexpected error in sendTemplateEmail:`, error instanceof Error ? error.message : error);
      
      res.status(500).json({ 
        error: 'Unexpected email service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
} 
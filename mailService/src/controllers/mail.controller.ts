import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { TemplateService } from '../services/template.service';

export class MailController {
  private transporter: nodemailer.Transporter;
  private templateService: TemplateService;

  constructor() {
    console.log('Initializing mail controller with credentials:', {
      user: process.env.BREVO_USER ? '***' : 'missing',
      pass: process.env.BREVO_PASS ? '***' : 'missing',
      from: process.env.FROM_EMAIL || 'missing'
    });

    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
      }
    });

    this.templateService = new TemplateService();
  }

  sendEmail = async (req: Request, res: Response) => {
    try {
      console.log('Received email request:', {
        body: req.body,
        headers: req.headers
      });

      const { to, subject, html } = req.body;

      if (!to || !subject || !html) {
        console.log('Missing required fields:', { to, subject, html });
        return res.status(400).json({ 
          error: 'Missing required fields: to, subject, and html are required' 
        });
      }

      const mailOptions = {
        from: {
          name: 'Aurora.io',
          address: process.env.FROM_EMAIL || 'easyflightcustomers@gmail.com'
        },
        to,
        subject,
        html
      };

      console.log('Attempting to send email with options:', {
        ...mailOptions,
        from: process.env.FROM_EMAIL ? '***' : 'missing'
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      res.status(200).json({ 
        message: 'Email sent successfully',
        messageId: info.messageId
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      res.status(500).json({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

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

      // Send the email
      const mailOptions = {
        from: {
          name: 'Aurora.io',
          address: process.env.FROM_EMAIL || 'easyflightcustomers@gmail.com'
        },
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Template email sent successfully:', info.messageId);
      
      res.status(200).json({ 
        message: 'Email sent successfully',
        messageId: info.messageId
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
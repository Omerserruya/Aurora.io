import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import mjml2html from 'mjml';

export class TemplateService {
  private templates: Map<string, string> = new Map();

  constructor() {
    try {
      // Load all templates on startup
      const templatesDir = path.join(__dirname, '../templates');
      const files = fs.readdirSync(templatesDir);
      
      files.forEach(file => {
        if (file.endsWith('.mjml')) {
          const templateName = path.basename(file, '.mjml');
          const templateContent = fs.readFileSync(
            path.join(templatesDir, file),
            'utf-8'
          );
          this.templates.set(templateName, templateContent);
        }
      });
    } catch (error) {
      console.error('Error initializing TemplateService:', error);
      throw error;
    }
  }

  async render(templateName: string, data: any): Promise<string> {
    try {
      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Convert MJML to HTML
      const { html, errors } = mjml2html(template);
      
      if (errors && errors.length > 0) {
        console.error('MJML conversion errors:', errors);
      }

      // Render with Handlebars
      const compiledTemplate = handlebars.compile(html);
      return compiledTemplate(data);
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      throw error;
    }
  }
} 
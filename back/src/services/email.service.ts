import { emailProvider } from '@/config/email';
import { EmailOptions, EmailResult, EmailTemplateData, SendEmailWithTemplateOptions } from '@/types';
import { readFileSync } from 'fs';
import { join } from 'path';

class EmailService {
  private templatesPath: string;

  constructor() {
     
    this.templatesPath = join(__dirname, '../templates/emails');
  }

   
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    return await emailProvider.sendEmail(options);
  }

   
  async sendEmailWithTemplate(options: SendEmailWithTemplateOptions): Promise<EmailResult> {
    try {
       
      const html = this.loadTemplate(options.templateName, options.data);

       
      return await emailProvider.sendEmail({
        to: options.to,
        subject: options.subject,
        html,
        from: options.from,
        replyTo: options.replyTo,
        attachments: options.attachments,
      });
    } catch (error: any) {
      console.error('Error al enviar email con plantilla:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

   
  private loadTemplate(templateName: string, data: EmailTemplateData): string {
    try {
       
      const templatePath = join(this.templatesPath, `${templateName}.html`);
      let html = readFileSync(templatePath, 'utf-8');

       
      html = this.replaceVariables(html, data);

      return html;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Plantilla de email no encontrada: ${templateName}`);
      }
      throw error;
    }
  }

   
  private replaceVariables(html: string, data: EmailTemplateData): string {
    let result = html;

     
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const value = data[key];
      result = result.replace(regex, value !== undefined ? String(value) : '');
    });

     
    result = result.replace(/{{.*?}}/g, '');

    return result;
  }

   

  async sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
    return this.sendEmailWithTemplate({
      to,
      subject: '¡Bienvenido a Bunker App!',
      templateName: 'welcome',
      data: { email: to, name },
    });
  }

  previewTemplate(templateName: string, data: EmailTemplateData): string {
    return this.loadTemplate(templateName, data);
  }
}

 
export const emailService = new EmailService();


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
  async sendPaymentResponsibilityAssignedEmail(
    user: { email: string; name: string },
    business: { name: string }
  ): Promise<EmailResult> {
    return this.sendEmailWithTemplate({
      to: user.email,
      subject: `Ahora eres responsable de pagos - ${business.name}`,
      templateName: 'notification',
      data: {
        email: user.email,
        title: 'Responsable de Pagos Asignado',
        adminName: user.name,
        businessName: business.name,
        message: `Has sido designado como responsable de los pagos de <strong>${business.name}</strong>. A partir de ahora, recibirás todas las notificaciones relacionadas con pagos y suscripciones.`,
        actionUrl: process.env.APP_URL || '',
        actionText: 'Ir a Configuración',
      },
    });
  }
  async sendPaymentResponsibilityRemovedEmail(
    user: { email: string; name: string },
    business: { name: string }
  ): Promise<EmailResult> {
    return this.sendEmailWithTemplate({
      to: user.email,
      subject: `Ya no eres responsable de pagos - ${business.name}`,
      templateName: 'notification',
      data: {
        email: user.email,
        title: 'Responsable de Pagos Removido',
        adminName: user.name,
        businessName: business.name,
        message: `Ya no eres el responsable de los pagos de <strong>${business.name}</strong>. Otro administrador ha sido designado para esta función.`,
        actionUrl: process.env.APP_URL || '',
        actionText: 'Ir a Configuración',
      },
    });
  }
  async sendPaymentWebhookNotificationEmail(
    user: { email: string; name: string },
    business: { name: string },
    paymentStatus: string,
    paymentData: {
      amount: number;
      date: Date;
      statusMessage: string;
      actionRequired?: string;
    }
  ): Promise<EmailResult> {
    const statusEmoji: Record<string, string> = {
      PAID: '✅',
      PENDING: '⏳',
      FAILED: '❌',
      CANCELLED: '🚫',
      REFUNDED: '↩️',
    };
    const statusMessages: Record<string, string> = {
      PAID: 'Pago aprobado exitosamente',
      PENDING: 'Pago pendiente de confirmación',
      FAILED: 'Pago rechazado - Acción requerida',
      CANCELLED: 'Pago cancelado por el usuario',
      REFUNDED: 'Pago reembolsado',
    };
    const emoji = statusEmoji[paymentStatus] || '📧';
    const subject = `${emoji} ${statusMessages[paymentStatus] || 'Notificación de pago'} - ${business.name}`;
    return this.sendEmailWithTemplate({
      to: user.email,
      subject,
      templateName: 'notification',
      data: {
        email: user.email,
        title: statusMessages[paymentStatus] || 'Notificación de Pago',
        adminName: user.name,
        businessName: business.name,
        message: `
          <p><strong>Estado:</strong> ${paymentData.statusMessage}</p>
          <p><strong>Monto:</strong> $${paymentData.amount.toLocaleString('es-AR')}</p>
          <p><strong>Fecha:</strong> ${paymentData.date.toLocaleString('es-AR')}</p>
          ${paymentData.actionRequired ? `<p style="color: #ef4444; font-weight: bold;">${paymentData.actionRequired}</p>` : ''}
        `,
        actionUrl: `${process.env.APP_URL}/configuracion`,
        actionText: 'Ver Detalles',
      },
    });
  }
  previewTemplate(templateName: string, data: EmailTemplateData): string {
    return this.loadTemplate(templateName, data);
  }
}
export const emailService = new EmailService();

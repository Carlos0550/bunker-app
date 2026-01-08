
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  previewUrl?: string;  
}

export interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
}

export interface EmailTemplateData {
  email: string;  
  name?: string;
  [key: string]: any;  
}

export interface SendEmailWithTemplateOptions {
  to: string | string[];
  subject: string;
  templateName: string;
  data: EmailTemplateData;
  from?: string;
  replyTo?: string;
  attachments?: EmailOptions['attachments'];
}
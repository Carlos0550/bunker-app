import { env } from "@/config/env";
import axios, { AxiosInstance } from "axios";


export interface WhatsAppMessage {
  to: string; 
  message: string;
  mediaUrl?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}


export interface WhatsAppProvider {
  sendMessage(msg: WhatsAppMessage): Promise<WhatsAppResponse>;
  sendTemplate(to: string, templateName: string, params: Record<string, string>): Promise<WhatsAppResponse>;
}




class WasenderAPIProvider implements WhatsAppProvider {
  private client: AxiosInstance;

  constructor() {
    if (!env.WASENDER_API_KEY || !env.WASENDER_API_URL) {
      throw new Error("WasenderAPI requiere WASENDER_API_KEY y WASENDER_API_URL");
    }

    this.client = axios.create({
      baseURL: env.WASENDER_API_URL,
      headers: {
        Authorization: `Bearer ${env.WASENDER_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }

  async sendMessage(msg: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const response = await this.client.post("/messages/send", {
        phone: msg.to,
        message: msg.message,
        mediaUrl: msg.mediaUrl,
      });

      return {
        success: true,
        messageId: response.data.messageId,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<WhatsAppResponse> {
    try {
      const response = await this.client.post("/messages/template", {
        phone: to,
        template: templateName,
        params,
      });

      return {
        success: true,
        messageId: response.data.messageId,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}




class BaileysProvider implements WhatsAppProvider {
  
  

  async sendMessage(msg: WhatsAppMessage): Promise<WhatsAppResponse> {
    console.log(`[BAILEYS DEV] Enviando mensaje a ${msg.to}: ${msg.message}`);

    
    
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  async sendTemplate(
    to: string,
    templateName: string,
    params: Record<string, string>
  ): Promise<WhatsAppResponse> {
    console.log(`[BAILEYS DEV] Enviando template "${templateName}" a ${to}`, params);

    return {
      success: true,
      messageId: `dev-template-${Date.now()}`,
    };
  }
}




function createWhatsAppProvider(): WhatsAppProvider {
  if (env.NODE_ENV === "production") {
    return new WasenderAPIProvider();
  }

  
  console.log("📱 WhatsApp: Usando Baileys (modo desarrollo)");
  return new BaileysProvider();
}


export const whatsapp = createWhatsAppProvider();


export { WasenderAPIProvider, BaileysProvider };



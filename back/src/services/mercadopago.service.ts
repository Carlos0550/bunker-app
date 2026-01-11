import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";
import crypto from "crypto";

// Función para obtener el cliente de Mercado Pago con validación
function getMercadoPagoClient() {
  let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  // Limpiar comillas y espacios si están presentes
  if (accessToken) {
    accessToken = accessToken.trim().replace(/^["']|["']$/g, "");
  }
  
  if (!accessToken) {
    console.error("❌ MERCADOPAGO_ACCESS_TOKEN no está configurado o está vacío");
    console.error("Valor actual:", process.env.MERCADOPAGO_ACCESS_TOKEN);
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN no está configurado. " +
      "Por favor, configura esta variable de entorno con tu Access Token de Mercado Pago."
    );
  }

  // Log solo en desarrollo para no exponer el token completo
  if (process.env.NODE_ENV === "development") {
    console.log("✅ MERCADOPAGO_ACCESS_TOKEN cargado correctamente");
    console.log("   Longitud:", accessToken.length);
    console.log("   Prefijo:", accessToken.substring(0, 10) + "...");
    console.log("   Tiene espacios:", accessToken.includes(" "));
    console.log("   Tiene comillas:", accessToken.includes('"') || accessToken.includes("'"));
  }

  // Verificar formato del token
  if (!accessToken.startsWith("TEST-") && !accessToken.startsWith("APP_USR-")) {
    console.warn("⚠️ El token no tiene el formato esperado. Debe comenzar con 'TEST-' (prueba) o 'APP_USR-' (producción)");
  }

  // Crear configuración del cliente
  const config = {
    accessToken: accessToken,
    options: {
      timeout: 5000,
      idempotencyKey: "abc",
    },
  };

  // Verificar que el token se pasó correctamente
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Creando cliente MercadoPagoConfig:");
    console.log("   Token longitud:", config.accessToken.length);
    console.log("   Token prefijo:", config.accessToken.substring(0, 10));
    console.log("   Token completo (primeros 20 chars):", config.accessToken.substring(0, 20));
  }

  try {
    const client = new MercadoPagoConfig(config);
    
    // Verificar que el cliente se creó correctamente
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Cliente MercadoPagoConfig creado exitosamente");
    }

    return client;
  } catch (error: any) {
    console.error("❌ Error al crear cliente MercadoPagoConfig:", error);
    throw new Error(`Error al inicializar cliente de Mercado Pago: ${error.message}`);
  }
}

class MercadoPagoService {
  /**
   * Validar la firma del webhook de Mercado Pago
   */
  validateWebhookSignature(
    signature: string,
    requestId: string,
    dataId: string
  ): boolean {
    let secretKey = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    // Limpiar comillas y espacios si están presentes
    if (secretKey) {
      secretKey = secretKey.trim().replace(/^["']|["']$/g, "");
    }
    
    if (!secretKey) {
      console.warn("MERCADOPAGO_WEBHOOK_SECRET no configurado, saltando validación");
      return true; // En desarrollo, permitir sin validación si no está configurado
    }

    try {
      // Parsear el header x-signature: "ts=<timestamp>,v1=<hash>"
      const signatureParts = signature.split(",");
      const tsMatch = signatureParts.find((part) => part.startsWith("ts="));
      const v1Match = signatureParts.find((part) => part.startsWith("v1="));

      if (!tsMatch || !v1Match) {
        console.error("Formato de firma inválido:", signature);
        return false;
      }

      const ts = tsMatch.split("=")[1];
      const v1 = v1Match.split("=")[1];

      // Construir el template de firma
      const signatureTemplate = `id:${dataId};request-id:${requestId};ts:${ts};`;

      // Generar HMAC SHA-256
      const generatedSignature = crypto
        .createHmac("sha256", secretKey)
        .update(signatureTemplate)
        .digest("hex");

      // Comparar firmas
      const isValid = generatedSignature === v1;

      if (!isValid) {
        console.error("Firma de webhook inválida", {
          expected: v1,
          generated: generatedSignature,
          template: signatureTemplate,
        });
      }

      return isValid;
    } catch (error) {
      console.error("Error validando firma del webhook:", error);
      return false;
    }
  }

  /**
   * Crear una preferencia de pago para una suscripción
   */
  async createPaymentPreference(data: {
    businessId: string;
    planId: string;
    amount: number;
    description: string;
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
  }) {
    try {
      const client = getMercadoPagoClient();
      const preferenceClient = new Preference(client);

      const business = await prisma.business.findUnique({
        where: { id: data.businessId },
        include: { businessPlan: true },
      });

      if (!business) {
        throw createHttpError(404, "Negocio no encontrado");
      }

      // Validar datos antes de crear la preferencia
      if (data.amount <= 0) {
        throw createHttpError(400, "El monto debe ser mayor a 0");
      }

      // Preparar datos del payer (algunos campos pueden ser opcionales)
      const payerData: any = {
        name: business.name || "Cliente",
      };

      if (business.contact_email) {
        payerData.email = business.contact_email;
      }

      if (business.contact_phone) {
        payerData.phone = {
          number: business.contact_phone.replace(/\D/g, ""), // Solo números
        };
      }

      // Construir el body de la preferencia (estructura mínima requerida)
      // Empezamos con lo mínimo absoluto y agregamos campos opcionales después
      const preferenceBody: any = {
        items: [
          {
            title: `Suscripción ${business.businessPlan?.name || "Plan"}`.substring(0, 127),
            quantity: 1,
            unit_price: Number(data.amount.toFixed(2)), // Asegurar 2 decimales
          },
        ],
      };

      // Agregar campos opcionales solo si son válidos
      if (data.planId) {
        preferenceBody.items[0].id = data.planId.substring(0, 50);
      }

      if (data.description) {
        preferenceBody.items[0].description = data.description.substring(0, 256);
      }

      // Agregar payer solo si tiene datos mínimos válidos
      if (payerData.name || payerData.email) {
        preferenceBody.payer = {};
        if (payerData.name) {
          preferenceBody.payer.name = payerData.name;
        }
        if (payerData.email) {
          preferenceBody.payer.email = payerData.email;
        }
        if (payerData.phone?.number) {
          preferenceBody.payer.phone = payerData.phone;
        }
      }

      // Agregar back_urls solo si todas las URLs son válidas
      if (data.successUrl && data.failureUrl && data.pendingUrl) {
        preferenceBody.back_urls = {
          success: data.successUrl,
          failure: data.failureUrl,
          pending: data.pendingUrl,
        };
        
        // auto_return solo funciona con URLs públicas (no localhost)
        // Mercado Pago rechaza auto_return con URLs de localhost
        const isLocalhost = data.successUrl.includes("localhost") || 
                           data.successUrl.includes("127.0.0.1") ||
                           data.successUrl.includes("0.0.0.0");
        
        if (!isLocalhost) {
          preferenceBody.auto_return = "approved";
        }
      }

      // Agregar external_reference solo si es válido
      if (data.businessId) {
        preferenceBody.external_reference = data.businessId;
      }

      // Agregar metadata solo si tiene datos válidos
      if (data.businessId && data.planId) {
        preferenceBody.metadata = {
          businessId: data.businessId,
          planId: data.planId,
        };
      }

      // NO agregar notification_url en modo desarrollo/localhost (puede causar 403)
      // Solo agregarlo si es una URL pública válida
      const notificationUrl = `${process.env.APP_URL || process.env.BACKEND_URL || ""}/api/subscription/mercadopago/webhook`;
      if (notificationUrl && 
          notificationUrl.startsWith("https://") && 
          !notificationUrl.includes("localhost") && 
          !notificationUrl.includes("127.0.0.1") &&
          !notificationUrl.includes("0.0.0.0")) {
        preferenceBody.notification_url = notificationUrl;
      }

      // NO agregar statement_descriptor por ahora (puede causar problemas en sandbox)
      // preferenceBody.statement_descriptor = "BUNKER SUSCRIPCION".substring(0, 22);

      console.log("📤 Creando preferencia en Mercado Pago con:", {
        items: preferenceBody.items.length,
        amount: preferenceBody.items[0].unit_price,
        currency: preferenceBody.items[0].currency_id,
        hasPayerEmail: !!payerData.email,
        hasPayerName: !!payerData.name,
        hasNotificationUrl: !!preferenceBody.notification_url,
        hasBackUrls: !!preferenceBody.back_urls,
        externalReference: preferenceBody.external_reference,
      });

      // Log completo del body en desarrollo (sin datos sensibles)
      if (process.env.NODE_ENV === "development") {
        console.log("📋 Body completo de la preferencia:", JSON.stringify(preferenceBody, null, 2));
      }

      // Crear preferencia en Mercado Pago
      const preferenceData = await preferenceClient.create({
        body: preferenceBody,
      });

      return {
        preferenceId: preferenceData.id,
        initPoint: preferenceData.init_point,
        sandboxInitPoint: preferenceData.sandbox_init_point,
      };
    } catch (error: any) {
      console.error("Error creating Mercado Pago preference:", {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        code: error.code,
        blocked_by: error.blocked_by,
        cause: error.cause,
      });
      
      // Mensaje de error más descriptivo según el tipo de error
      if (error.status === 401 || error.statusCode === 401 || error.message?.includes("access_token")) {
        throw createHttpError(
          500,
          "Error de autenticación con Mercado Pago. Verifica que MERCADOPAGO_ACCESS_TOKEN esté configurado correctamente y sea válido."
        );
      }
      
      if (error.status === 403 || error.statusCode === 403 || error.code === "PA_UNAUTHORIZED_RESULT_FROM_POLICIES") {
        console.error("❌ Error 403 - Detalles adicionales:", {
          errorResponse: error.response?.data || error.response || "No hay respuesta adicional",
          requestId: error.requestId,
          apiResponse: error.apiResponse,
        });
        
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        console.error("🔍 Información del token:", {
          tokenExists: !!token,
          tokenLength: token?.length,
          tokenPrefix: token?.substring(0, 10),
          isTestToken: token?.startsWith("TEST-"),
          isProdToken: token?.startsWith("APP_USR-"),
        });
        
        throw createHttpError(
          403,
          "Error de permisos con Mercado Pago (403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES).\n\n" +
          "Posibles causas:\n" +
          "1. Tu aplicación de Mercado Pago no tiene permisos para crear preferencias\n" +
          "2. El Access Token está expirado o es inválido\n" +
          "3. El token no corresponde al entorno correcto (TEST- para pruebas, APP_USR- para producción)\n\n" +
          "Solución:\n" +
          "1. Ve a https://www.mercadopago.com.ar/developers/panel/app\n" +
          "2. Selecciona tu aplicación\n" +
          "3. Verifica que tenga permisos para 'Crear preferencias de pago'\n" +
          "4. Regenera el Access Token si es necesario\n" +
          "5. Actualiza MERCADOPAGO_ACCESS_TOKEN en tu archivo .env"
        );
      }
      
      if (error.status === 400 || error.statusCode === 400) {
        throw createHttpError(400, `Error en los datos de la preferencia: ${error.message}`);
      }
      
      throw createHttpError(500, `Error al crear preferencia de pago: ${error.message || "Error desconocido"}`);
    }
  }

  /**
   * Procesar webhook de Mercado Pago
   */
  async processWebhook(data: any, signature?: string, requestId?: string) {
    try {
      // Mercado Pago puede enviar el webhook en diferentes formatos
      let paymentId: string | undefined;
      let dataId: string | undefined;
      
      if (data.type === "payment") {
        // Formato estándar: { type: "payment", data: { id: "..." } }
        paymentId = data.data?.id;
        dataId = data.data?.id;
      } else if (data.action === "payment.created" || data.action === "payment.updated") {
        // Formato alternativo: { action: "payment.updated", data: { id: "..." } }
        paymentId = data.data?.id;
        dataId = data.data?.id;
      } else if (data.id) {
        // Formato directo: { id: "...", ... }
        paymentId = data.id;
        dataId = data.id;
      }

      if (!paymentId) {
        console.warn("Webhook recibido sin payment ID:", JSON.stringify(data));
        return { processed: false, message: "No se encontró payment ID en el webhook" };
      }

      // Validar firma si está disponible
      if (signature && requestId && dataId) {
        const isValid = this.validateWebhookSignature(signature, requestId, dataId);
        if (!isValid) {
          console.error("Webhook rechazado: firma inválida");
          return { processed: false, error: "Firma de webhook inválida" };
        }
      }

      return await this.processPayment(paymentId);
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      // No lanzar error para que Mercado Pago no reintente infinitamente
      return { processed: false, error: error.message };
    }
  }

  /**
   * Procesar un pago específico
   */
  async processPayment(paymentId: string) {
    try {
      console.log(`🔍 Procesando pago con ID: ${paymentId}`);
      
      const client = getMercadoPagoClient();
      
      // Verificar que el cliente tenga el access token
      if (process.env.NODE_ENV === "development") {
        // El cliente no expone directamente el token, pero podemos verificar que se creó
        console.log("📦 Cliente de Mercado Pago creado, inicializando Payment client...");
      }
      
      const paymentClient = new Payment(client);

      console.log(`📞 Llamando a Mercado Pago API para obtener pago ${paymentId}...`);
      
      // Validar formato del ID de pago (debe ser numérico y tener al menos 6 dígitos)
      // Nota: Los IDs de prueba como "123456" no existen en Mercado Pago
      if (!/^\d{6,}$/.test(paymentId)) {
        console.warn(`⚠️ ID de pago inválido: ${paymentId}. Los IDs de Mercado Pago son numéricos y tienen al menos 6 dígitos.`);
        throw createHttpError(400, `ID de pago inválido: ${paymentId}. Debe ser un número de al menos 6 dígitos.`);
      }
      
      // Advertencia para IDs de prueba comunes que no existen
      if (paymentId === "123456" || paymentId === "1234567890") {
        console.warn(`⚠️ Estás usando un ID de prueba inválido (${paymentId}). ` +
          `Este ID no existe en Mercado Pago. Para probar, necesitas crear un pago real o usar un ID de pago válido.`);
      }
      
      // Obtener información del pago desde Mercado Pago
      let paymentData;
      try {
        paymentData = await paymentClient.get({ id: paymentId });
        console.log(`✅ Pago obtenido exitosamente. Estado: ${paymentData.status}`);
      } catch (apiError: any) {
        console.error("Error al obtener pago de Mercado Pago:", {
          status: apiError.status,
          statusCode: apiError.statusCode,
          message: apiError.message,
          error: apiError.error,
        });
        
        // Si el error es 404, el pago no existe (puede ser un ID de prueba inválido)
        if (apiError.status === 404 || apiError.statusCode === 404) {
          console.warn(`⚠️ Pago ${paymentId} no encontrado en Mercado Pago (puede ser un ID de prueba inválido)`);
          throw createHttpError(404, `Pago ${paymentId} no encontrado en Mercado Pago`);
        }
        
        // Si el error es 401, hay un problema con el token
        if (apiError.status === 401 || apiError.statusCode === 401) {
          console.error("❌ Error 401: Problema de autenticación con Mercado Pago");
          console.error("   Verifica que el token sea válido y corresponda al entorno correcto (TEST- para pruebas, APP_USR- para producción)");
          throw createHttpError(401, "Error de autenticación con Mercado Pago. Verifica que el access token sea válido.");
        }
        
        // Re-lanzar otros errores
        throw apiError;
      }

      // Obtener businessId desde metadata o external_reference (fallback)
      let businessId = paymentData.metadata?.businessId as string | undefined;
      let planId = paymentData.metadata?.planId as string | undefined;

      // Si no hay metadata, usar external_reference como businessId
      if (!businessId && paymentData.external_reference) {
        businessId = paymentData.external_reference;
        console.log(`📋 Usando external_reference como businessId: ${businessId}`);
      }

      if (!businessId) {
        console.error("❌ El pago no tiene información del negocio:", {
          hasMetadata: !!paymentData.metadata,
          metadataBusinessId: paymentData.metadata?.businessId,
          externalReference: paymentData.external_reference,
        });
        throw createHttpError(400, "El pago no tiene información del negocio");
      }

      // Si no tenemos planId, buscar el plan activo del negocio
      if (!planId) {
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          select: { businessPlanId: true },
        });
        
        if (business?.businessPlanId) {
          planId = business.businessPlanId;
          console.log(`📋 Usando plan del negocio: ${planId}`);
        }
      }

      // Buscar si ya existe un registro de pago con este payment_id
      const existingPayment = await prisma.paymentHistory.findFirst({
        where: {
          mercadoPagoPaymentId: paymentId,
        },
      });

      if (existingPayment) {
        // Actualizar estado si cambió
        if (existingPayment.status !== this.mapMercadoPagoStatus(paymentData.status)) {
          await prisma.paymentHistory.update({
            where: { id: existingPayment.id },
            data: {
              status: this.mapMercadoPagoStatus(paymentData.status),
              mercadoPagoStatus: paymentData.status || undefined,
              mercadoPagoPaymentType: paymentData.payment_type_id || undefined,
            },
          });
        }
        return { processed: true, paymentId: existingPayment.id, updated: true };
      }

      // Si el pago está aprobado, crear el registro
      if (paymentData.status === "approved") {
        // Buscar el plan si tenemos planId
        let plan = null;
        if (planId) {
          plan = await prisma.businessPlan.findUnique({
            where: { id: planId },
          });
        }

        // Si no tenemos plan, buscar el plan activo del sistema
        if (!plan) {
          plan = await prisma.businessPlan.findFirst({
            where: { isActive: true },
            orderBy: { price: "asc" },
          });
          
          if (plan) {
            planId = plan.id;
            console.log(`📋 Usando plan activo por defecto: ${plan.name}`);
          }
        }

        // Calcular fecha del próximo pago (1 mes desde ahora)
        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        // Crear registro de pago
        // Nota: preference_id puede no estar en el tipo TypeScript pero puede existir en la respuesta real
        const preferenceId = (paymentData as any).preference_id || (paymentData as any).order?.id || undefined;
        
        const paymentHistory = await prisma.paymentHistory.create({
          data: {
            businessId,
            amount: paymentData.transaction_amount || plan?.price || 0,
            status: "PAID",
            date: new Date(),
            nextPaymentDate,
            isTrial: false,
            mercadoPagoPreferenceId: preferenceId,
            mercadoPagoPaymentId: paymentId,
            mercadoPagoStatus: paymentData.status || undefined,
            mercadoPagoPaymentType: paymentData.payment_type_id || undefined,
          },
        });

        // Actualizar el plan del negocio si tenemos planId
        if (planId) {
          await prisma.business.update({
            where: { id: businessId },
            data: { businessPlanId: planId },
          });
        }

        // Reactivar usuarios inactivos del negocio (si los hay)
        const reactivatedUsers = await prisma.user.updateMany({
          where: {
            businessId,
            status: "INACTIVE",
          },
          data: {
            status: "ACTIVE",
          },
        });

        if (reactivatedUsers.count > 0) {
          console.log(`✅ Reactivados ${reactivatedUsers.count} usuario(s) del negocio ${businessId}`);
        }

        console.log(`✅ Pago procesado exitosamente: ${paymentHistory.id}`);
        return { processed: true, paymentId: paymentHistory.id, created: true };
      }

      // Si el pago está pendiente, crear registro con estado PENDING
      if (paymentData.status === "pending" || paymentData.status === "in_process") {
        // Nota: preference_id puede no estar en el tipo TypeScript pero puede existir en la respuesta real
        const preferenceId = (paymentData as any).preference_id || (paymentData as any).order?.id || undefined;
        
        const paymentHistory = await prisma.paymentHistory.create({
          data: {
            businessId,
            amount: paymentData.transaction_amount || 0,
            status: "PENDING",
            date: new Date(),
            isTrial: false,
            mercadoPagoPreferenceId: preferenceId,
            mercadoPagoPaymentId: paymentId,
            mercadoPagoStatus: paymentData.status || undefined,
            mercadoPagoPaymentType: paymentData.payment_type_id || undefined,
          },
        });

        return { processed: true, paymentId: paymentHistory.id, created: true, pending: true };
      }

      return { processed: false, message: `Estado de pago no procesado: ${paymentData.status}` };
    } catch (error: any) {
      console.error("Error processing payment:", {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        cause: error.cause,
      });
      
      // Mensaje de error más descriptivo
      if (error.status === 401 || error.statusCode === 401 || error.message?.includes("access_token") || error.message?.includes("unauthorized")) {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        console.error("❌ Error de autenticación detectado");
        console.error("   Token configurado:", !!token);
        console.error("   Longitud del token:", token?.length);
        console.error("   Prefijo del token:", token?.substring(0, 10));
        
        throw createHttpError(
          500,
          "Error de autenticación con Mercado Pago. " +
          "Verifica que MERCADOPAGO_ACCESS_TOKEN esté configurado correctamente y sea válido. " +
          "Si estás usando un token de prueba, asegúrate de que sea válido y no haya expirado."
        );
      }
      
      // Si es un error 404, el pago no existe
      if (error.status === 404 || error.statusCode === 404) {
        throw createHttpError(404, `Pago no encontrado: ${error.message}`);
      }
      
      throw createHttpError(500, `Error al procesar pago: ${error.message}`);
    }
  }

  /**
   * Mapear estado de Mercado Pago a nuestro enum PaymentStatus
   */
  private mapMercadoPagoStatus(status: string | undefined): "PENDING" | "PAID" | "FAILED" {
    switch (status) {
      case "approved":
        return "PAID";
      case "pending":
      case "in_process":
        return "PENDING";
      case "rejected":
      case "cancelled":
      case "refunded":
      case "charged_back":
        return "FAILED";
      default:
        return "PENDING";
    }
  }

  /**
   * Verificar estado de un pago
   */
  async verifyPayment(paymentId: string) {
    try {
      const client = getMercadoPagoClient();
      const paymentClient = new Payment(client);

      const paymentData = await paymentClient.get({ id: paymentId });
      return {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        transaction_amount: paymentData.transaction_amount,
        date_created: paymentData.date_created,
        date_approved: paymentData.date_approved,
      };
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      
      // Mensaje de error más descriptivo
      if (error.status === 401 || error.message?.includes("access_token")) {
        throw createHttpError(
          500,
          "Error de autenticación con Mercado Pago. Verifica que MERCADOPAGO_ACCESS_TOKEN esté configurado correctamente."
        );
      }
      
      throw createHttpError(500, `Error al verificar pago: ${error.message}`);
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();

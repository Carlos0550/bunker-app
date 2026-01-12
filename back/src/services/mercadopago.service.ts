import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";
import crypto from "crypto";
function getMercadoPagoClient() {
  let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
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
  if (process.env.NODE_ENV === "development") {
    console.log("✅ MERCADOPAGO_ACCESS_TOKEN cargado correctamente");
    console.log("   Longitud:", accessToken.length);
    console.log("   Prefijo:", accessToken.substring(0, 10) + "...");
    console.log("   Tiene espacios:", accessToken.includes(" "));
    console.log("   Tiene comillas:", accessToken.includes('"') || accessToken.includes("'"));
  }
  if (!accessToken.startsWith("TEST-") && !accessToken.startsWith("APP_USR-")) {
    console.warn("⚠️ El token no tiene el formato esperado. Debe comenzar con 'TEST-' (prueba) o 'APP_USR-' (producción)");
  }
  const config = {
    accessToken: accessToken,
    options: {
      timeout: 5000,
      idempotencyKey: "abc",
    },
  };
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Creando cliente MercadoPagoConfig:");
    console.log("   Token longitud:", config.accessToken.length);
    console.log("   Token prefijo:", config.accessToken.substring(0, 10));
    console.log("   Token completo (primeros 20 chars):", config.accessToken.substring(0, 20));
  }
  try {
    const client = new MercadoPagoConfig(config);
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
  validateWebhookSignature(
    signature: string,
    requestId: string,
    dataId: string
  ): boolean {
    let secretKey = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secretKey) {
      secretKey = secretKey.trim().replace(/^["']|["']$/g, "");
    }
    if (!secretKey) {
      console.warn("MERCADOPAGO_WEBHOOK_SECRET no configurado, saltando validación");
      return true; 
    }
    try {
      const signatureParts = signature.split(",");
      const tsMatch = signatureParts.find((part) => part.startsWith("ts="));
      const v1Match = signatureParts.find((part) => part.startsWith("v1="));
      if (!tsMatch || !v1Match) {
        console.error("Formato de firma inválido:", signature);
        return false;
      }
      const ts = tsMatch.split("=")[1];
      const v1 = v1Match.split("=")[1];
      const signatureTemplate = `id:${dataId};request-id:${requestId};ts:${ts};`;
      const generatedSignature = crypto
        .createHmac("sha256", secretKey)
        .update(signatureTemplate)
        .digest("hex");
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
      if (data.amount <= 0) {
        throw createHttpError(400, "El monto debe ser mayor a 0");
      }
      const payerData: any = {
        name: business.name || "Cliente",
      };
      if (business.contact_email) {
        payerData.email = business.contact_email;
      }
      if (business.contact_phone) {
        payerData.phone = {
          number: business.contact_phone.replace(/\D/g, ""), 
        };
      }
      const preferenceBody: any = {
        items: [
          {
            title: `${business.businessPlan?.name || "Plan"}`.substring(0, 127),
            quantity: 1,
            unit_price: Number(data.amount.toFixed(2)), 
          },
        ],
      };
      if (data.planId) {
        preferenceBody.items[0].id = data.planId.substring(0, 50);
      }
      if (data.description) {
        preferenceBody.items[0].description = data.description.substring(0, 256);
      }
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
      if (data.successUrl && data.failureUrl && data.pendingUrl) {
        preferenceBody.back_urls = {
          success: data.successUrl,
          failure: data.failureUrl,
          pending: data.pendingUrl,
        };
        const isLocalhost = data.successUrl.includes("localhost") || 
                           data.successUrl.includes("127.0.0.1") ||
                           data.successUrl.includes("0.0.0.0");
        if (!isLocalhost) {
          preferenceBody.auto_return = "approved";
        }
      }
      if (data.businessId) {
        preferenceBody.external_reference = data.businessId;
      }
      if (data.businessId && data.planId) {
        preferenceBody.metadata = {
          businessId: data.businessId,
          planId: data.planId,
        };
      }
      const notificationUrl = `${process.env.BACKEND_URL || ""}/api/subscription/mercadopago/webhook`;
      if (notificationUrl && 
          notificationUrl.startsWith("https://") &&
          !notificationUrl.includes("localhost") && 
          !notificationUrl.includes("127.0.0.1") &&
          !notificationUrl.includes("0.0.0.0")) {
        preferenceBody.notification_url = notificationUrl;
      }
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
      if (process.env.NODE_ENV === "development") {
        console.log("📋 Body completo de la preferencia:", JSON.stringify(preferenceBody, null, 2));
      }
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
          "1. Ve a https://www.mercadopago.com.ar/developers/es/guides/online-payments/checkout-pro/configuration/#configurar-tus-permisos\n" +
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
  async processWebhook(data: any, signature?: string, requestId?: string) {
    try {
      let paymentId: string | undefined;
      let dataId: string | undefined;
      if (data.type === "payment") {
        paymentId = data.data?.id;
        dataId = data.data?.id;
      } else if (data.action === "payment.created" || data.action === "payment.updated") {
        paymentId = data.data?.id;
        dataId = data.data?.id;
      } else if (data.id) {
        paymentId = data.id;
        dataId = data.id;
      }
      if (!paymentId) {
        console.warn("Webhook recibido sin payment ID:", JSON.stringify(data));
        return { processed: false, message: "No se encontró payment ID en el webhook" };
      }
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
      return { processed: false, error: error.message };
    }
  }
  async processPayment(paymentId: string) {
    try {
      console.log(`🔍 Procesando pago con ID: ${paymentId}`);
      const client = getMercadoPagoClient();
      if (process.env.NODE_ENV === "development") {
        console.log("📦 Cliente de Mercado Pago creado, inicializando Payment client...");
      }
      const paymentClient = new Payment(client);
      console.log(`📞 Llamando a Mercado Pago API para obtener pago ${paymentId}...`);
      if (!/^\d{6,}$/.test(paymentId)) {
        console.warn(`⚠️ ID de pago inválido: ${paymentId}. Los IDs de Mercado Pago son numéricos y tienen al menos 6 dígitos.`);
        throw createHttpError(400, `ID de pago inválido: ${paymentId}. Debe ser un número de al menos 6 dígitos.`);
      }
      if (paymentId === "123456" || paymentId === "1234567890") {
        console.warn(`⚠️ Estás usando un ID de prueba inválido (${paymentId}). ` +
          `Este ID no existe en Mercado Pago. Para probar, necesitas crear un pago real o usar un ID de pago válido.`);
      }
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
        if (apiError.status === 404 || apiError.statusCode === 404) {
          console.warn(`⚠️ Pago ${paymentId} no encontrado en Mercado Pago (puede ser un ID de prueba inválido)`);
          throw createHttpError(404, `Pago ${paymentId} no encontrado en Mercado Pago`);
        }
        if (apiError.status === 401 || apiError.statusCode === 401) {
          console.error("❌ Error 401: Problema de autenticación con Mercado Pago");
          console.error("   Verifica que el token sea válido y corresponda al entorno correcto (TEST- para pruebas, APP_USR- para producción)");
          throw createHttpError(401, "Error de autenticación con Mercado Pago. Verifica que el access token sea válido.");
        }
        throw apiError;
      }
      let businessId = paymentData.metadata?.businessId as string | undefined;
      let planId = paymentData.metadata?.planId as string | undefined;
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
      const existingPayment = await prisma.paymentHistory.findFirst({
        where: {
          mercadoPagoPaymentId: paymentId,
        },
      });
      if (existingPayment) {
        const newStatus = this.mapMercadoPagoStatus(paymentData.status);
        const statusChanged = existingPayment.status !== newStatus;
        
        if (statusChanged) {
          console.log(`🔄 Actualizando pago ${existingPayment.id}: ${existingPayment.status} → ${newStatus} (MP: ${paymentData.status})`);
          
          // Calcular próxima fecha de pago si cambia a aprobado
          let nextPaymentDate: Date | undefined;
          if (paymentData.status === "approved" && existingPayment.status !== "PAID") {
            nextPaymentDate = new Date();
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          }

          await prisma.paymentHistory.update({
            where: { id: existingPayment.id },
            data: {
              status: newStatus,
              mercadoPagoStatus: paymentData.status || undefined,
              mercadoPagoPaymentType: paymentData.payment_type_id || undefined,
              ...(nextPaymentDate && { nextPaymentDate }),
            },
          });

          // Acciones adicionales según el nuevo estado
          if (paymentData.status === "approved" && existingPayment.status !== "PAID") {
            // Reactivar usuarios si el pago fue aprobado
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
          }

          console.log(`✅ Pago actualizado: ${existingPayment.id} → ${newStatus}`);
        } else {
          console.log(`ℹ️ Pago ${existingPayment.id} ya tiene estado ${existingPayment.status}, sin cambios`);
        }

        return { 
          processed: true, 
          paymentId: existingPayment.id, 
          updated: statusChanged,
          status: paymentData.status,
          previousStatus: existingPayment.mercadoPagoStatus,
        };
      }
      // Obtener datos del plan si existe
      let plan = null;
      if (planId) {
        plan = await prisma.businessPlan.findUnique({
          where: { id: planId },
        });
      }
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

      const preferenceId = (paymentData as any).preference_id || (paymentData as any).order?.id || undefined;
      const mappedStatus = this.mapMercadoPagoStatus(paymentData.status);

      // Calcular próxima fecha de pago solo si está aprobado
      let nextPaymentDate: Date | undefined;
      if (paymentData.status === "approved") {
        nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }

      // GUARDAR TODOS los pagos en la DB para mantener trazabilidad
      const paymentHistory = await prisma.paymentHistory.create({
        data: {
          businessId,
          amount: paymentData.transaction_amount || plan?.price || 0,
          status: mappedStatus,
          date: new Date(),
          nextPaymentDate,
          isTrial: false,
          mercadoPagoPreferenceId: preferenceId,
          mercadoPagoPaymentId: paymentId,
          mercadoPagoStatus: paymentData.status || undefined,
          mercadoPagoPaymentType: paymentData.payment_type_id || undefined,
        },
      });

      console.log(`📝 Pago guardado en DB con estado: ${mappedStatus} (MP: ${paymentData.status})`);

      // Acciones adicionales según el estado
      if (paymentData.status === "approved") {
        // Actualizar plan del negocio
        if (planId) {
          await prisma.business.update({
            where: { id: businessId },
            data: { businessPlanId: planId },
          });
        }
        // Reactivar usuarios inactivos
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
        console.log(`✅ Pago APROBADO procesado: ${paymentHistory.id}`);
        return { processed: true, paymentId: paymentHistory.id, created: true, status: "approved" };
      }

      if (paymentData.status === "pending" || paymentData.status === "in_process") {
        console.log(`⏳ Pago PENDIENTE registrado: ${paymentHistory.id}`);
        return { processed: true, paymentId: paymentHistory.id, created: true, status: "pending" };
      }

      if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
        console.log(`❌ Pago RECHAZADO/CANCELADO registrado: ${paymentHistory.id} (${paymentData.status_detail || paymentData.status})`);
        return { processed: true, paymentId: paymentHistory.id, created: true, status: paymentData.status };
      }

      if (paymentData.status === "refunded" || paymentData.status === "charged_back") {
        console.log(`↩️ Pago REEMBOLSADO registrado: ${paymentHistory.id}`);
        return { processed: true, paymentId: paymentHistory.id, created: true, status: paymentData.status };
      }

      // Cualquier otro estado también se guarda
      console.log(`ℹ️ Pago con estado '${paymentData.status}' registrado: ${paymentHistory.id}`);
      return { processed: true, paymentId: paymentHistory.id, created: true, status: paymentData.status };
    } catch (error: any) {
      console.error("Error processing payment:", {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        cause: error.cause,
      });
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
      if (error.status === 404 || error.statusCode === 404) {
        throw createHttpError(404, `Pago no encontrado: ${error.message}`);
      }
      throw createHttpError(500, `Error al procesar pago: ${error.message}`);
    }
  }
  private mapMercadoPagoStatus(status: string | undefined): "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED" {
    switch (status) {
      case "approved":
        return "PAID";
      case "pending":
      case "in_process":
        return "PENDING";
      case "rejected":
        return "FAILED";
      case "cancelled":
        return "CANCELLED";
      case "refunded":
      case "charged_back":
        return "REFUNDED";
      default:
        return "PENDING";
    }
  }
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

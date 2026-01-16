import { prisma } from "@/config/db";
import createHttpError from "http-errors";
import { emailService } from "@/services/email.service";
import { Business } from "@prisma/client";
export class BusinessService {
  async updateBusinessContact(
    businessId: string,
    requesterId: string,
    data: { contact_phone?: string; contact_email?: string }
  ) {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, businessId: true },
    });
    if (!requester) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    if (requester.role !== 1 && requester.role !== 0) {
      throw createHttpError(403, "No tiene permisos para actualizar datos del negocio");
    }
    if (requester.role === 1 && requester.businessId !== businessId) {
      throw createHttpError(403, "No puede actualizar datos de otro negocio");
    }
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
      },
    });
    return business;
  }
  async setPaymentResponsible(
    businessId: string,
    userId: string,
    currentUserId: string
  ) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, businessId: true },
    });
    if (!currentUser) {
      throw createHttpError(404, "Usuario actual no encontrado");
    }
    if (currentUser.role !== 1 && currentUser.role !== 0) {
      throw createHttpError(403, "No tiene permisos para designar responsable de pagos");
    }
    if (currentUser.role === 1 && currentUser.businessId !== businessId) {
      throw createHttpError(403, "No puede modificar otro negocio");
    }
    const newResponsible = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, businessId: true, email: true, name: true },
    });
    if (!newResponsible) {
      throw createHttpError(404, "Usuario designado no encontrado");
    }
    if (newResponsible.businessId !== businessId) {
      throw createHttpError(400, "El usuario no pertenece a este negocio");
    }
    if (newResponsible.role !== 1) {
      throw createHttpError(400, "Solo los administradores pueden ser responsables de pagos");
    }
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        paymentResponsibleUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });
    if (!business) {
      throw createHttpError(404, "Negocio no encontrado");
    }
    const previousResponsible = business.paymentResponsibleUser;
    await prisma.business.update({
      where: { id: businessId },
      data: { paymentResponsibleUserId: userId },
    });
    if (previousResponsible && previousResponsible.id !== userId) {
      await emailService.sendPaymentResponsibilityRemovedEmail(
        previousResponsible,
        business
      );
    }
    await emailService.sendPaymentResponsibilityAssignedEmail(
      newResponsible,
      business
    );
    return { success: true, newResponsible };
  }
  async getBusiness(businessId: string, requesterId: string) {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, businessId: true },
    });
    if (!requester) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    if (requester.role === 1 && requester.businessId !== businessId) {
      throw createHttpError(403, "No puede ver datos de otro negocio");
    }
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        businessPlan: true,
        paymentResponsibleUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!business) {
      throw createHttpError(404, "Negocio no encontrado");
    }
    return business;
  }

  async updateBusinessData(businessId:string, data: { name?: string; address?: string }): Promise<Business> {
    return await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        address: data.address,
      },
    });
  }

  async getBusinessMultipliers(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { multipliers: true },
    });

    if (!business) {
      throw createHttpError(404, "Negocio no encontrado");
    }

    // Return empty array if no multipliers configured
    return (business.multipliers as any[]) || [];
  }

  async updateBusinessMultipliers(businessId: string, multipliers: any[]) {
    // Validate structure
    for (const m of multipliers) {
      if (!m.id || !m.name || typeof m.value !== "number") {
        throw createHttpError(400, "Estructura de multiplicador inválida");
      }
      if (!Array.isArray(m.paymentMethods) || m.paymentMethods.length === 0) {
        throw createHttpError(
          400,
          `El multiplicador '${m.name}' debe tener al menos un método de pago asignado`
        );
      }
      // Validate payment methods
      const validMethods = ["CASH", "CARD", "TRANSFER", "CREDIT"];
      for (const method of m.paymentMethods) {
        if (!validMethods.includes(method)) {
          throw createHttpError(400, `Método de pago inválido: ${method}`);
        }
      }
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { multipliers: multipliers as any },
      select: { multipliers: true },
    });

    return business.multipliers as any[];
  }
}
export const businessService = new BusinessService();

import { prisma } from "@/config/db";
import { hashPassword, verifyPassword, generateSecureToken } from "@/config/crypto";
import { generateRecoverPswToken, generateToken, TokenPayload, verifyToken } from "@/config/jwt";
import { uploadFileWithUniqueId, getFileUrl } from "@/utils/minio.util";
import { Prisma, PaymentStatus } from "@prisma/client";
import createHttpError from "http-errors";
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail } from "@/utils";
import { emailService } from "@/services/email.service";
interface RegisterData extends Prisma.UserCreateInput {
  businessName: string;
  businessAddress: string;
  businessPhone?: string;
  businessEmail?: string;
}
interface CreateAdminData {
  name: string;
  email: string;
  password: string;
  businessId: string;
}
export class UserService {
  private generateVerificationData() {
    const verificationToken = generateSecureToken(32);
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);
    return { verificationToken, verificationExpires };
  }
  async createUser(data: RegisterData) {
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingUser) {
      throw createHttpError(409, "El correo electrónico ya está registrado");
    }
    const hashedPassword = await hashPassword(data.password);
    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 7); 
    const { verificationToken, verificationExpires } = this.generateVerificationData();
    const result = await prisma.$transaction(async (tx) => {
      let activePlan = await tx.businessPlan.findFirst({
        where: { isActive: true },
      });
      if (!activePlan) {
        activePlan = await tx.businessPlan.create({
          data: {
            name: "Plan Estándar",
            price: 0,
            description: "Plan por defecto",
            features: [],
            isActive: true,
          },
        });
      }
      const business = await tx.business.create({
        data: {
          name: data.businessName,
          address: data.businessAddress,
          contact_phone: data.businessPhone,
          contact_email: data.businessEmail,
          businessPlanId: activePlan.id,
        },
      });
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 1, 
          status: "ACTIVE",
          businessId: business.id,
          emailVerified: false,
          verificationToken,
          verificationExpires,
        },
      });
      await tx.paymentHistory.create({
        data: {
          businessId: business.id,
          amount: 0,
          status: PaymentStatus.PAID,
          isTrial: true,
          nextPaymentDate: nextPaymentDate,
        },
      });
      return user;
    });
    await sendVerificationEmail({
      email: result.email,
      name: result.name ?? "",
      verificationToken,
      appUrl: process.env.APP_URL ?? "",
    });
    const payload: TokenPayload = {
      userId: result.id,
      email: result.email,
      role: result.role,
    };
    const token = generateToken(payload);
    const { password, verificationToken: _, ...userWithoutSensitiveData } = result;
    return {
      user: userWithoutSensitiveData,
      token,
      message: "Se ha enviado un correo de verificación a tu email. Por favor verifica tu cuenta para acceder a todas las funcionalidades.",
    };
  }
  async createAdmin(creatorId: string, data: CreateAdminData) {
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
    });
    if (!creator) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    if (creator.role !== 1 && creator.role !== 0) {
      throw createHttpError(403, "No tiene permisos para crear administradores");
    }
    if (creator.role === 1 && creator.businessId !== data.businessId) {
      throw createHttpError(403, "No puede crear administradores para otro negocio");
    }
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingUser) {
      throw createHttpError(409, "El correo electrónico ya está registrado");
    }
    const hashedPassword = await hashPassword(data.password);
    const { verificationToken, verificationExpires } = this.generateVerificationData();
    const newAdmin = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 1, 
        status: "ACTIVE",
        businessId: data.businessId,
        emailVerified: false,
        verificationToken,
        verificationExpires,
      },
    });
    await sendVerificationEmail({
      email: newAdmin.email,
      name: newAdmin.name ?? "",
      verificationToken,
      appUrl: process.env.APP_URL ?? "",
    });
    const { password, verificationToken: _, ...adminWithoutSensitiveData } = newAdmin;
    return {
      user: adminWithoutSensitiveData,
      message: "Administrador creado. Se ha enviado un correo de verificación.",
    };
  }
  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });
    if (!user) {
      throw createHttpError(400, "Token de verificación inválido");
    }
    if (user.emailVerified) {
      throw createHttpError(400, "El correo ya ha sido verificado");
    }
    if (user.verificationExpires && user.verificationExpires < new Date()) {
      throw createHttpError(400, "El token de verificación ha expirado. Solicite uno nuevo.");
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });
    await sendWelcomeEmail({
      email: user.email,
      name: user.name ?? "",
      appUrl: process.env.APP_URL ?? "",
    });
    return { message: "Correo verificado exitosamente. Ya puede acceder a todas las funcionalidades." };
  }
  async resendVerificationEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    if (user.emailVerified) {
      throw createHttpError(400, "El correo ya ha sido verificado");
    }
    const { verificationToken, verificationExpires } = this.generateVerificationData();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires,
      },
    });
    await sendVerificationEmail({
      email: user.email,
      name: user.name ?? "",
      verificationToken,
      appUrl: process.env.APP_URL ?? "",
    });
    return { message: "Se ha enviado un nuevo correo de verificación." };
  }
  async loginUser(email: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      throw createHttpError(401, "Credenciales inválidas");
    }
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw createHttpError(401, "Credenciales inválidas");
    }
    if (user.status !== "ACTIVE") {
      if (user.status === "INACTIVE" && user.businessId) {
        const lastPayment = await prisma.paymentHistory.findFirst({
          where: {
            businessId: user.businessId,
            status: PaymentStatus.PAID,
          },
          orderBy: { createdAt: "desc" },
        });
        const now = new Date();
        if (!lastPayment || (lastPayment.nextPaymentDate && lastPayment.nextPaymentDate < now)) {
          try {
            await emailService.sendEmailWithTemplate({
              to: user.email,
              subject: "Atención: Su cuenta requiere asistencia",
              templateName: "account-inactive",
              data: {
                name: user.name,
                email: user.email,
              },
            });
          } catch (error) {
            console.error("Error enviando email de cuenta inactiva:", error);
          }
        }
      }
      throw createHttpError(403, "Su cuenta no está activa");
    }
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(payload);
    const { password: _, verificationToken, ...userWithoutSensitiveData } = user;
    return {
      user: userWithoutSensitiveData,
      token,
      emailVerified: user.emailVerified,
    };
  }
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    const { password, verificationToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }
  async updateUser(userId: string, data: Prisma.UserUpdateInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    if (data.password && typeof data.password === "string") {
      data.password = await hashPassword(data.password);
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });
    const { password, verificationToken, ...userWithoutSensitiveData } = updatedUser;
    return userWithoutSensitiveData;
  }
  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    const fileName = await uploadFileWithUniqueId(
      file.originalname,
      file.buffer,
      file.mimetype,
      "profile-photos"
    );
    await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: fileName,
      },
    });
    const url = await getFileUrl(fileName, 7 * 24 * 3600);
    return { url };
  }
  async recoverPassword(email: string) {
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    const resetToken = generateRecoverPswToken({ email, password: user.password }, { expiresIn: "5m" });
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name ?? "",
      resetToken,
      appUrl: process.env.APP_URL ?? "",
    });
  }
  async resetPassword(token: string, newPassword: string) {
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.email || !decoded.password) {
      throw createHttpError(400, "Token inválido o incompleto");
    }
    const user = await prisma.user.findFirst({
      where: { email: decoded.email },
    });
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    if (user.password !== decoded.password) {
      throw createHttpError(400, "El enlace de recuperación ya no es válido (la contraseña ha cambiado)");
    }
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    return true;
  }
  async getBusinessAdmins(businessId: string) {
    const admins = await prisma.user.findMany({
      where: {
        businessId,
        role: 1,
        status: { not: "DELETED" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        emailVerified: true,
        profileImage: true,
        createdAt: true,
      },
    });
    return admins;
  }
}
export const userService = new UserService();

import { prisma } from "@/config/db";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateSecureAndHashedPassword,
} from "@/config/crypto";
import {
  generateRecoverPswToken,
  generateToken,
  TokenPayload,
  verifyToken,
} from "@/config/jwt";
import { uploadFileWithUniqueId, getFileUrl } from "@/utils/minio.util";
import { Prisma, PaymentStatus } from "@prisma/client";
import createHttpError from "http-errors";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendUserCreatedEmail,
} from "@/utils";
import { emailService } from "@/services/email.service";
import {
  RegisterData,
  CreateAdminData,
  CreateUserByAdminData,
  UpdateUserData,
} from "@/types";

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
    const { verificationToken, verificationExpires } =
      this.generateVerificationData();
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
      businessId: result.businessId || undefined,
    };
    const token = generateToken(payload);
    const {
      password,
      verificationToken: _,
      ...userWithoutSensitiveData
    } = result;
    return {
      user: userWithoutSensitiveData,
      token,
      message:
        "Se ha enviado un correo de verificación a tu email. Por favor verifica tu cuenta para acceder a todas las funcionalidades.",
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
      throw createHttpError(
        403,
        "No tiene permisos para crear administradores",
      );
    }
    if (creator.role === 1 && creator.businessId !== data.businessId) {
      throw createHttpError(
        403,
        "No puede crear administradores para otro negocio",
      );
    }
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingUser) {
      throw createHttpError(409, "El correo electrónico ya está registrado");
    }
    const hashedPassword = await hashPassword(data.password);
    const { verificationToken, verificationExpires } =
      this.generateVerificationData();
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
    const {
      password,
      verificationToken: _,
      ...adminWithoutSensitiveData
    } = newAdmin;
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
      throw createHttpError(
        400,
        "El token de verificación ha expirado. Solicite uno nuevo.",
      );
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
    return {
      message:
        "Correo verificado exitosamente. Ya puede acceder a todas las funcionalidades.",
    };
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
    const { verificationToken, verificationExpires } =
      this.generateVerificationData();
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
        if (
          !lastPayment ||
          (lastPayment.nextPaymentDate && lastPayment.nextPaymentDate < now)
        ) {
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
      businessId: user.businessId || undefined,
    };
    const token = generateToken(payload);
    const {
      password: _,
      verificationToken,
      ...userWithoutSensitiveData
    } = user;

    
    let profilePhoto: string | null = null;
    if (user.profileImage) {
      try {
        profilePhoto = await getFileUrl(user.profileImage, 7 * 24 * 3600);
      } catch (error) {
        console.error("Error getting profile image URL:", error);
      }
    }

    return {
      user: {
        ...userWithoutSensitiveData,
        profilePhoto,
      },
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

    
    let profilePhoto: string | null = null;
    if (user.profileImage) {
      try {
        profilePhoto = await getFileUrl(user.profileImage, 7 * 24 * 3600);
      } catch (error) {
        console.error("Error getting profile image URL:", error);
      }
    }

    return {
      ...userWithoutSensitiveData,
      profilePhoto,
    };
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
      "profile-photos",
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
    const resetToken = generateRecoverPswToken(
      { email, password: user.password },
      { expiresIn: "5m" },
    );
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
      throw createHttpError(
        400,
        "El enlace de recuperación ya no es válido (la contraseña ha cambiado)",
      );
    }
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    return true;
  }
  async createUserByAdmin(
    creatorId: string,
    businessId: string,
    data: CreateUserByAdminData,
  ) {
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { role: true, businessId: true },
    });
    if (!creator) {
      throw createHttpError(404, "Usuario creador no encontrado");
    }
    if (creator.role !== 1 && creator.role !== 0) {
      throw createHttpError(403, "No tiene permisos para crear usuarios");
    }
    if (creator.role === 1 && creator.businessId !== businessId) {
      throw createHttpError(403, "No puede crear usuarios para otro negocio");
    }
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email, businessId },
    });
    if (existingUser) {
      throw createHttpError(
        409,
        "Ya existe un usuario con ese correo en este negocio",
      );
    }
    let { role, permissions = [] } = data;
    const ALL_PERMISSIONS = [
      "POS",
      "PRODUCTOS",
      "VENTAS",
      "CLIENTES",
      "REPORTES",
      "CONFIGURACION",
    ];
    if (role === 2 && permissions.length === ALL_PERMISSIONS.length) {
      role = 1;
      permissions = [];
    }
    const { plain_password, hashedPassword } =
      await generateSecureAndHashedPassword();
    const { verificationToken, verificationExpires } =
      this.generateVerificationData();
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role,
        permissions: role === 1 ? [] : permissions,
        status: "ACTIVE",
        businessId,
        emailVerified: false,
        verificationToken,
        verificationExpires,
      },
    });
    await sendUserCreatedEmail({
      email: user.email,
      name: user.name ?? "",
      temporaryPassword: plain_password,
      verificationToken,
      appUrl: process.env.APP_URL ?? "",
    });
    const {
      password: _,
      verificationToken: __,
      ...userWithoutSensitive
    } = user;
    return userWithoutSensitive;
  }
  async updateOwnProfile(userId: string, data: Prisma.UserUpdateInput) {
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
    const { password, verificationToken, ...userWithoutSensitiveData } =
      updatedUser;
    return userWithoutSensitiveData;
  }
  async updateUser(userId: string, updaterId: string, data: UpdateUserData) {
    const updater = await prisma.user.findUnique({
      where: { id: updaterId },
      select: { role: true, businessId: true },
    });
    if (!updater) {
      throw createHttpError(404, "Usuario actualizador no encontrado");
    }
    if (updater.role !== 1 && updater.role !== 0) {
      throw createHttpError(403, "No tiene permisos para actualizar usuarios");
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true, role: true },
    });
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    if (updater.role === 1 && updater.businessId !== user.businessId) {
      throw createHttpError(
        403,
        "No puede actualizar usuarios de otro negocio",
      );
    }
    let { role, permissions } = data;
    if (role !== undefined && permissions !== undefined) {
      const ALL_PERMISSIONS = [
        "POS",
        "PRODUCTOS",
        "VENTAS",
        "CLIENTES",
        "REPORTES",
        "CONFIGURACION",
      ];
      if (role === 2 && permissions.length === ALL_PERMISSIONS.length) {
        role = 1;
        permissions = [];
      }
    }
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = await hashPassword(data.password);
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined)
      updateData.permissions = role === 1 ? [] : permissions;
    if (data.status) updateData.status = data.status;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    const {
      password: _,
      verificationToken: __,
      ...userWithoutSensitive
    } = updatedUser;
    return userWithoutSensitive;
  }
  async deleteUser(userId: string, deleterId: string) {
    const deleter = await prisma.user.findUnique({
      where: { id: deleterId },
      select: { role: true, businessId: true },
    });
    if (!deleter) {
      throw createHttpError(404, "Usuario eliminador no encontrado");
    }
    if (deleter.role !== 1 && deleter.role !== 0) {
      throw createHttpError(403, "No tiene permisos para eliminar usuarios");
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true, role: true },
    });
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }
    if (deleter.role === 1 && deleter.businessId !== user.businessId) {
      throw createHttpError(403, "No puede eliminar usuarios de otro negocio");
    }
    if (user.role === 1) {
      const adminCount = await prisma.user.count({
        where: {
          businessId: user.businessId,
          role: 1,
          status: { not: "DELETED" },
        },
      });
      if (adminCount <= 1) {
        throw createHttpError(
          400,
          "No se puede eliminar el último administrador del negocio",
        );
      }
    }
    await prisma.user.update({
      where: { id: userId },
      data: { status: "DELETED" },
    });
    return { success: true };
  }
  async getUsersByBusiness(businessId: string, requesterId: string) {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, businessId: true },
    });
    if (!requester) {
      throw createHttpError(404, "Usuario solicitante no encontrado");
    }
    if (requester.role !== 1 && requester.role !== 0) {
      throw createHttpError(403, "No tiene permisos para ver usuarios");
    }
    if (requester.role === 1 && requester.businessId !== businessId) {
      throw createHttpError(403, "No puede ver usuarios de otro negocio");
    }
    const users = await prisma.user.findMany({
      where: {
        businessId,
        status: { not: "DELETED" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return users;
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

import { prisma } from "@/config/db";
import { decrypt, hashPassword, verifyPassword } from "@/config/crypto";
import { generateRecoverPswToken, generateToken, TokenPayload } from "@/config/jwt";
import { uploadFileWithUniqueId } from "@/utils/minio.util";
import { Prisma, User, PaymentStatus } from "@prisma/client";
import createHttpError from "http-errors";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/utils";

interface RegisterData extends Prisma.UserCreateInput {
  businessName: string;
  businessAddress: string;
  businessPhone?: string;
  businessEmail?: string;
}

export class UserService {
  async createUser(data: RegisterData) {
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createHttpError(409, "El correo electrónico ya está registrado");
    }

    const hashedPassword = await hashPassword(data.password);
    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 7); // 7 días de prueba

    // Transacción: Crear Negocio, Usuario y Pago Inicial
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Negocio
      const business = await tx.business.create({
        data: {
          name: data.businessName,
          address: data.businessAddress,
          contact_phone: data.businessPhone,
          contact_email: data.businessEmail,
        },
      });

      // 2. Crear Usuario Admin (Role 1) vinculado al Negocio
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 1, // Admin del negocio
          status: "ACTIVE",
          businessId: business.id,
        },
      });

      // 3. Crear Historial de Pago (Trial)
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

    const payload: TokenPayload = {
      userId: result.id,
      email: result.email,
      role: result.role,
    };

    const token = generateToken(payload);
    const { password, ...userWithoutPassword } = result;
    
    await sendWelcomeEmail({
      email: result.email,
      name: result.name ?? "",
      appUrl: process.env.APP_URL ?? "",
    });

    return {
      user: userWithoutPassword,
      token,
    };
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
      throw createHttpError(403, "Su cuenta no está activa");
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
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

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: fileName,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return {
      user: userWithoutPassword,
      fileName,
    };
  }

  async recoverPassword(email: string) {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }

    // const decrypted_psw = decrypt(user.password); // No desencriptar, usar hash
    const resetToken = generateRecoverPswToken({email, password: user.password}, {"expiresIn": "5m"});

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name ?? "",
      resetToken,
      appUrl: process.env.APP_URL ?? "",
    });
  }

  async resetPassword(token: string, newPassword: string) {
    // 1. Verificar token
    // Necesitamos una función para verificar este tipo de token específico
    // Por ahora usaré verifyToken genérico, pero idealmente deberíamos chequear el payload.password contra la DB
    // Importante: jwt.verify lanzará error si expiró
    
    // Importamos verifyToken dinámicamente o lo usamos si ya está importado (ya está importado)
    // Pero verifyToken usa JWT_SECRET. generateRecoverPswToken usa JWT_SECRET.
    
    const { verifyToken } = await import("@/config/jwt");
    const decoded = verifyToken(token) as any; // Cast to any to access payload properties
    
    if (!decoded || !decoded.email || !decoded.password) {
        throw createHttpError(400, "Token inválido o incompleto");
    }

    const user = await prisma.user.findFirst({
      where: { email: decoded.email },
    });

    if (!user) {
      throw createHttpError(404, "Usuario no encontrado");
    }

    // 2. Verificar Security Stamp (Password Hash)
    // Si la contraseña del usuario cambió después de generar el token, el hash no coincidirá
    if (user.password !== decoded.password) {
        throw createHttpError(400, "El enlace de recuperación ya no es válido (la contraseña ha cambiado)");
    }

    // 3. Actualizar contraseña
    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    
    return true;
  }
}

export const userService = new UserService();

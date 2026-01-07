import { prisma } from "@/config/db";
import { hashPassword, verifyPassword } from "@/config/crypto";
import { generateToken, TokenPayload } from "@/config/jwt";
import { uploadFileWithUniqueId } from "@/utils/minio.util";
import { Prisma, User } from "@prisma/client";
import createHttpError from "http-errors";
import { sendWelcomeEmail } from "@/utils";

export class UserService {
  async createUser(data: Prisma.UserCreateInput) {
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createHttpError(409, "El correo electrónico ya está registrado");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);
    const { password, ...userWithoutPassword } = user;
    await sendWelcomeEmail({
      email: user.email,
      name: user.name ?? "",
      appUrl: process.env.APP_URL ?? "",
    })

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
}

export const userService = new UserService();

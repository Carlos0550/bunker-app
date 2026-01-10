import { Request, Response, NextFunction } from "express";
import { userService } from "@/services/user.service";

export class UserController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await userService.loginUser(email, password);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        message: "Sesión cerrada correctamente",
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new Error("Usuario no autenticado");
      }

      const user = await userService.getUserById(userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {

      const userId = req.user?.userId;
      
      if (!userId) {
        throw new Error("Usuario no autenticado");
      }

      const updatedUser = await userService.updateUser(userId, req.body);
      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfilePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new Error("Usuario no autenticado");
      }

      if (!req.file) {
        throw new Error("No se ha subido ningún archivo");
      }

      const result = await userService.updateProfilePhoto(userId, req.file);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async recoverPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query;
      await userService.recoverPassword(email as string);
      res.status(200).json({
        success: true,
        message: "Se ha enviado un correo electrónico con las instrucciones para recuperar la contraseña",
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await userService.resetPassword(token, newPassword);
      res.status(200).json({
        success: true,
        message: "Contraseña actualizada correctamente",
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        throw new Error("Token de verificación requerido");
      }
      const result = await userService.verifyEmail(token);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new Error("Email requerido");
      }
      const result = await userService.resendVerificationEmail(email);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user?.userId;
      if (!creatorId) {
        throw new Error("Usuario no autenticado");
      }

      const result = await userService.createAdmin(creatorId, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBusinessAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error("Usuario no autenticado");
      }

      // Obtener el businessId del usuario actual
      const { prisma } = await import("@/config/db");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { businessId: true },
      });

      if (!user?.businessId) {
        throw new Error("Usuario sin negocio asociado");
      }

      const admins = await userService.getBusinessAdmins(user.businessId);
      res.status(200).json({
        success: true,
        data: admins,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();

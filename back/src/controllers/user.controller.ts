import { Request, Response, NextFunction } from "express";
import { userService } from "@/services/user.service";
import createHttpError from "http-errors";
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
        throw createHttpError(401, "Usuario no autenticado");
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
        throw createHttpError(401, "Usuario no autenticado");
      }
      const updatedUser = await userService.updateOwnProfile(userId, req.body);
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
        throw createHttpError(401, "Usuario no autenticado");
      }
      if (!req.file) {
        throw createHttpError(400, "No se ha subido ningún archivo");
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
        throw createHttpError(400, "Token de verificación requerido");
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
        throw createHttpError(400, "Email requerido");
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
        throw createHttpError(401, "Usuario no autenticado");
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
      const businessId = req.user?.businessId;
      if (!businessId) {
        throw createHttpError(400, "Business ID requerido");
      }
      const admins = await userService.getBusinessAdmins(businessId);
      res.status(200).json({
        success: true,
        data: admins,
      });
    } catch (error) {
      next(error);
    }
  }
  createUserByAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const creatorId = req.user?.userId;
      if (!creatorId) {
        throw createHttpError(401, "No autorizado");
      }
      const { businessId, ...userData } = req.body;
      if (!businessId) {
        throw createHttpError(400, "Se requiere el ID del negocio");
      }
      const user = await userService.createUserByAdmin(creatorId, businessId, userData);
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
  getUsersByBusiness = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requesterId = req.user?.userId;
      if (!requesterId) {
        throw createHttpError(401, "No autorizado");
      }
      const { businessId } = req.query;
      if (!businessId || typeof businessId !== "string") {
        throw createHttpError(400, "Se requiere el ID del negocio");
      }
      const users = await userService.getUsersByBusiness(businessId, requesterId);
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };
  updateUserByAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updaterId = req.user?.userId;
      if (!updaterId) {
        throw createHttpError(401, "No autorizado");
      }
      const { id } = req.params;
      const userData = req.body;
      const user = await userService.updateUser(id, updaterId, userData);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleterId = req.user?.userId;
      if (!deleterId) {
        throw createHttpError(401, "No autorizado");
      }
      const { id } = req.params;
      const result = await userService.deleteUser(id, deleterId);
      res.json({
        success: true,
        message: "Usuario eliminado correctamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
export const userController = new UserController();

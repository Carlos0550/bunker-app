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
}

export const userController = new UserController();

import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { prisma } from "@/config/db";

/**
 * Middleware que verifica si el email del usuario está verificado
 * - Super admin (role 0) no necesita verificación
 * - Otros usuarios deben tener emailVerified = true
 */
export async function requireEmailVerified(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Super admin no necesita verificación
    if (req.user?.role === 0) {
      return next();
    }

    const userId = req.user?.userId;
    if (!userId) {
      return next(createHttpError(401, "Usuario no autenticado"));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, email: true },
    });

    if (!user) {
      return next(createHttpError(404, "Usuario no encontrado"));
    }

    if (!user.emailVerified) {
      return next(
        createHttpError(
          403,
          "Debe verificar su correo electrónico para acceder a esta funcionalidad. " +
          `Revise su bandeja de entrada en ${user.email}`
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware opcional que solo advierte si el email no está verificado
 * Agrega headers de advertencia pero no bloquea
 */
export async function warnEmailNotVerified(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.role === 0) {
      return next();
    }

    const userId = req.user?.userId;
    if (!userId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (user && !user.emailVerified) {
      res.setHeader("X-Email-Verification-Warning", "true");
      res.setHeader(
        "X-Email-Verification-Message",
        "Su correo electrónico no ha sido verificado. Algunas funcionalidades pueden estar limitadas."
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

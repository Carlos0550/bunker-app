import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod/v4";
import createHttpError from "http-errors";

function isValidValue(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return true;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0
  ) {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
}


function validateNoUndefined(
  obj: Record<string, unknown>,
  path: string = "",
): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (value === undefined) {
      errors.push(`El campo "${currentPath}" no puede ser undefined`);
    } else if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      value !== null
    ) {
      errors.push(
        ...validateNoUndefined(value as Record<string, unknown>, currentPath),
      );
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item === undefined) {
          errors.push(
            `El elemento [${index}] en "${currentPath}" no puede ser undefined`,
          );
        } else if (typeof item === "object" && item !== null) {
          errors.push(
            ...validateNoUndefined(
              item as Record<string, unknown>,
              `${currentPath}[${index}]`,
            ),
          );
        }
      });
    }
  }
  return errors;
}

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.body || typeof req.body !== "object") {
        throw createHttpError(400, "El body de la solicitud es requerido");
      }

      const bodyKeys = Object.keys(req.body);
      if (bodyKeys.length === 0) {
        throw createHttpError(400, "El body debe contener al menos un campo");
      }

      
      const undefErrors = validateNoUndefined(req.body);
      if (undefErrors.length > 0) {
        throw createHttpError(400, undefErrors.join("; "));
      }

      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errorMessages = result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        );
        throw createHttpError(400, errorMessages.join("; "));
      }

      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireValidBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.body || typeof req.body !== "object") {
      throw createHttpError(400, "El body de la solicitud es requerido");
    }

    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length === 0) {
      throw createHttpError(400, "El body debe contener al menos un campo");
    }

    for (const [key, value] of Object.entries(req.body)) {
      if (!isValidValue(value)) {
        throw createHttpError(
          400,
          `El campo "${key}" tiene un valor inválido (undefined o vacío)`,
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

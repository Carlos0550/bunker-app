import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod/v4";
import createHttpError from "http-errors";


export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errorMessages = result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        throw createHttpError(400, `Query params inválidos: ${errorMessages.join("; ")}`);
      }

      
      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}


export function validateQueryParams(
  requiredParams: string[] = [],
  optionalParams: string[] = []
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const queryKeys = Object.keys(req.query);
      const allowedParams = [...requiredParams, ...optionalParams];

      
      const missingParams = requiredParams.filter((param) => !(param in req.query));
      if (missingParams.length > 0) {
        throw createHttpError(
          400,
          `Parámetros requeridos faltantes: ${missingParams.join(", ")}`
        );
      }

      
      if (allowedParams.length > 0) {
        const invalidParams = queryKeys.filter((key) => !allowedParams.includes(key));
        if (invalidParams.length > 0) {
          throw createHttpError(
            400,
            `Parámetros no permitidos: ${invalidParams.join(", ")}`
          );
        }
      }

      
      for (const param of requiredParams) {
        const value = req.query[param];
        if (value === "" || value === undefined || value === null) {
          throw createHttpError(400, `El parámetro "${param}" no puede estar vacío`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}


export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;


export const searchSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  query: z.string().optional(),
});

export type SearchQuery = z.infer<typeof searchSchema>;



import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod/v4";
import createHttpError from "http-errors";


export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errorMessages = result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        throw createHttpError(400, `Parámetros de ruta inválidos: ${errorMessages.join("; ")}`);
      }

      
      (req as Request & { validatedParams: z.infer<T> }).validatedParams = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}


export function validatePathParams(requiredParams: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      for (const param of requiredParams) {
        const value = req.params[param];

        if (!value || value.trim() === "") {
          throw createHttpError(400, `El parámetro de ruta "${param}" es requerido`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}






export const idParamSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
});


export const uuidParamSchema = z.object({
  id: z.uuid("ID debe ser un UUID válido"),
});


export const numericIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID debe ser un número")
    .transform((val) => parseInt(val, 10)),
});


export const tenantParamSchema = z.object({
  tenantId: z.uuid("tenantId debe ser un UUID válido"),
});


export const tenantResourceParamSchema = z.object({
  tenantId: z.uuid("tenantId debe ser un UUID válido"),
  id: z.uuid("ID debe ser un UUID válido"),
});


export type IdParam = z.infer<typeof idParamSchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type NumericIdParam = z.infer<typeof numericIdParamSchema>;
export type TenantParam = z.infer<typeof tenantParamSchema>;
export type TenantResourceParam = z.infer<typeof tenantResourceParamSchema>;



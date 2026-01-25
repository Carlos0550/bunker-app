import { Request, Response, NextFunction } from "express";
import { importService } from "@/services/import.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";
import * as fs from "fs";
const fileCache = new Map<
  string,
  { path: string; fileName: string; mimeType: string; expiresAt: number }
>();
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of fileCache.entries()) {
    if (value.expiresAt < now) {
      if (fs.existsSync(value.path)) {
        try { fs.unlinkSync(value.path); } catch(e) {}
      }
      fileCache.delete(key);
    }
  }
}, 5 * 60 * 1000);
class ImportController {
  private getBusinessId = async (req: Request): Promise<string> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw createHttpError(401, "No autorizado");
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });
    if (!user?.businessId) {
      throw createHttpError(400, "Usuario no tiene un negocio asociado");
    }
    return user.businessId;
  };
  getSystemColumns = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const columns = importService.getSystemColumns();
      res.json({ success: true, data: columns });
    } catch (error) {
      next(error);
    }
  };
  analyzeFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.getBusinessId(req);
      if (!req.file) {
        throw createHttpError(400, "No se proporcionó ningún archivo");
      }
      const { path, originalname, mimetype } = req.file;
      
      const result = await importService.parseFile(path, originalname, mimetype);
      const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      fileCache.set(sessionId, {
        path, 
        fileName: originalname,
        mimeType: mimetype,
        expiresAt: Date.now() + 30 * 60 * 1000,
      });
      res.json({
        success: true,
        data: {
          sessionId,
          headers: result.headers,
          previewData: result.previewData,
          totalRows: result.totalRows,
          suggestedMapping: result.suggestedMapping,
          systemColumns: importService.getSystemColumns(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
  validateImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      const { sessionId, columnMapping } = req.body;
      if (!sessionId || !columnMapping) {
        throw createHttpError(400, "Se requiere sessionId y columnMapping");
      }
      const cachedFile = fileCache.get(sessionId);
      if (!cachedFile) {
        throw createHttpError(
          400,
          "Sesión de importación expirada. Por favor, suba el archivo nuevamente."
        );
      }
      const result = await importService.validateImport(
        cachedFile.path,
        cachedFile.fileName,
        cachedFile.mimeType,
        columnMapping,
        businessId
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  processImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      const { sessionId, columnMapping, skipDuplicates = false } = req.body;
      if (!sessionId || !columnMapping) {
        throw createHttpError(400, "Se requiere sessionId y columnMapping");
      }
      const cachedFile = fileCache.get(sessionId);
      if (!cachedFile) {
        throw createHttpError(
          400,
          "Sesión de importación expirada. Por favor, suba el archivo nuevamente."
        );
      }
      const requiredColumns = importService.getSystemColumns().filter((c) => c.required);
      const mappedSystemColumns = Object.values(columnMapping);
      for (const col of requiredColumns) {
        if (!mappedSystemColumns.includes(col.key)) {
          throw createHttpError(
            400,
            `La columna "${col.label}" es requerida y debe ser mapeada.`
          );
        }
      }
      const result = await importService.processImport(
        cachedFile.path,
        cachedFile.fileName,
        cachedFile.mimeType,
        columnMapping,
        businessId,
        skipDuplicates
      );
      fileCache.delete(sessionId);
      res.json({
        success: true,
        data: {
          imported: result.success,
          failed: result.failed,
          skipped: result.skipped,
          errors: result.errors.slice(0, 10),
          totalErrors: result.errors.length,
        },
      });
    } catch (error) {
      console.error("Import Process Error:", error);
      next(error);
    }
  };
  cancelImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.body;
      if (sessionId && fileCache.has(sessionId)) {
        fileCache.delete(sessionId);
      }
      res.json({ success: true, message: "Importación cancelada" });
    } catch (error) {
      next(error);
    }
  };
}
export const importController = new ImportController();

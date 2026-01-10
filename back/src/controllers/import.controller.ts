import { Request, Response, NextFunction } from "express";
import { importService } from "@/services/import.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";

// Cache temporal para archivos (en producción usar Redis)
const fileCache = new Map<string, { buffer: Buffer; fileName: string; mimeType: string; expiresAt: number }>();

// Limpiar cache cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of fileCache.entries()) {
    if (value.expiresAt < now) {
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

  /**
   * GET /import/columns
   * Obtiene las columnas del sistema disponibles para mapeo
   */
  getSystemColumns = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const columns = importService.getSystemColumns();
      res.json({ success: true, data: columns });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /import/analyze
   * Analiza un archivo y retorna los headers con sugerencias de mapeo
   */
  analyzeFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.getBusinessId(req); // Verificar autenticación

      if (!req.file) {
        throw createHttpError(400, "No se proporcionó ningún archivo");
      }

      const { buffer, originalname, mimetype } = req.file;

      // Parsear archivo
      const result = await importService.parseFile(buffer, originalname, mimetype);

      // Generar ID único para esta sesión de importación
      const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Guardar archivo en cache temporal (expira en 30 minutos)
      fileCache.set(sessionId, {
        buffer,
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

  /**
   * POST /import/process
   * Procesa la importación con el mapeo proporcionado
   */
  processImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = await this.getBusinessId(req);
      const { sessionId, columnMapping } = req.body;

      if (!sessionId || !columnMapping) {
        throw createHttpError(400, "Se requiere sessionId y columnMapping");
      }

      // Recuperar archivo del cache
      const cachedFile = fileCache.get(sessionId);
      if (!cachedFile) {
        throw createHttpError(400, "Sesión de importación expirada. Por favor, suba el archivo nuevamente.");
      }

      // Validar que al menos las columnas requeridas estén mapeadas
      const requiredColumns = importService.getSystemColumns().filter((c) => c.required);
      const mappedSystemColumns = Object.values(columnMapping);

      for (const col of requiredColumns) {
        if (!mappedSystemColumns.includes(col.key)) {
          throw createHttpError(400, `La columna "${col.label}" es requerida y debe ser mapeada.`);
        }
      }

      // Procesar importación
      const result = await importService.processImport(
        cachedFile.buffer,
        cachedFile.fileName,
        cachedFile.mimeType,
        columnMapping,
        businessId
      );

      // Limpiar cache
      fileCache.delete(sessionId);

      res.json({
        success: true,
        data: {
          imported: result.success,
          failed: result.failed,
          errors: result.errors.slice(0, 10), // Limitar errores mostrados
          totalErrors: result.errors.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /import/cancel
   * Cancela una sesión de importación
   */
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

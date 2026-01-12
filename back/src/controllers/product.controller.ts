import { Request, Response, NextFunction } from "express";
import { productService } from "@/services/product.service";
import { prisma } from "@/config/db";
import createHttpError from "http-errors";
class ProductController {
  private getBusinessId = async (userId: string): Promise<string> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });
    if (!user?.businessId) {
      throw createHttpError(403, "Usuario sin negocio asociado");
    }
    return user.businessId;
  };
  getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const filters = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        state: req.query.state as any,
        lowStock: req.query.lowStock === "true",
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      };
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };
      const result = await productService.getProducts(businessId, filters, pagination);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
  getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const product = await productService.getProductById(req.params.id, businessId);
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };
  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const product = await productService.createProduct(businessId, req.body);
      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };
  createProductsBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const result = await productService.createProductsBulk(businessId, req.body.products);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const product = await productService.updateProduct(req.params.id, businessId, req.body);
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };
  updateProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      if (!req.file) {
        throw createHttpError(400, "No se ha subido ninguna imagen");
      }
      const businessId = await this.getBusinessId(userId);
      const result = await productService.updateProductImage(req.params.id, businessId, req.file);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  softDeleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const result = await productService.softDeleteProduct(req.params.id, businessId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
  hardDeleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const result = await productService.hardDeleteProduct(req.params.id, businessId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
  restoreProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const result = await productService.restoreProduct(req.params.id, businessId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
  getDeletedProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };
      const result = await productService.getDeletedProducts(businessId, pagination);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
  getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const products = await productService.getLowStockProducts(businessId);
      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };
  updateStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { quantity, operation } = req.body;
      const product = await productService.updateStock(
        req.params.id,
        businessId,
        quantity,
        operation
      );
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };
  findByBarcode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const product = await productService.findByBarcode(businessId, req.params.barcode);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { message: "Producto no encontrado" },
        });
      }
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const categories = await productService.getCategories(businessId);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };
  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const category = await productService.createCategory(businessId, req.body.name);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };
  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { id } = req.params;
      const category = await productService.updateCategory(businessId, id, req.body.name);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };
  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw createHttpError(401, "Usuario no autenticado");
      const businessId = await this.getBusinessId(userId);
      const { id } = req.params;
      await productService.deleteCategory(businessId, id);
      res.json({
        success: true,
        message: "Categoría eliminada correctamente",
      });
    } catch (error) {
      next(error);
    }
  };
}
export const productController = new ProductController();

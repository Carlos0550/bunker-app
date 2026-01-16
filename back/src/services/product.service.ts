import { prisma } from "@/config/db";
import { Prisma, ProductState } from "@prisma/client";
import createHttpError from "http-errors";
import {
  uploadFileWithUniqueId,
  getFileUrl,
  deleteFile,
} from "@/utils/minio.util";
import { normalizeProductName } from "@/utils/text.util";
interface ProductFilters {
  search?: string;
  categoryId?: string;
  state?: ProductState;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}
interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
interface CreateProductData {
  name: string;
  stock?: number;
  bar_code?: string;
  description?: string;
  sku?: string;
  cost_price?: number;
  sale_price?: number;
  min_stock?: number;
  categoryId?: string;
  supplierId?: string;
  notes?: string;
  multipliers?: any;
}
interface UpdateProductData {
  name?: string;
  stock?: number;
  bar_code?: string;
  description?: string;
  state?: ProductState;
  sku?: string;
  cost_price?: number;
  sale_price?: number;
  min_stock?: number;
  reserved_stock?: number;
  categoryId?: string;
  supplierId?: string;
  notes?: string;
  system_message?: string;
  multipliers?: any;
}
class ProductService {
  async getProducts(
    businessId: string,
    filters: ProductFilters = {},
    pagination: PaginationOptions = {}
  ) {
    const { search, categoryId, state, lowStock, minPrice, maxPrice } = filters;
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * limit;
    const where: Prisma.ProductsWhereInput = {
      businessId,
      state: state || { not: ProductState.DELETED },
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { bar_code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (minPrice !== undefined) {
      where.sale_price = { ...(where.sale_price as any), gte: minPrice };
    }
    if (maxPrice !== undefined) {
      where.sale_price = { ...(where.sale_price as any), lte: maxPrice };
    }
    if (lowStock) {
      where.AND = [
        ...((where.AND as Prisma.ProductsWhereInput[]) || []),
        {
          stock: {
            lte: prisma.products.fields.min_stock as any,
          },
        },
      ];
    }
    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
          supplier: true,
        },
      }),
      prisma.products.count({ where }),
    ]);
    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter((p) => p.stock <= (p.min_stock || 0));
    }
    const productsWithUrls = await Promise.all(
      filteredProducts.map(async (product) => {
        let imageUrl = null;
        if (product.image) {
          try {
            imageUrl = await getFileUrl(product.image, 7 * 24 * 3600);
          } catch {}
        }
        return { ...product, imageUrl };
      })
    );
    return {
      data: productsWithUrls,
      pagination: {
        page,
        limit,
        total: lowStock ? filteredProducts.length : total,
        totalPages: Math.ceil(
          (lowStock ? filteredProducts.length : total) / limit
        ),
      },
    };
  }
  async getProductById(productId: string, businessId: string) {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        businessId,
        state: { not: ProductState.DELETED },
      },
      include: {
        category: true,
        supplier: true,
      },
    });
    if (!product) {
      throw createHttpError(404, "Producto no encontrado");
    }
    let imageUrl = null;
    if (product.image) {
      try {
        imageUrl = await getFileUrl(product.image, 7 * 24 * 3600);
      } catch {}
    }
    return { ...product, imageUrl };
  }
  async createProduct(businessId: string, data: CreateProductData) {
    const normalizedName = normalizeProductName(data.name);
    const existingByName = await this.findByNormalizedName(
      businessId,
      normalizedName
    );
    if (existingByName) {
      throw createHttpError(
        409,
        `Ya existe un producto con el nombre '${existingByName.name}'`
      );
    }
    if (data.sku) {
      const existingSku = await prisma.products.findFirst({
        where: {
          businessId,
          sku: data.sku,
          state: { not: ProductState.DELETED },
        },
      });
      if (existingSku) {
        throw createHttpError(
          409,
          `Ya existe un producto con el SKU '${data.sku}'`
        );
      }
    }
    if (data.bar_code) {
      const existingBarcode = await prisma.products.findFirst({
        where: {
          businessId,
          bar_code: data.bar_code,
          state: { not: ProductState.DELETED },
        },
      });
      if (existingBarcode) {
        throw createHttpError(
          409,
          `Ya existe un producto con el código de barras '${data.bar_code}'`
        );
      }
    }
    const product = await prisma.products.create({
      data: {
        name: data.name.trim(),
        stock: data.stock || 0,
        bar_code: data.bar_code,
        description: data.description,
        sku: data.sku,
        cost_price: data.cost_price,
        sale_price: data.sale_price,
        min_stock: data.min_stock || 5,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        notes: data.notes,
        businessId,
      },
      include: {
        category: true,
        supplier: true,
      },
    });
    return product;
  }
  async createProductsBulk(businessId: string, products: CreateProductData[]) {
    const results = {
      created: [] as any[],
      errors: [] as { index: number; error: string }[],
    };
    for (let i = 0; i < products.length; i++) {
      try {
        const product = await this.createProduct(businessId, products[i]);
        results.created.push(product);
      } catch (error) {
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
    return results;
  }
  async updateProduct(
    productId: string,
    businessId: string,
    data: UpdateProductData
  ) {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        businessId,
        state: { not: ProductState.DELETED },
      },
    });
    if (!product) {
      throw createHttpError(404, "Producto no encontrado");
    }
    if (
      data.name !== undefined &&
      normalizeProductName(data.name) !== normalizeProductName(product.name)
    ) {
      const existingByName = await this.findByNormalizedName(
        businessId,
        normalizeProductName(data.name),
        productId
      );
      if (existingByName) {
        throw createHttpError(
          409,
          `Ya existe un producto con el nombre '${existingByName.name}'`
        );
      }
    }
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await prisma.products.findFirst({
        where: {
          businessId,
          sku: data.sku,
          id: { not: productId },
          state: { not: ProductState.DELETED },
        },
      });
      if (existingSku) {
        throw createHttpError(
          409,
          `Ya existe un producto con el SKU '${data.sku}'`
        );
      }
    }
    if (data.bar_code && data.bar_code !== product.bar_code) {
      const existingBarcode = await prisma.products.findFirst({
        where: {
          businessId,
          bar_code: data.bar_code,
          id: { not: productId },
          state: { not: ProductState.DELETED },
        },
      });
      if (existingBarcode) {
        throw createHttpError(
          409,
          `Ya existe un producto con el código de barras '${data.bar_code}'`
        );
      }
    }
    const updateData: Prisma.ProductsUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.bar_code !== undefined) updateData.bar_code = data.bar_code;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.cost_price !== undefined) updateData.cost_price = data.cost_price;
    if (data.sale_price !== undefined) updateData.sale_price = data.sale_price;
    if (data.min_stock !== undefined) updateData.min_stock = data.min_stock;
    if (data.reserved_stock !== undefined)
      updateData.reserved_stock = data.reserved_stock;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.system_message !== undefined)
      updateData.system_message = data.system_message;
    if (data.categoryId !== undefined) {
      updateData.category = data.categoryId
        ? { connect: { id: data.categoryId } }
        : { disconnect: true };
    }
    if (data.supplierId !== undefined) {
      updateData.supplier = data.supplierId
        ? { connect: { id: data.supplierId } }
        : { disconnect: true };
    }
    if (
      data.stock !== undefined &&
      data.stock <= 0 &&
      data.state === undefined
    ) {
      updateData.state = ProductState.OUT_OF_STOCK;
    }
    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
        supplier: true,
      },
    });
    return updatedProduct;
  }
  async updateProductImage(
    productId: string,
    businessId: string,
    file: Express.Multer.File
  ) {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        businessId,
        state: { not: ProductState.DELETED },
      },
    });
    if (!product) {
      throw createHttpError(404, "Producto no encontrado");
    }
    if (product.image) {
      try {
        await deleteFile(product.image);
      } catch {}
    }
    const fileName = await uploadFileWithUniqueId(
      file.originalname,
      file.buffer,
      file.mimetype,
      "product-images"
    );
    await prisma.products.update({
      where: { id: productId },
      data: { image: fileName },
    });
    const url = await getFileUrl(fileName, 7 * 24 * 3600);
    return { url, fileName };
  }
  async softDeleteProduct(productId: string, businessId: string) {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        businessId,
        state: { not: ProductState.DELETED },
      },
    });
    if (!product) {
      throw createHttpError(404, "Producto no encontrado");
    }
    await prisma.products.update({
      where: { id: productId },
      data: {
        state: ProductState.DELETED,
        deletedAt: new Date(),
      },
    });
    return { message: "Producto eliminado correctamente" };
  }
  async hardDeleteProduct(productId: string, businessId: string) {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        businessId,
      },
    });
    if (!product) {
      throw createHttpError(404, "Producto no encontrado");
    }
    if (product.state !== ProductState.DELETED) {
      throw createHttpError(
        400,
        "Solo se pueden eliminar permanentemente productos que ya están en estado DELETED. " +
          "Primero realice un soft delete."
      );
    }
    const salesCount = await prisma.saleItem.count({
      where: { productId },
    });
    if (salesCount > 0) {
      throw createHttpError(
        400,
        `No se puede eliminar permanentemente este producto porque tiene ${salesCount} venta(s) asociada(s). ` +
          "Los productos con historial de ventas deben permanecer en el sistema."
      );
    }
    if (product.image) {
      try {
        await deleteFile(product.image);
      } catch {}
    }
    await prisma.products.delete({
      where: { id: productId },
    });
    return { message: "Producto eliminado permanentemente" };
  }
  async restoreProduct(productId: string, businessId: string) {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        businessId,
        state: ProductState.DELETED,
      },
    });
    if (!product) {
      throw createHttpError(404, "Producto eliminado no encontrado");
    }
    const newState =
      product.stock <= 0 ? ProductState.OUT_OF_STOCK : ProductState.ACTIVE;
    await prisma.products.update({
      where: { id: productId },
      data: {
        state: newState,
        deletedAt: null,
      },
    });
    return { message: "Producto restaurado correctamente" };
  }
  async getDeletedProducts(
    businessId: string,
    pagination: PaginationOptions = {}
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: {
          businessId,
          state: ProductState.DELETED,
        },
        skip,
        take: limit,
        orderBy: { deletedAt: "desc" },
      }),
      prisma.products.count({
        where: {
          businessId,
          state: ProductState.DELETED,
        },
      }),
    ]);
    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getLowStockProducts(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { lowStockThreshold: true },
    });
    const products = await prisma.products.findMany({
      where: {
        businessId,
        state: ProductState.ACTIVE,
      },
      include: {
        category: true,
      },
    });
    const lowStockProducts = products.filter((p) => {
      const threshold = p.min_stock || business?.lowStockThreshold || 10;
      return p.stock <= threshold;
    });
    return lowStockProducts.map((p) => ({
      ...p,
      threshold: p.min_stock || business?.lowStockThreshold || 10,
      deficit: (p.min_stock || business?.lowStockThreshold || 10) - p.stock,
    }));
  }
  async updateStock(
    productId: string,
    businessId: string,
    quantity: number,
    operation: "add" | "subtract" | "set"
  ) {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        businessId,
        state: { not: ProductState.DELETED },
      },
    });
    if (!product) {
      throw createHttpError(404, "Producto no encontrado");
    }
    let newStock: number;
    switch (operation) {
      case "add":
        newStock = product.stock + quantity;
        break;
      case "subtract":
        newStock = product.stock - quantity;
        if (newStock < 0) {
          throw createHttpError(400, "Stock insuficiente");
        }
        break;
      case "set":
        newStock = quantity;
        break;
    }
    const newState =
      newStock <= 0 ? ProductState.OUT_OF_STOCK : ProductState.ACTIVE;
    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        stock: newStock,
        state:
          product.state === ProductState.DISABLED ? product.state : newState,
      },
    });
    return updatedProduct;
  }
  async findByBarcode(businessId: string, barcode: string) {
    const product = await prisma.products.findFirst({
      where: {
        businessId,
        bar_code: barcode,
        state: { not: ProductState.DELETED },
      },
      include: {
        category: true,
      },
    });
    return product;
  }
  async findByNormalizedName(
    businessId: string,
    normalizedName: string,
    excludeProductId?: string
  ) {
    const products = await prisma.products.findMany({
      where: {
        businessId,
        state: { not: ProductState.DELETED },
        ...(excludeProductId && { id: { not: excludeProductId } }),
      },
      select: { id: true, name: true },
    });
    return (
      products.find((p) => normalizeProductName(p.name) === normalizedName) ||
      null
    );
  }
  async checkNameExists(
    businessId: string,
    name: string,
    excludeProductId?: string
  ): Promise<boolean> {
    const normalized = normalizeProductName(name);
    const existing = await this.findByNormalizedName(
      businessId,
      normalized,
      excludeProductId
    );
    return !!existing;
  }
  async validateProductNames(
    businessId: string,
    names: string[]
  ): Promise<{
    duplicatesInDb: { name: string; existingName: string }[];
    duplicatesInList: { name: string; count: number }[];
  }> {
    const existingProducts = await prisma.products.findMany({
      where: {
        businessId,
        state: { not: ProductState.DELETED },
      },
      select: { name: true },
    });
    const existingNormalizedMap = new Map<string, string>();
    existingProducts.forEach((p) => {
      existingNormalizedMap.set(normalizeProductName(p.name), p.name);
    });
    const duplicatesInDb: { name: string; existingName: string }[] = [];
    const normalizedNamesInList = new Map<
      string,
      { original: string; count: number }
    >();
    for (const name of names) {
      const normalized = normalizeProductName(name);
      const existingName = existingNormalizedMap.get(normalized);
      if (existingName) {
        if (
          !duplicatesInDb.some(
            (d) => normalizeProductName(d.name) === normalized
          )
        ) {
          duplicatesInDb.push({ name, existingName });
        }
      }
      const existing = normalizedNamesInList.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        normalizedNamesInList.set(normalized, { original: name, count: 1 });
      }
    }
    const duplicatesInList: { name: string; count: number }[] = [];
    normalizedNamesInList.forEach((value, _key) => {
      if (value.count > 1) {
        duplicatesInList.push({ name: value.original, count: value.count });
      }
    });
    return { duplicatesInDb, duplicatesInList };
  }
  async getCategories(businessId: string) {
    return prisma.categories.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });
  }
  async createCategory(businessId: string, name: string) {
    const existing = await prisma.categories.findFirst({
      where: { businessId, name },
    });
    if (existing) {
      throw createHttpError(409, `La categoría '${name}' ya existe`);
    }
    return prisma.categories.create({
      data: { name, businessId },
    });
  }
  async updateCategory(businessId: string, categoryId: string, name: string) {
    const category = await prisma.categories.findFirst({
      where: { id: categoryId, businessId },
    });
    if (!category) {
      throw createHttpError(404, "Categoría no encontrada");
    }
    const existing = await prisma.categories.findFirst({
      where: { businessId, name, NOT: { id: categoryId } },
    });
    if (existing) {
      throw createHttpError(
        409,
        `Ya existe otra categoría con el nombre '${name}'`
      );
    }
    return prisma.categories.update({
      where: { id: categoryId },
      data: { name },
    });
  }
  async deleteCategory(businessId: string, categoryId: string) {
    const category = await prisma.categories.findFirst({
      where: { id: categoryId, businessId },
      include: { _count: { select: { products: true } } },
    });
    if (!category) {
      throw createHttpError(404, "Categoría no encontrada");
    }
    if (category._count.products > 0) {
      throw createHttpError(
        400,
        `No se puede eliminar la categoría porque tiene ${category._count.products} producto(s) asociado(s)`
      );
    }
    await prisma.categories.delete({
      where: { id: categoryId },
    });
    return { success: true };
  }
}
export const productService = new ProductService();

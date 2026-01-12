import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { prisma } from "@/config/db";
import { ProductState, Prisma } from "@prisma/client";
import createHttpError from "http-errors";
import { normalizeProductName } from "@/utils/text.util";
export const SYSTEM_PRODUCT_COLUMNS = [
  { key: "name", label: "Nombre del Producto", required: true },
  { key: "sku", label: "SKU / Código", required: false },
  { key: "bar_code", label: "Código de Barras", required: false },
  { key: "description", label: "Descripción", required: false },
  { key: "cost_price", label: "Precio de Costo", required: false },
  { key: "sale_price", label: "Precio de Venta", required: true },
  { key: "stock", label: "Stock Inicial", required: false },
  { key: "min_stock", label: "Stock Mínimo", required: false },
  { key: "category", label: "Categoría", required: false },
  { key: "supplier", label: "Proveedor", required: false },
  { key: "notes", label: "Notas", required: false },
];
const COLUMN_SYNONYMS: Record<string, string[]> = {
  name: ["nombre", "producto", "name", "product", "descripcion producto", "item", "articulo"],
  sku: ["sku", "codigo", "code", "cod", "codigo producto", "product code", "ref", "referencia"],
  bar_code: ["codigo de barras", "barcode", "bar_code", "ean", "upc", "codigo barras"],
  description: ["descripcion", "description", "desc", "detalle", "detail"],
  cost_price: ["costo", "cost", "precio costo", "cost price", "precio compra", "purchase price"],
  sale_price: ["precio", "price", "precio venta", "sale price", "pvp", "precio unitario", "unit price"],
  stock: ["stock", "cantidad", "qty", "quantity", "existencia", "inventario", "inventory"],
  min_stock: ["stock minimo", "min stock", "minimo", "minimum", "reorder point"],
  category: ["categoria", "category", "cat", "tipo", "type", "familia", "family"],
  supplier: ["proveedor", "supplier", "vendor", "provider"],
  notes: ["notas", "notes", "observaciones", "comments", "comentarios"],
};
interface ParsedFile {
  headers: string[];
  previewData: Record<string, any>[];
  totalRows: number;
  suggestedMapping: Record<string, string>;
}
interface ColumnMapping {
  [fileColumn: string]: string;
}
interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: { row: number; error: string }[];
}
interface ValidationResult {
  totalProducts: number;
  duplicatesInDb: { name: string; existingName: string }[];
  duplicatesInList: { name: string; count: number }[];
  hasDuplicates: boolean;
}
class ImportService {
  async parseFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<ParsedFile> {
    const extension = fileName.split(".").pop()?.toLowerCase();
    let data: any[][] = [];
    try {
      if (extension === "csv" || mimeType === "text/csv") {
        const content = fileBuffer.toString("utf-8");
        data = parse(content, {
          skip_empty_lines: true,
          relax_column_count: true,
        });
      } else if (
        ["xlsx", "xls"].includes(extension || "") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("excel")
      ) {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      } else {
        throw createHttpError(400, "Formato de archivo no soportado. Use CSV, XLS o XLSX.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("no soportado")) {
        throw error;
      }
      throw createHttpError(400, "Error al leer el archivo. Verifique que el formato sea correcto.");
    }
    if (data.length < 2) {
      throw createHttpError(400, "El archivo debe contener al menos una fila de headers y una de datos.");
    }
    const headers = (data[0] as string[])
      .map((h) => String(h || "").trim())
      .filter((h) => h !== "");
    if (headers.length === 0) {
      throw createHttpError(400, "No se encontraron headers válidos en el archivo.");
    }
    const previewData: Record<string, any>[] = [];
    for (let i = 1; i < Math.min(data.length, 6); i++) {
      const row = data[i] as any[];
      const rowData: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] !== undefined ? String(row[index]) : "";
      });
      previewData.push(rowData);
    }
    const suggestedMapping = this.suggestMapping(headers);
    return {
      headers,
      previewData,
      totalRows: data.length - 1,
      suggestedMapping,
    };
  }
  private suggestMapping(fileHeaders: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    for (const header of fileHeaders) {
      const normalizedHeader = header.toLowerCase().trim();
      for (const [systemKey, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
        if (
          synonyms.some(
            (syn) =>
              normalizedHeader === syn ||
              normalizedHeader.includes(syn) ||
              syn.includes(normalizedHeader)
          )
        ) {
          mapping[header] = systemKey;
          break;
        }
      }
    }
    return mapping;
  }
  async validateImport(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    columnMapping: ColumnMapping,
    businessId: string
  ): Promise<ValidationResult> {
    const extension = fileName.split(".").pop()?.toLowerCase();
    let data: any[][] = [];
    if (extension === "csv" || mimeType === "text/csv") {
      const content = fileBuffer.toString("utf-8");
      data = parse(content, { skip_empty_lines: true, relax_column_count: true });
    } else {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    }
    const headers = (data[0] as string[]).map((h) => String(h || "").trim());
    const headerIndexMap: Record<string, number> = {};
    headers.forEach((h, i) => (headerIndexMap[h] = i));
    const productNames: string[] = [];
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex] as any[];
      const nameColumn = Object.entries(columnMapping).find(([_, sysKey]) => sysKey === "name")?.[0];
      if (nameColumn) {
        const colIndex = headerIndexMap[nameColumn];
        if (colIndex !== undefined) {
          const name = String(row[colIndex] || "").trim();
          if (name) {
            productNames.push(name);
          }
        }
      }
    }
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
    const normalizedNamesInList = new Map<string, { original: string; count: number }>();
    const seenDuplicates = new Set<string>();
    for (const name of productNames) {
      const normalized = normalizeProductName(name);
      const existingName = existingNormalizedMap.get(normalized);
      if (existingName && !seenDuplicates.has(normalized)) {
        duplicatesInDb.push({ name, existingName });
        seenDuplicates.add(normalized);
      }
      const existing = normalizedNamesInList.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        normalizedNamesInList.set(normalized, { original: name, count: 1 });
      }
    }
    const duplicatesInList: { name: string; count: number }[] = [];
    normalizedNamesInList.forEach((value) => {
      if (value.count > 1) {
        duplicatesInList.push({ name: value.original, count: value.count });
      }
    });
    return {
      totalProducts: productNames.length,
      duplicatesInDb,
      duplicatesInList,
      hasDuplicates: duplicatesInDb.length > 0 || duplicatesInList.length > 0,
    };
  }
  async processImport(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    columnMapping: ColumnMapping,
    businessId: string,
    skipDuplicates: boolean = false
  ): Promise<ImportResult> {
    const extension = fileName.split(".").pop()?.toLowerCase();
    let data: any[][] = [];
    if (extension === "csv" || mimeType === "text/csv") {
      const content = fileBuffer.toString("utf-8");
      data = parse(content, { skip_empty_lines: true, relax_column_count: true });
    } else {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    }
    const headers = (data[0] as string[]).map((h) => String(h || "").trim());
    const headerIndexMap: Record<string, number> = {};
    headers.forEach((h, i) => (headerIndexMap[h] = i));
    const existingCategories = await prisma.categories.findMany({
      where: { businessId },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c.id]));
    const existingSuppliers = await prisma.providers.findMany({
      where: { businessId },
      select: { id: true, name: true },
    });
    const supplierMap = new Map(existingSuppliers.map((s) => [s.name.toLowerCase(), s.id]));
    let existingNormalizedNames = new Set<string>();
    if (skipDuplicates) {
      const existingProducts = await prisma.products.findMany({
        where: {
          businessId,
          state: { not: ProductState.DELETED },
        },
        select: { name: true },
      });
      existingNormalizedNames = new Set(existingProducts.map((p) => normalizeProductName(p.name)));
    }
    const importedNormalizedNames = new Set<string>();
    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };
    const productsToCreate: Prisma.ProductsCreateManyInput[] = [];
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex] as any[];
      try {
        const getValue = (systemKey: string): string => {
          const fileColumn = Object.entries(columnMapping).find(
            ([_, sysKey]) => sysKey === systemKey
          )?.[0];
          if (!fileColumn) return "";
          const colIndex = headerIndexMap[fileColumn];
          if (colIndex === undefined) return "";
          return String(row[colIndex] || "").trim();
        };
        const name = getValue("name");
        const salePriceStr = getValue("sale_price");
        if (!name) {
          throw new Error("El nombre del producto es requerido");
        }
        const normalizedName = normalizeProductName(name);
        if (skipDuplicates) {
          if (existingNormalizedNames.has(normalizedName)) {
            result.skipped++;
            continue;
          }
          if (importedNormalizedNames.has(normalizedName)) {
            result.skipped++;
            continue;
          }
        }
        const salePrice = parseFloat(salePriceStr.replace(/[^0-9.-]/g, ""));
        if (isNaN(salePrice) || salePrice < 0) {
          throw new Error("El precio de venta debe ser un número válido");
        }
        const costPriceStr = getValue("cost_price");
        const costPrice = costPriceStr ? parseFloat(costPriceStr.replace(/[^0-9.-]/g, "")) : null;
        const stockStr = getValue("stock");
        const stock = stockStr ? parseInt(stockStr.replace(/[^0-9-]/g, ""), 10) : 0;
        const minStockStr = getValue("min_stock");
        const minStock = minStockStr ? parseInt(minStockStr.replace(/[^0-9-]/g, ""), 10) : null;
        let categoryId: string | null = null;
        const categoryName = getValue("category");
        if (categoryName) {
          const existingCatId = categoryMap.get(categoryName.toLowerCase());
          if (existingCatId) {
            categoryId = existingCatId;
          } else {
            const newCategory = await prisma.categories.create({
              data: { name: categoryName, businessId },
            });
            categoryMap.set(categoryName.toLowerCase(), newCategory.id);
            categoryId = newCategory.id;
          }
        }
        let supplierId: string | null = null;
        const supplierName = getValue("supplier");
        if (supplierName) {
          const existingSupplierId = supplierMap.get(supplierName.toLowerCase());
          if (existingSupplierId) {
            supplierId = existingSupplierId;
          } else {
            const newSupplier = await prisma.providers.create({
              data: { name: supplierName, businessId },
            });
            supplierMap.set(supplierName.toLowerCase(), newSupplier.id);
            supplierId = newSupplier.id;
          }
        }
        let sku = getValue("sku");
        if (!sku) {
          sku = `SKU-${Date.now()}-${rowIndex}`;
        }
        productsToCreate.push({
          name: name.trim(),
          sku,
          bar_code: getValue("bar_code") || null,
          description: getValue("description") || null,
          cost_price: costPrice !== null && !isNaN(costPrice) ? costPrice : null,
          sale_price: salePrice,
          stock: isNaN(stock) ? 1 : stock,
          min_stock: minStock !== null && !isNaN(minStock) ? minStock : undefined,
          notes: getValue("notes") || null,
          state: stock > 0 ? ProductState.ACTIVE : ProductState.OUT_OF_STOCK,
          businessId,
          categoryId,
          supplierId,
        });
        importedNormalizedNames.add(normalizedName);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowIndex + 1,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
    if (productsToCreate.length > 0) {
      try {
        await prisma.products.createMany({
          data: productsToCreate,
          skipDuplicates: true,
        });
      } catch (error) {
        result.success = 0;
        for (let i = 0; i < productsToCreate.length; i++) {
          try {
            await prisma.products.create({ data: productsToCreate[i] });
            result.success++;
          } catch (err) {
            result.failed++;
            result.errors.push({
              row: i + 2,
              error: err instanceof Error ? err.message : "Error al crear producto",
            });
          }
        }
      }
    }
    return result;
  }
  getSystemColumns() {
    return SYSTEM_PRODUCT_COLUMNS;
  }
}
export const importService = new ImportService();

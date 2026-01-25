import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { parse as parseStream } from "csv-parse";
import * as fs from "fs";
import { prisma } from "@/config/db";
import { ProductState, Prisma } from "@prisma/client";
import createHttpError from "http-errors";
import { normalizeProductName } from "@/utils/text.util";
import {
  ParsedFile,
  ColumnMapping,
  ImportResult,
  ValidationResult,
} from "@/types";
import { stringify } from "csv-stringify";


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

class ImportService {
  async parseFile(filePath: string, originalName: string, mimeType: string): Promise<ParsedFile> {
    const extension = originalName.split(".").pop()?.toLowerCase();
    let headers: string[] = [];
    const previewData: Record<string, any>[] = [];
    let totalRows = 0;

    try {
      if (extension === "csv" || mimeType === "text/csv") {
        const parser = fs.createReadStream(filePath).pipe(
          parseStream({
            delimiter: [",", ";", "\t", "|"], 
            columns: false,
            to: 6,
            skip_empty_lines: true,
            relax_column_count: true
          })
        );
        
        let rowCount = 0;
        for await (const row of parser) {
          if (rowCount === 0) {
            headers = (row as string[]).map(h => String(h || "").trim()).filter(h => h !== "");
          } else {
             const rowData: Record<string, any> = {};
             headers.forEach((header, index) => {
               rowData[header] = row[index] !== undefined ? String(row[index]) : "";
             });
             previewData.push(rowData);
          }
          rowCount++;
        }
        totalRows = await this.countFileLines(filePath) - 1;
        
      } else if (
        ["xlsx", "xls"].includes(extension || "") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("excel")
      ) {
        const workbook = XLSX.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
        
        const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: "" })[0] as string[];
        headers = headerRow.map(h => String(h || "").trim()).filter(h => h !== "");
        
        const previewRows = XLSX.utils.sheet_to_json(worksheet, { header: headers, range: 1, defval: "" }).slice(0, 5) as any[];
        previewData.push(...previewRows);
        totalRows = range.e.r; 
      } else {
        throw createHttpError(400, "Formato de archivo no soportado. Use CSV, XLS o XLSX.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("no soportado")) {
        throw error;
      }
      console.error(error);
      throw createHttpError(400, "Error al leer el archivo. Verifique que el formato sea correcto.");
    }

    if (headers.length === 0) {
      throw createHttpError(400, "No se encontraron headers válidos en el archivo.");
    }

    const suggestedMapping = this.suggestMapping(headers);

    return {
      headers,
      previewData,
      totalRows: totalRows > 0 ? totalRows : 0, 
      suggestedMapping,
    };
  }

  private async countFileLines(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let lineCount = 0;
      fs.createReadStream(filePath)
        .on("data", (buffer: Buffer) => {
          let idx = -1;
          while ((idx = buffer.indexOf(10, idx + 1)) !== -1) {
            lineCount++;
          }
        })
        .on("end", () => {
          
          resolve(lineCount + 1);
        })
        .on("error", reject);
    });
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
    filePath: string,
    originalName: string,
    mimeType: string,
    columnMapping: ColumnMapping,
    businessId: string
  ): Promise<ValidationResult> {
    const extension = originalName.split(".").pop()?.toLowerCase();
    
    
    const duplicatesInDbMap = new Map<string, { name: string; existingName: string }>();
    
    
    const nameColumnHeader = Object.keys(columnMapping).find(key => columnMapping[key] === "name") || "name";

    
    const BATCH_SIZE = 5000;
    
    const checkBatch = async (batchItems: { normalized: string; original: string }[]) => {
      if (batchItems.length === 0) return;
      
      
      const uniqueNames = [...new Set(batchItems.map(i => i.original))];
      
      try {
        const existing = await prisma.products.findMany({
          where: {
            businessId,
            name: { in: uniqueNames },
          },
          select: { name: true }
        });
        
        if (existing.length === 0) return;
        
        
        const existingMap = new Map<string, string>();
        for (const p of existing) {
          existingMap.set(normalizeProductName(p.name), p.name);
        }
        
        
        for (const item of batchItems) {
          if (existingMap.has(item.normalized) && !duplicatesInDbMap.has(item.normalized)) {
            duplicatesInDbMap.set(item.normalized, { 
              name: item.original, 
              existingName: existingMap.get(item.normalized)! 
            });
          }
        }
      } catch (e) {
        console.error("Batch check error", e);
      }
    };

    let totalProducts = 0;
    const seenInFile = new Map<string, { original: string, count: number }>();
    let batch: { normalized: string, original: string }[] = [];

    
    const processRow = (row: any) => {
      const name = String(row[nameColumnHeader] ?? "").trim();
      if (!name) return;
      
      totalProducts++;
      const normalized = normalizeProductName(name);
      
      const existing = seenInFile.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        seenInFile.set(normalized, { original: name, count: 1 });
        
        batch.push({ normalized, original: name });
      }
    };

    if (extension === "csv" || mimeType === "text/csv") {
      const parser = fs.createReadStream(filePath).pipe(
        parseStream({
          delimiter: [",", ";", "\t", "|"], 
          columns: true,
          skip_empty_lines: true,
          relax_column_count: true,
          trim: true
        })
      );
      
      for await (const row of parser) {
        processRow(row);
        
        if (batch.length >= BATCH_SIZE) {
          await checkBatch(batch);
          batch = [];
        }
      }
    } else {
      const workbook = XLSX.readFile(filePath);
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
      
      for (const row of data) {
        processRow(row);
        
        if (batch.length >= BATCH_SIZE) {
          await checkBatch(batch);
          batch = [];
        }
      }
    }

    
    await checkBatch(batch);
    
    
    const duplicatesInList: { name: string; count: number }[] = [];
    for (const [_, val] of seenInFile) {
      if (val.count > 1) {
        duplicatesInList.push({ name: val.original, count: val.count });
      }
    }

    
    const duplicatesInDb = Array.from(duplicatesInDbMap.values());

    return {
      totalProducts,
      duplicatesInDb: duplicatesInDb.slice(0, 100),
      duplicatesInList: duplicatesInList.slice(0, 100),
      hasDuplicates: duplicatesInDb.length > 0 || duplicatesInList.length > 0,
    };
  }

  async processImport(
    filePath: string,
    originalName: string,
    mimeType: string,
    columnMapping: ColumnMapping,
    businessId: string,
    skipDuplicates: boolean = false
  ): Promise<ImportResult> {
    const extension = originalName.split(".").pop()?.toLowerCase();
    
    
    const reverseMapping: Record<string, string> = {};
    for (const [fileHeader, systemKey] of Object.entries(columnMapping)) {
      reverseMapping[systemKey] = fileHeader;
    }
    
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

    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };
    
    
    const BATCH_SIZE = 5000;
    let rowsBatch: { row: any; rowIndex: number }[] = [];
    
    
    const skuBase = Date.now().toString(36);
    let skuCounter = 0;

    const processBatch = async () => {
        if (rowsBatch.length === 0) return;

        const batchCategories = new Set<string>();
        const batchSuppliers = new Set<string>();
        const rowsToProcess: { row: any; rowIndex: number; name: string; category: string; supplier: string }[] = [];

        
        const getValue = (row: any, systemKey: string): string => {
          const fileHeader = reverseMapping[systemKey];
          if (!fileHeader) return "";
          return String(row[fileHeader] ?? "").trim();
        };

        for (const { row, rowIndex } of rowsBatch) {
            const name = getValue(row, "name");
            if (!name) continue; 
            
            const category = getValue(row, "category");
            if (category) batchCategories.add(category);
            
            const supplier = getValue(row, "supplier");
            if (supplier) batchSuppliers.add(supplier);
            
            rowsToProcess.push({ row, rowIndex, name, category, supplier });
        }

        
        const newCategories = Array.from(batchCategories).filter(c => !categoryMap.has(c.toLowerCase()));
        if (newCategories.length > 0) {
            await prisma.categories.createMany({
                data: newCategories.map(name => ({ name, businessId })),
                skipDuplicates: true
            });
            
            const createdCats = await prisma.categories.findMany({ 
              where: { businessId, name: { in: newCategories } },
              select: { id: true, name: true }
            });
            createdCats.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));
        }

        const newSuppliers = Array.from(batchSuppliers).filter(s => !supplierMap.has(s.toLowerCase()));
        if (newSuppliers.length > 0) {
            await prisma.providers.createMany({
                data: newSuppliers.map(name => ({ name, businessId })),
                skipDuplicates: true
            });
            
            const createdSups = await prisma.providers.findMany({ 
              where: { businessId, name: { in: newSuppliers } },
              select: { id: true, name: true }
            });
            createdSups.forEach(s => supplierMap.set(s.name.toLowerCase(), s.id));
        }

        const productsToInsert: Prisma.ProductsCreateManyInput[] = [];
        const rowIndexMap: number[] = []; 

        for (const { row, rowIndex, name, category, supplier } of rowsToProcess) {
             try {
                 const salePriceStr = getValue(row, "sale_price");
                 const salePrice = parseFloat(salePriceStr.replace(/[^0-9.-]/g, ""));
                 if (isNaN(salePrice) || salePrice < 0) {
                      throw new Error(`Precio inválido para: ${name}`);
                 }
                 
                 const costPriceStr = getValue(row, "cost_price");
                 const costPrice = costPriceStr ? parseFloat(costPriceStr.replace(/[^0-9.-]/g, "")) : null;
                 
                 const stockStr = getValue(row, "stock");
                 const stock = stockStr ? parseInt(stockStr.replace(/[^0-9-]/g, ""), 10) : 0;
                 
                 const minStockStr = getValue(row, "min_stock");
                 const minStock = minStockStr ? parseInt(minStockStr.replace(/[^0-9-]/g, ""), 10) : null;
    
                 const categoryId = category ? categoryMap.get(category.toLowerCase()) ?? null : null;
                 const supplierId = supplier ? supplierMap.get(supplier.toLowerCase()) ?? null : null;
    
                 let sku = getValue(row, "sku");
                 if (!sku) {
                   sku = `SKU-${skuBase}-${skuCounter++}`;
                 }
    
                 productsToInsert.push({
                     name: name.trim(),
                     sku,
                     bar_code: getValue(row, "bar_code") || null,
                     description: getValue(row, "description") || null,
                     cost_price: costPrice,
                     sale_price: salePrice,
                     stock: isNaN(stock) ? 0 : stock,
                     min_stock: minStock || undefined,
                     notes: getValue(row, "notes") || null,
                     state: stock > 0 ? ProductState.ACTIVE : ProductState.OUT_OF_STOCK,
                     businessId,
                     categoryId,
                     supplierId,
                 });
                 rowIndexMap.push(rowIndex);

             } catch (error) {
                 result.failed++;
                 if (result.errors.length < 50) {
                      result.errors.push({
                         row: rowIndex,
                         error: error instanceof Error ? error.message : "Error desconocido"
                      });
                 }
             }
        }

        if (productsToInsert.length > 0) {
            try {
                const createResult = await prisma.products.createMany({
                    data: productsToInsert,
                    skipDuplicates: skipDuplicates 
                });
                result.success += createResult.count;
                result.skipped += (productsToInsert.length - createResult.count);
            } catch (error) {
                console.error("Batch insert error:", error);
                
                for (let i = 0; i < productsToInsert.length; i++) {
                    const p = productsToInsert[i];
                    const rowIndex = rowIndexMap[i];
                    try {
                        await prisma.products.create({ data: p });
                        result.success++;
                    } catch (e) {
                         if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                             if (skipDuplicates) {
                                result.skipped++;
                             } else {
                                result.failed++;
                                if (result.errors.length < 50) {
                                  result.errors.push({
                                      row: rowIndex,
                                      error: `Producto duplicado: ${p.name || p.sku}`
                                  });
                                }
                             }
                         } else {
                             result.failed++;
                         }
                    }
                }
            }
        }
        
        
        rowsBatch = [];
    };

    try {
        if (extension === "csv" || mimeType === "text/csv") {
             const parser = fs.createReadStream(filePath).pipe(
                parseStream({
                  delimiter: [",", ";", "\t", "|"],
                  columns: true,
                  skip_empty_lines: true,
                  relax_column_count: true,
                  trim: true
                })
             );
             
             let rowIndex = 2;
             try {
                 for await (const row of parser) {
                     rowsBatch.push({ row, rowIndex });
                     rowIndex++;
                     
                     if (rowsBatch.length >= BATCH_SIZE) {
                         await processBatch();
                     }
                 }
             } catch (error) {
                 console.error("CSV Parsing Error:", error);
                 throw createHttpError(400, `Error al leer el archivo CSV en la fila ${rowIndex}: ${error instanceof Error ? error.message : "Formato inválido"}`);
             }
             await processBatch(); 
             
        } else {
             const workbook = XLSX.readFile(filePath);
             const sheet = workbook.Sheets[workbook.SheetNames[0]];
             const data = XLSX.utils.sheet_to_json(sheet) as any[];
             
             let rowIndex = 2;
             for (const row of data) {
                 rowsBatch.push({ row, rowIndex });
                 rowIndex++;
                 if (rowsBatch.length >= BATCH_SIZE) {
                     await processBatch();
                 }
             }
             await processBatch();
        }
    } finally {
        
    }

    return result;
  }

  getSystemColumns() {
    return SYSTEM_PRODUCT_COLUMNS;
  }
}
export const importService = new ImportService();

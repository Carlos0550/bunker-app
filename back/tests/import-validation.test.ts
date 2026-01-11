
import { importService } from "../src/services/import.service";
import { featureService, FEATURE_CODES } from "../src/services/feature.service";
import createHttpError from "http-errors";

// Mock de FeatureService para evitar llamadas reales a la DB
jest.mock("../src/services/feature.service", () => ({
  featureService: {
    getBusinessFeatureValue: jest.fn(),
    checkProductLimit: jest.fn(),
  },
  FEATURE_CODES: {
    IMPORT_LIMIT: "IMPORT_LIMIT",
    MAX_PRODUCTS: "MAX_PRODUCTS",
  }
}));

// Mock de Prisma para evitar escrituras reales
jest.mock("@/config/db", () => ({
  prisma: {
    categories: { findMany: jest.fn().mockResolvedValue([]) },
    providers: { findMany: jest.fn().mockResolvedValue([]) },
    products: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
  }
}));

describe("ImportService Validation", () => {
  const businessId = "test-business-id";
  const mockFileBuffer = Buffer.from("name,sale_price\nProd1,100\nProd2,200");
  const mockFileName = "test.csv";
  const mockMimeType = "text/csv";
  const mockMapping = { "name": "name", "sale_price": "sale_price" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should allow import if within limits", async () => {
    // Setup mocks
    (featureService.getBusinessFeatureValue as jest.Mock).mockResolvedValue(1000); // Limit 1000 per file
    (featureService.checkProductLimit as jest.Mock).mockResolvedValue({ 
      allowed: true, 
      limit: 5000, 
      current: 100 
    });

    // Mock parseFile to return 2 rows
    // Note: We are testing processImport which re-parses the file. 
    // In a real unit test we would mock the private/internal methods or the CSV parser,
    // but here we are testing the flow logic. 
    // Since processImport parses the buffer, our small buffer has 2 rows.
    
    const result = await importService.processImport(
      mockFileBuffer, 
      mockFileName, 
      mockMimeType, 
      mockMapping, 
      businessId
    );

    expect(result).toBeDefined();
    // It should proceed (success or fail on data, but not throw 400/403 limit error)
  });

  test("Should block import if file size exceeds IMPORT_LIMIT", async () => {
    (featureService.getBusinessFeatureValue as jest.Mock).mockResolvedValue(1); // Limit 1 per file
    (featureService.checkProductLimit as jest.Mock).mockResolvedValue({ 
      allowed: true, 
      limit: 5000, 
      current: 100 
    });

    // Our file has 2 rows, limit is 1 -> Should throw
    await expect(
      importService.processImport(mockFileBuffer, mockFileName, mockMimeType, mockMapping, businessId)
    ).rejects.toThrow("su plan solo permite importar hasta 1 productos por vez");
  });

  test("Should block import if total products exceeds MAX_PRODUCTS", async () => {
    (featureService.getBusinessFeatureValue as jest.Mock).mockResolvedValue(1000);
    (featureService.checkProductLimit as jest.Mock).mockResolvedValue({ 
      allowed: true, 
      limit: 101, 
      current: 100 // Only 1 space left
    });

    // File has 2 rows -> 100 + 2 = 102 > 101 -> Should throw
    await expect(
      importService.processImport(mockFileBuffer, mockFileName, mockMimeType, mockMapping, businessId)
    ).rejects.toThrow("No es posible importar 2 productos");
  });

  test("Should allow unlimited imports", async () => {
    (featureService.getBusinessFeatureValue as jest.Mock).mockResolvedValue(-1); // Unlimited file size
    (featureService.checkProductLimit as jest.Mock).mockResolvedValue({ 
      allowed: true, 
      limit: -1, // Unlimited products
      current: 10000 
    });

    const result = await importService.processImport(
      mockFileBuffer, 
      mockFileName, 
      mockMimeType, 
      mockMapping, 
      businessId
    );

    expect(result).toBeDefined();
  });
});

export interface ParsedFile {
  headers: string[];
  previewData: Record<string, any>[];
  totalRows: number;
  suggestedMapping: Record<string, string>;
}

export interface ColumnMapping {
  [fileColumn: string]: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

export interface ValidationResult {
  totalProducts: number;
  duplicatesInDb: { name: string; existingName: string }[];
  duplicatesInList: { name: string; count: number }[];
  hasDuplicates: boolean;
}

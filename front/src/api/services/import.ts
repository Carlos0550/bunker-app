import client from '../client';

export interface SystemColumn {
  key: string;
  label: string;
  required: boolean;
}

export interface AnalyzeResult {
  sessionId: string;
  headers: string[];
  previewData: Record<string, any>[];
  totalRows: number;
  suggestedMapping: Record<string, string>;
  systemColumns: SystemColumn[];
}

export interface ImportResult {
  imported: number;
  failed: number;
  skipped: number;
  errors: { row: number; error: string }[];
  totalErrors: number;
}

export interface ValidationResult {
  totalProducts: number;
  duplicatesInDb: { name: string; existingName: string }[];
  duplicatesInList: { name: string; count: number }[];
  hasDuplicates: boolean;
}

export interface ColumnMapping {
  [fileColumn: string]: string;
}

export const importApi = {
  
  getSystemColumns: async (): Promise<SystemColumn[]> => {
    const response = await client.get<{ success: boolean; data: SystemColumn[] }>('/import/columns');
    return response.data.data;
  },

  
  analyzeFile: async (file: File): Promise<AnalyzeResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await client.post<{ success: boolean; data: AnalyzeResult }>(
      '/import/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, 
      }
    );
    return response.data.data;
  },

  
  validateImport: async (sessionId: string, columnMapping: ColumnMapping): Promise<ValidationResult> => {
    const response = await client.post<{ success: boolean; data: ValidationResult }>(
      '/import/validate',
      { sessionId, columnMapping },
      { timeout: 600000 } 
    );
    return response.data.data;
  },

  
  processImport: async (
    sessionId: string,
    columnMapping: ColumnMapping,
    skipDuplicates: boolean = false
  ): Promise<ImportResult> => {
    const response = await client.post<{ success: boolean; data: ImportResult }>(
      '/import/process',
      { sessionId, columnMapping, skipDuplicates },
      { timeout: 600000 } 
    );
    return response.data.data;
  },

  
  cancelImport: async (sessionId: string): Promise<void> => {
    await client.post('/import/cancel', { sessionId });
  },
};

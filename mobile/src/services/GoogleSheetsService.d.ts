declare module '../../services/GoogleSheetsService' {
  export const importBooksFromSheets: () => Promise<{
    success: boolean;
    books?: any[];
    count?: number;
    error?: string;
  }>;
}
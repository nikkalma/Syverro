// src/services/CSVImportService.ts
import * as FileSystem from 'expo-file-system';

interface CSVBook {
  title?: string;
  author?: string;
  status?: string;
  rating?: string;
  totalPages?: string;
  genres?: string;
  notes?: string;
  review?: string;
}

interface ImportResult {
  success: boolean;
  books?: any[];
  count?: number;
  error?: string;
}

const convertStatus = (status: string): string => {
  const map: Record<string, string> = {
    'Прочитано': 'finished',
    'Читаю': 'reading',
    'В планах': 'planned',
    'Отложено': 'postponed',
    'Брошено': 'abandoned',
    'finished': 'finished',
    'reading': 'reading',
    'planned': 'planned',
  };
  return map[status] || 'planned';
};

export const importBooksFromCSV = async (csvPath?: string): Promise<ImportResult> => {
  try {
    const defaultPath = FileSystem.bundleDirectory + 'assets/books.csv';
    const path = csvPath || defaultPath;
    
    const csvContent = await FileSystem.readAsStringAsync(path);
    const lines = csvContent.split(/\r?\n/);
    
    if (lines.length === 0) {
      return { success: false, error: 'CSV файл пуст' };
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/["']/g, '').trim());
    const books: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.replace(/["']/g, '').trim());
      const book: any = {};
      
      for (let j = 0; j < headers.length; j++) {
        let value = values[j] || '';
        const header = headers[j];
        
        if (header === 'rating' || header === 'totalPages') {
          value = value ? parseInt(value) : 0;
        }
        if (header === 'genres' && value) {
          value = value.split(',').map((g: string) => g.trim());
        }
        if (header === 'status') {
          value = convertStatus(value);
        }
        
        book[header] = value;
      }
      
      if (book.title) {
        books.push({
          ...book,
          id: Date.now() + '_' + i,
          currentPage: 0,
          favorite: false,
          createdAt: Date.now(),
        });
      }
    }
    
    return { success: true, books, count: books.length };
  } catch (error) {
    console.error('CSV Import Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};
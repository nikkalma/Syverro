// src/services/CSVImportService.ts
import * as FileSystem from 'expo-file-system';

// ✅ ВРЕМЕННО: игнорируем типы для FileSystem
const fs: any = FileSystem;

// ✅ Импортируем тип из единого источника
import type { BookStatus } from '../types/book.types';

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

// ✅ Маппинг только для импорта (не дублирует статусы)
const statusMap: Record<string, BookStatus> = {
  // Русские названия
  'Прочитано': 'finished',
  'Читаю': 'reading',
  'В планах': 'planned',
  'Отложено': 'postponed',
  'Брошено': 'abandoned',
  'Перечитываю': 'rereading',
  // Английские названия (если приходят уже в правильном формате)
  'finished': 'finished',
  'reading': 'reading',
  'planned': 'planned',
  'postponed': 'postponed',
  'abandoned': 'abandoned',
  'rereading': 'rereading',
};

const convertStatus = (status: string): BookStatus => {
  return statusMap[status] || 'planned';
};

export const importBooksFromCSV = async (csvPath?: string): Promise<ImportResult> => {
  try {
    let path = csvPath;
    if (!path) {
      const documentDir = fs.documentDirectory;
      if (!documentDir) {
        return { success: false, error: 'Document directory not available' };
      }
      path = `${documentDir}assets/books.csv`;
    }
    
    const fileInfo = await fs.getInfoAsync(path);
    if (!fileInfo.exists) {
      return { success: false, error: 'CSV file not found' };
    }
    
    const csvContent = await fs.readAsStringAsync(path);
    const lines = csvContent.split(/\r?\n/);
    
    if (lines.length === 0) {
      return { success: false, error: 'CSV файл пуст' };
    }
    
    // ✅ ИСПРАВЛЕНО: добавлен тип (h: string)
    const headers = lines[0].split(',').map((h: string) => h.replace(/["']/g, '').trim());
    const books: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // ✅ ИСПРАВЛЕНО: добавлен тип (v: string)
      const values = lines[i].split(',').map((v: string) => v.replace(/["']/g, '').trim());
      const book: any = {};
      
      for (let j = 0; j < headers.length; j++) {
        let value: string | number | string[] = values[j] || '';
        const header = headers[j];
        
        if (header === 'rating' || header === 'totalPages') {
          value = value ? parseInt(value as string) : 0;
        } else if (header === 'genres' && value) {
          value = (value as string).split(',').map((g: string) => g.trim());
        } else if (header === 'status') {
          value = convertStatus(value as string);
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
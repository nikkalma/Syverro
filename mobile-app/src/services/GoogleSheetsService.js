// src/services/GoogleSheetsService.js

// ВСТАВЬТЕ ВАШ URL (который скопировали)
const API_URL = 'https://script.google.com/macros/s/AKfycbzuCDSJe4UtPemfmpwLH0dJr63U1F5yABDq8RIQCwa_EI5uUZcY-mYlv_HpAUvwty0TpA/exec';

export const importBooksFromSheets = async () => {
  try {
    console.log('🔄 Начинаем импорт из Google Sheets...');
    
    const response = await fetch(API_URL);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Ошибка при получении данных');
    }
    
    console.log(`✅ Импортировано ${data.count} книг`);
    return {
      success: true,
      books: data.books,
      count: data.count
    };
  } catch (error) {
    console.error('❌ Ошибка импорта:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
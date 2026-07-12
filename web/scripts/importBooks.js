// scripts/importBooks.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем путь к текущей директории (ES-модули)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к CSV-файлу
const csvPath = path.join(__dirname, 'Книги - Список.csv');
const outputPath = path.join(__dirname, '../src/data/books.json');

// Проверяем, существует ли CSV-файл
if (!fs.existsSync(csvPath)) {
  console.error('❌ Файл "Книги - Список.csv" не найден в папке scripts/');
  console.log('📁 Положи CSV-файл в папку scripts и перезапусти скрипт');
  process.exit(1);
}

console.log('📖 Читаю CSV...');

// Читаем CSV
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim() !== '');

// Парсим заголовки (первая строка)
const headers = lines[0].split(',').map(h => h.trim());

console.log(`📋 Найдено колонок: ${headers.length}`);
console.log(`📚 Найдено строк: ${lines.length - 1}`);

// Парсим строки
const rawBooks = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  // Простой парсер для CSV (учитывает кавычки)
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  const book = {};
  headers.forEach((header, index) => {
    book[header] = values[index] || '';
  });
  rawBooks.push(book);
}

console.log(`✅ Обработано ${rawBooks.length} книг`);

// Маппинг в структуру GlobalBook
const mappedBooks = rawBooks.map((book, index) => {
  // Парсим жанры
  const genres = book['Жанр'] ? book['Жанр'].split(',').map(g => g.trim()) : [];
  
  // Парсим страну и эпоху из "Раздел"
  let authorCountry = null;
  let historicalPeriodSetting = null;
  if (book['Раздел']) {
    const parts = book['Раздел'].split(',').map(p => p.trim());
    if (parts.length >= 1) authorCountry = parts[0];
    if (parts.length >= 2) historicalPeriodSetting = parts[1];
  }

  // Маппинг статусов
  const statusMap = {
    'В планах': 'want_to_read',
    'В процессе': 'reading',
    'Прочитано': 'completed',
    'Брошено': 'abandoned',
    'Заморожено': 'postponed',
  };
  const status = statusMap[book['Статус']] || 'want_to_read';

  return {
    id: `book_${String(index + 1).padStart(4, '0')}`,
    title: book['Название'] || 'Без названия',
    author: book['Автор'] || 'Неизвестный автор',
    cover: null,
    genres: genres,
    totalPages: parseInt(book['Размер (стр)']) || 0,
    authorCountry: authorCountry,
    originalYear: null,
    description: null,
    averageRating: null,
    totalRatings: 0,
    createdAt: Date.now(),
    
    // Личные данные (пока храним внутри, потом вынесем в PersonalBook)
    _personal: {
      status: status,
      rating: parseInt(book['Оценка']) || null,
      notes: book['Заметки'] || '',
      startDate: book['Сроки'] ? book['Сроки'].split(' - ')[0]?.trim() || null : null,
      endDate: book['Сроки'] ? book['Сроки'].split(' - ')[1]?.trim() || null : null,
      language: book['Язык прочтения'] || null,
    }
  };
});

// Сохраняем в src/data/books.json
fs.writeFileSync(outputPath, JSON.stringify(mappedBooks, null, 2));

console.log(`✅ Импортировано ${mappedBooks.length} книг в ${outputPath}`);
console.log('🎉 Готово!');
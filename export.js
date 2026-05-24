// export.js
const fs = require('fs');
const path = require('path');

// Папки и файлы, которые нужно исключить (мусор)
const EXCLUDED_DIRS = [
  'node_modules',
  '.expo',
  'android',
  'ios',
  'web-build',
  '.git',
  '.vscode',
  'assets', // обычно там только картинки, они не нужны в текстовом контексте
];
const EXCLUDED_FILES = [
  '.gitignore',
  'package-lock.json',
  'yarn.lock',
  'context.txt', // чтобы не читать сам себя
  'export.js',   // себя тоже пропускаем
  'metro.config.js',
  'babel.config.js',
  'eas.json',
  'app.json',
];

// Расширения файлов, которые мы включаем (весь код)
const INCLUDED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt'];

function shouldExcludeDir(dirName) {
  return EXCLUDED_DIRS.includes(dirName);
}

function shouldExcludeFile(fileName) {
  return EXCLUDED_FILES.includes(fileName);
}

function getFileExtension(fileName) {
  return path.extname(fileName).toLowerCase();
}

function readDirectory(directory, outputStream, basePath = '') {
  const items = fs.readdirSync(directory);

  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stat = fs.statSync(itemPath);
    const relativePath = path.join(basePath, item);

    if (stat.isDirectory()) {
      if (!shouldExcludeDir(item)) {
        readDirectory(itemPath, outputStream, relativePath);
      }
    } else {
      if (shouldExcludeFile(item)) continue;

      const ext = getFileExtension(item);
      if (INCLUDED_EXTENSIONS.includes(ext)) {
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          
          // Записываем заголовок файла
          outputStream.write(`\n\n// ===== ФАЙЛ: ${relativePath} =====\n`);
          
          // Оборачиваем содержимое маркером для читаемости (опционально)
          outputStream.write(`[file content begin]\n`);
          outputStream.write(content);
          outputStream.write(`\n[file content end]\n`);
          
          console.log(`✅ Добавлен: ${relativePath}`);
        } catch (err) {
          console.error(`❌ Ошибка чтения ${relativePath}:`, err.message);
          outputStream.write(`\n// ===== ОШИБКА ЧТЕНИЯ: ${relativePath} =====\n`);
        }
      }
    }
  }
}

function exportProject() {
  const projectRoot = __dirname; // текущая папка (корень проекта)
  const outputFilePath = path.join(projectRoot, 'context.txt');
  
  console.log(`🚀 Начинаем экспорт проекта из ${projectRoot}`);
  console.log(`📄 Результат будет сохранён в ${outputFilePath}`);
  
  const writeStream = fs.createWriteStream(outputFilePath);
  
  // Заголовок файла с метаданными
  writeStream.write(`# Контекст проекта Syverro\n`);
  writeStream.write(`# Дата генерации: ${new Date().toISOString()}\n`);
  writeStream.write(`# Корневая папка: ${projectRoot}\n`);
  writeStream.write(`# Все пути относительные\n\n`);
  
  readDirectory(projectRoot, writeStream);
  
  writeStream.end(() => {
    console.log(`\n🎉 Готово! Файл context.txt создан.`);
    console.log(`📂 Размер: ${(fs.statSync(outputFilePath).size / 1024 / 1024).toFixed(2)} MB`);
  });
}

// Запускаем экспорт
exportProject();
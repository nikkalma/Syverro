const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const outputFile = path.join(targetDir, 'context.txt');

const ignoreDirs = ['node_modules', '.expo', '.git', 'assets', '.vscode', 'expo-plugins'];
const ignoreExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ttf', '.otf', '.woff', '.map', '.lock'];
const ignoreFiles = ['package-lock.json', 'yarn.lock', '.DS_Store', 'context.txt', 'export-structure.js'];

function shouldIgnore(filePath) {
  const parts = filePath.split(path.sep);
  for (const ignore of ignoreDirs) {
    if (parts.includes(ignore)) return true;
  }
  const ext = path.extname(filePath);
  if (ignoreExtensions.includes(ext)) return true;
  const base = path.basename(filePath);
  if (ignoreFiles.includes(base)) return true;
  return false;
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (!shouldIgnore(filePath)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function generateContext() {
  const allFiles = getAllFiles(targetDir);
  const sortedFiles = allFiles.sort();
  
  let output = '';
  for (const file of sortedFiles) {
    output += `// ===== ФАЙЛ: ${file.replace(targetDir + path.sep, '')} =====\n`;
    const content = fs.readFileSync(file, 'utf8');
    output += content + '\n\n';
  }
  
  fs.writeFileSync(outputFile, output);
  console.log(`✅ Контекст сохранён в ${outputFile}`);
  console.log(`📁 Всего файлов: ${sortedFiles.length}`);
}

generateContext();
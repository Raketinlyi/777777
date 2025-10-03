const fs = require('fs');
const path = require('path');

// Путь к папке с локализацией
const localesDir = path.join(__dirname, '..', 'lib', 'locales');

// Список файлов локализации
const localeFiles = [
  'en.json',
  'ru.json', 
  'tr.json',
  'es.json',
  'ko.json',
  'hi.json',
  'zh.json',
  'uk.json'
];

console.log('🔧 Исправляем insufficientCRAA → insufficientOCTA во всех файлах локализации...\n');

localeFiles.forEach(filename => {
  const filePath = path.join(localesDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл ${filename} не найден, пропускаем`);
    return;
  }

  try {
    // Читаем файл
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Подсчитываем количество замен
    const matches = content.match(/insufficientCRAA/g);
    const count = matches ? matches.length : 0;
    
    if (count === 0) {
      console.log(`✅ ${filename}: нет упоминаний insufficientCRAA`);
      return;
    }
    
    // Заменяем все вхождения
    const newContent = content.replace(/insufficientCRAA/g, 'insufficientOCTA');
    
    // Записываем обратно
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    console.log(`✅ ${filename}: заменено ${count} упоминаний insufficientCRAA → insufficientOCTA`);
    
  } catch (error) {
    console.error(`❌ Ошибка при обработке ${filename}:`, error.message);
  }
});

console.log('\n🎉 Готово! Все файлы локализации обновлены.');
console.log('💡 Теперь перезапустите dev сервер для применения изменений.');
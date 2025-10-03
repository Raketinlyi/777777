#!/usr/bin/env node

/**
 * Скрипт автоматической очистки проекта
 * Удаляет временные файлы, пустые файлы и устаревшую документацию
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Файлы для удаления
const filesToDelete = [
  // Пустые файлы
  'components/crack-overlay.tsx',
  
  // Временные файлы
  'tmp_check_burn_info.mjs',
  'tmp_graphql_resp.json',
  'tmp_graphql_resp2.json',
  
  // Устаревшая документация
  'OPTIMIZATION_DONE.md',
  'OPTIMIZATION_COMPLETE.md',
  'FINAL_FIXES_SUMMARY.md',
  'FINAL_NFT_INSPECTOR_FIX.md',
  'FINAL_PING_FIX.md',
  'FINAL_SUMMARY.md',
  'COMPLETION_SUMMARY.md',
  'TECHNICAL_ISSUES_SUMMARY.md',
  'PING_FIX_SUMMARY.md',
  'NFT_INSPECTOR_FIX.md',
  'NFT_INSPECTOR_FIX_SUMMARY.md',
  'QUICK_DEPLOY.md',
  'QUICK_FIX_INSTRUCTIONS.md',
  'MONAD_DESIGN_IMPROVEMENTS.md',
  'MONAD_DESIGN_UPDATE.md',
  'DESIGN_EVALUATION.md',
  'DESIGN_IMPROVEMENTS_SUMMARY.md',
  'DESIGN_IMPROVEMENT_PLAN.md',
  'CRACK_EFFECTS_IMPROVEMENT.md',
  'MAIN_PAGE_IMPROVEMENTS.md',
];

// Статистика
const stats = {
  deleted: 0,
  notFound: 0,
  errors: 0,
  totalSize: 0,
};

function deleteFile(relativePath) {
  const fullPath = path.join(ROOT_DIR, relativePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      const fileStats = fs.statSync(fullPath);
      const sizeKB = (fileStats.size / 1024).toFixed(2);
      
      fs.unlinkSync(fullPath);
      stats.deleted++;
      stats.totalSize += fileStats.size;
      
      log(`✓ Удален: ${relativePath} (${sizeKB} KB)`, 'green');
    } else {
      stats.notFound++;
      log(`⚠ Не найден: ${relativePath}`, 'yellow');
    }
  } catch (error) {
    stats.errors++;
    log(`✗ Ошибка при удалении ${relativePath}: ${error.message}`, 'red');
  }
}

function findEmptyFiles(dir, emptyFiles = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      // Пропускаем node_modules, .next, .git
      if (stat.isDirectory()) {
        const dirName = path.basename(fullPath);
        if (!['node_modules', '.next', '.git', '.history', '.qodo', '.qoder'].includes(dirName)) {
          findEmptyFiles(fullPath, emptyFiles);
        }
      } else if (stat.isFile() && stat.size === 0) {
        emptyFiles.push(path.relative(ROOT_DIR, fullPath));
      }
    }
  } catch (error) {
    // Игнорируем ошибки доступа
  }
  
  return emptyFiles;
}

function main() {
  log('\n🧹 Начинаем очистку проекта...\n', 'blue');
  
  // 1. Удаляем известные файлы
  log('📝 Удаление известных файлов:', 'magenta');
  filesToDelete.forEach(deleteFile);
  
  // 2. Ищем и удаляем пустые файлы
  log('\n🔍 Поиск пустых файлов...', 'magenta');
  const emptyFiles = findEmptyFiles(ROOT_DIR);
  
  if (emptyFiles.length > 0) {
    log(`\nНайдено ${emptyFiles.length} пустых файлов:`, 'yellow');
    emptyFiles.forEach(file => {
      log(`  - ${file}`, 'yellow');
    });
    
    log('\nУдаляем пустые файлы...', 'magenta');
    emptyFiles.forEach(deleteFile);
  } else {
    log('П��стых файлов не найдено', 'green');
  }
  
  // 3. Статистика
  log('\n📊 Статистика очистки:', 'blue');
  log(`  ✓ Удалено файлов: ${stats.deleted}`, 'green');
  log(`  ⚠ Не найдено: ${stats.notFound}`, 'yellow');
  log(`  ✗ Ошибок: ${stats.errors}`, stats.errors > 0 ? 'red' : 'green');
  log(`  💾 Освобождено: ${(stats.totalSize / 1024).toFixed(2)} KB`, 'green');
  
  // 4. Рекомендации
  log('\n💡 Рекомендации:', 'blue');
  log('  1. Запустите: npm prune (удалить неиспользуемые зависимости)', 'cyan');
  log('  2. Запустите: rm -rf .next (очистить кэш Next.js)', 'cyan');
  log('  3. Запустите: npm run build (проверить сборку)', 'cyan');
  log('  4. Проверьте git status перед коммитом', 'cyan');
  
  log('\n✨ Очистка завершена!\n', 'green');
}

// Запуск
main();

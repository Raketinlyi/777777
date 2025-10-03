#!/usr/bin/env node

/**
 * Скрипт поиска дублирующегося кода
 * Анализирует компоненты и находит похожие паттерны
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'components');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Группы компонентов для проверки
const componentGroups = {
  'NFT Cards': [
    'NFTPingCard.tsx',
    'NFTBurnCard.tsx',
    'NFTGraveyardCard.tsx',
    'UnifiedNftCard.tsx',
    'BurnedNftCard.tsx',
    'GraveyardCubeCard.tsx',
    'BreedCard.tsx',
    'BurnCard.tsx',
  ],
  'Coin Effects': [
    'coin-rain.tsx',
    'coins-animation.tsx',
    'falling-coins-animation.tsx',
    'CoinBurst.tsx',
  ],
  'Fire/Plasma Effects': [
    'fire-animation.tsx',
    'fire-effect.tsx',
    'plasma-animation.tsx',
    'plasma-effect.tsx',
    'burn-effect.tsx',
    'burning-paper-effect.tsx',
  ],
  'Crystal Effects': [
    'crystal-effect.tsx',
    'crystal-card-effect.tsx',
  ],
  'Particle Effects': [
    'particle-effect.tsx',
    'DustParticles.tsx',
    'ash-effect.tsx',
    'ash-rain.tsx',
    'SparkRain.tsx',
    'SparkProjectiles.tsx',
  ],
  'Animation Overlays': [
    'CrackOverlay.tsx',
    'card-burn-overlay.tsx',
    'card-plasma-overlay.tsx',
    'BurnAnimationOverlay.tsx',
  ],
  'Forms': [
    'BreedForm.tsx',
    'ClaimRewardsForm.tsx',
  ],
  'Lightning/Background': [
    'background-lightning.tsx',
    'nft-lightning-effect.tsx',
  ],
};

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function getFileLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function analyzeImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = content.match(/^import .+ from .+$/gm) || [];
    return imports.length;
  } catch {
    return 0;
  }
}

function analyzeHooks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const hooks = content.match(/use[A-Z]\w+/g) || [];
    return [...new Set(hooks)];
  } catch {
    return [];
  }
}

function analyzeProps(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const interfaceMatch = content.match(/interface \w+Props \{([^}]+)\}/s);
    if (interfaceMatch) {
      const props = interfaceMatch[1].match(/\w+:/g) || [];
      return props.map(p => p.replace(':', ''));
    }
    return [];
  } catch {
    return [];
  }
}

function calculateSimilarity(file1Data, file2Data) {
  let score = 0;
  let maxScore = 0;
  
  // Сравнение hooks
  const commonHooks = file1Data.hooks.filter(h => file2Data.hooks.includes(h));
  score += commonHooks.length * 2;
  maxScore += Math.max(file1Data.hooks.length, file2Data.hooks.length) * 2;
  
  // Сравнение props
  const commonProps = file1Data.props.filter(p => file2Data.props.includes(p));
  score += commonProps.length * 3;
  maxScore += Math.max(file1Data.props.length, file2Data.props.length) * 3;
  
  // Сравнение размера
  const sizeDiff = Math.abs(file1Data.size - file2Data.size) / Math.max(file1Data.size, file2Data.size);
  if (sizeDiff < 0.3) score += 2;
  maxScore += 2;
  
  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

function analyzeGroup(groupName, files) {
  log(`\n📦 Группа: ${groupName}`, 'blue');
  log('─'.repeat(60), 'blue');
  
  const filesData = [];
  let totalSize = 0;
  let totalLines = 0;
  
  // Собираем данные о файлах
  for (const file of files) {
    const filePath = path.join(COMPONENTS_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      log(`  ⚠ Не найден: ${file}`, 'yellow');
      continue;
    }
    
    const size = getFileSize(filePath);
    const lines = getFileLines(filePath);
    const imports = analyzeImports(filePath);
    const hooks = analyzeHooks(filePath);
    const props = analyzeProps(filePath);
    
    totalSize += size;
    totalLines += lines;
    
    filesData.push({
      name: file,
      path: filePath,
      size,
      lines,
      imports,
      hooks,
      props,
    });
    
    log(`  📄 ${file}`, 'cyan');
    log(`     Размер: ${(size / 1024).toFixed(2)} KB | Строк: ${lines} | Импортов: ${imports}`, 'reset');
    if (hooks.length > 0) {
      log(`     Hooks: ${hooks.join(', ')}`, 'reset');
    }
    if (props.length > 0) {
      log(`     Props: ${props.join(', ')}`, 'reset');
    }
  }
  
  // Анализ похожести
  if (filesData.length > 1) {
    log(`\n  🔍 Анализ похожести:`, 'magenta');
    
    for (let i = 0; i < filesData.length; i++) {
      for (let j = i + 1; j < filesData.length; j++) {
        const similarity = calculateSimilarity(filesData[i], filesData[j]);
        
        if (similarity > 30) {
          const color = similarity > 70 ? 'red' : similarity > 50 ? 'yellow' : 'green';
          log(`     ${filesData[i].name} ↔ ${filesData[j].name}: ${similarity.toFixed(0)}%`, color);
        }
      }
    }
  }
  
  // Статистика группы
  log(`\n  📊 Статистика группы:`, 'green');
  log(`     Файлов: ${filesData.length}`, 'reset');
  log(`     Общий размер: ${(totalSize / 1024).toFixed(2)} KB`, 'reset');
  log(`     Общее строк: ${totalLines}`, 'reset');
  log(`     Средний размер: ${(totalSize / filesData.length / 1024).toFixed(2)} KB`, 'reset');
  
  return {
    groupName,
    filesCount: filesData.length,
    totalSize,
    totalLines,
  };
}

function generateReport(groupsStats) {
  log('\n\n' + '═'.repeat(60), 'blue');
  log('📊 ИТОГОВЫЙ ОТЧЕТ', 'blue');
  log('═'.repeat(60), 'blue');
  
  let totalFiles = 0;
  let totalSize = 0;
  let totalLines = 0;
  
  for (const stats of groupsStats) {
    totalFiles += stats.filesCount;
    totalSize += stats.totalSize;
    totalLines += stats.totalLines;
  }
  
  log(`\n📈 Общая статистика:`, 'green');
  log(`   Групп компонентов: ${groupsStats.length}`, 'reset');
  log(`   Всего файлов: ${totalFiles}`, 'reset');
  log(`   Общий размер: ${(totalSize / 1024).toFixed(2)} KB`, 'reset');
  log(`   Общее строк кода: ${totalLines}`, 'reset');
  
  log(`\n💡 Рекомендации:`, 'yellow');
  log(`   1. Компоненты с похожестью >70% - кандидаты на объединение`, 'reset');
  log(`   2. Создайте базовые компоненты для каждой группы`, 'reset');
  log(`   3. Используйте композицию вместо дублирования`, 'reset');
  log(`   4. Вынесите общую логику в хуки`, 'reset');
  
  log(`\n🎯 Потенциальная экономия:`, 'green');
  log(`   При объединении дублей: ~${(totalSize * 0.3 / 1024).toFixed(2)} KB (-30%)`, 'reset');
  log(`   При рефакторинге: ~${(totalLines * 0.25).toFixed(0)} строк (-25%)`, 'reset');
}

function main() {
  log('\n🔍 Анализ дублирующегося кода', 'blue');
  log('═'.repeat(60), 'blue');
  
  const groupsStats = [];
  
  for (const [groupName, files] of Object.entries(componentGroups)) {
    const stats = analyzeGroup(groupName, files);
    groupsStats.push(stats);
  }
  
  generateReport(groupsStats);
  
  log('\n✨ Анализ завершен!\n', 'green');
}

// Запуск
main();

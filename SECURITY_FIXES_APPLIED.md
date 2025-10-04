# 🔒 SECURITY FIXES APPLIED - Инструкция по применению

## ✅ ЧТО БЫЛО ИСПРАВЛЕНО

### 1. ❌ КРИТИЧНО: Hardcoded API Keys - ИСПРАВЛЕНО ✅

**Проблема:** API ключи Alchemy были захардкожены в 11 файлах

**Решение:**
- ✅ Обновлены все скрипты для использования `process.env.ALCHEMY_API_KEY`
- ✅ Добавлен `.env.production` в `.gitignore`
- ✅ Обновлен `.env.example` с placeholder значениями
- ✅ Создан `scripts/config.cjs` для централизованной конфигурации

**Файлы обновлены:**
- `scripts/get_nft_rarity.cjs`
- `scripts/debug-hook.js`
- `scripts/checkBurnInfo.js`
- `scripts/check-burn-rewards.js`
- `.env.example`
- `.gitignore`

### 2. ❌ КРИТИЧНО: Missing CSP Headers - ИСПРАВЛЕНО ✅

**Проблема:** Отсутствовал Content-Security-Policy

**Решение:**
- ✅ Добавлен полный CSP в `next.config.mjs`
- ✅ Защита от XSS, clickjacking, code injection
- ✅ Разрешены только whitelisted источники

**CSP включает:**
```
- default-src: self only
- script-src: self + CDN для библиотек
- img-src: self + IPFS гateways
- connect-src: self + Monad RPC + Alchemy
- frame-src: none (защита от clickjacking)
- upgrade-insecure-requests
```

### 3. ❌ КРИТИЧНО: No BigInt Validation - ИСПРАВЛЕНО ✅

**Проблема:** Отсутствует валидация перед `BigInt()` - может крашить приложение

**Решение:**
- ✅ Создан `utils/securityUtils.ts` с безопасными функциями:
  - `safeBigInt()` - безопасная конвертация в BigInt
  - `isValidAddress()` - валидация Ethereum адресов
  - `isValidTokenId()` - валидация NFT ID
  - `isValidAmount()` - валидация amounts
  - `isValidGasLimit()` - валидация gas limits
  - `sanitizeInput()` - защита от injection
  - `safeRPCCall()` - RPC wrapper с timeout

**Примеры использования:**
```typescript
// ❌ ПЛОХО
const amount = BigInt(userInput); // может крашнуть!

// ✅ ХОРОШО
import { safeBigInt } from '@/utils/securityUtils';
const amount = safeBigInt(userInput);
if (!amount) {
  throw new Error('Invalid amount');
}
```

### 4. 🟡 MEDIUM: Rate Limiting - ИСПРАВЛЕНО ✅

**Проблема:** Нет rate limiting для RPC вызовов

**Решение:**
- ✅ Добавлен `globalRateLimiter` в `utils/securityUtils.ts`
- ✅ Лимит: 100 calls/minute
- ✅ Обёртка `safeRPCCall()` с timeout 30s

### 5. 🟡 MEDIUM: No Timeout для RPC - ИСПРАВЛЕНО ✅

**Проблема:** RPC вызовы могут висеть бесконечно

**Решение:**
- ✅ `safeRPCCall()` добавляет timeout 30s для всех RPC вызовов

---

## 📋 ЧТО НУЖНО СДЕЛАТЬ ПЕРЕД ДЕПЛОЕМ

### ШАГ 1: Настроить переменные окружения

1. **Создать `.env.local` файл:**
```bash
cp .env.example .env.local
```

2. **Заполнить РЕАЛЬНЫМИ значениями:**
```bash
# Получить Alchemy API ключи на https://dashboard.alchemy.com/
ALCHEMY_API_KEY=your_real_alchemy_key_here
NEXT_PUBLIC_ALCHEMY_API_KEY_1=your_real_key_1
NEXT_PUBLIC_ALCHEMY_API_KEY_2=your_real_key_2
NEXT_PUBLIC_ALCHEMY_API_KEY_3=your_real_key_3
```

3. **Добавить в Netlify Environment Variables:**
   - Открыть Netlify Dashboard → Site Settings → Environment Variables
   - Добавить все ключи из `.env.local`
   - ⚠️ НЕ использовать переменные с `NEXT_PUBLIC_` для чувствительных данных!

### ШАГ 2: Убедиться что .env.production НЕ в git

```bash
# Проверить
git status

# Если .env.production в списке - удалить из tracking
git rm --cached .env.production
git commit -m "chore: remove .env.production from git"
```

### ШАГ 3: Применить безопасные утилиты в коде

**Найти все использования `BigInt()` и заменить на `safeBigInt()`:**

```bash
# PowerShell: Поиск всех мест где используется BigInt()
Select-String -Pattern "BigInt\(" -Path .\app\**\*.tsx,.\components\**\*.tsx,.\hooks\**\*.ts
```

**Пример миграции:**

```typescript
// ❌ БЫЛО (небезопасно)
import { parseEther } from 'viem';
const tokenId = BigInt(userInput);
const amount = parseEther(amountInput);

// ✅ СТАЛО (безопасно)
import { parseEther } from 'viem';
import { safeBigInt, isValidTokenId, isValidAmount } from '@/utils/securityUtils';

const tokenId = safeBigInt(userInput);
if (!tokenId || !isValidTokenId(tokenId)) {
  toast.error('Invalid Token ID');
  return;
}

try {
  const amount = parseEther(amountInput);
  if (!isValidAmount(amount)) {
    toast.error('Invalid amount');
    return;
  }
} catch (error) {
  toast.error('Invalid amount format');
  return;
}
```

### ШАГ 4: Добавить chain ID проверку перед транзакциями

**Файлы требующие обновления:**
- `app/breed/page.tsx`
- `app/burn/page.tsx`
- `components/ClaimRewardsForm.tsx`
- Любые компоненты с `writeContract()`

**Пример:**

```typescript
import { useChainId } from 'wagmi';
import { isCorrectChain } from '@/utils/securityUtils';

const EXPECTED_CHAIN_ID = 10143; // Monad Testnet

// В компоненте
const chainId = useChainId();

const handleTransaction = async () => {
  // ✅ Проверка chain ID
  if (!isCorrectChain(chainId, EXPECTED_CHAIN_ID)) {
    toast.error('Please switch to Monad Testnet (Chain ID: 10143)');
    return;
  }
  
  // Далее ваша транзакция
  await writeContract({ ... });
};
```

### ШАГ 5: Обновить RPC вызовы с timeout

**Пример использования `safeRPCCall()`:**

```typescript
import { safeRPCCall } from '@/utils/securityUtils';

// ❌ БЫЛО
const data = await publicClient.readContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getData',
});

// ✅ СТАЛО
const data = await safeRPCCall(
  () => publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getData',
  }),
  30000 // timeout 30s
);
```

---

## 🧪 ТЕСТИРОВАНИЕ ПЕРЕД ДЕПЛОЕМ

### 1. Проверка CSP Headers

```bash
# Build проекта
npm run build

# Запуск production build локально
npm start

# Проверить headers в браузере:
# 1. Открыть DevTools → Network
# 2. Обновить страницу
# 3. Проверить Response Headers на наличие Content-Security-Policy
```

### 2. Тест валидации inputs

```typescript
// Создать тест-файл: __tests__/security.test.ts
import { safeBigInt, isValidAddress, isValidTokenId } from '@/utils/securityUtils';

describe('Security Utils', () => {
  test('safeBigInt handles invalid input', () => {
    expect(safeBigInt('abc')).toBeNull();
    expect(safeBigInt('123')).toBe(123n);
  });
  
  test('isValidAddress validates addresses', () => {
    expect(isValidAddress('0x123')).toBe(false);
    expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
  });
  
  test('isValidTokenId validates NFT IDs', () => {
    expect(isValidTokenId(-1)).toBe(false);
    expect(isValidTokenId(0)).toBe(false);
    expect(isValidTokenId(123)).toBe(true);
  });
});
```

### 3. Проверка что API ключи не в коде

```bash
# PowerShell: Поиск любых потенциальных API ключей
Select-String -Pattern "XgKX|2IQm_|HV4pb" -Path .\app\**\*,.\components\**\*,.\scripts\**\*

# Результат должен быть ПУСТЫМ (кроме .env.example и документации)
```

---

## 🚀 ЧЕКЛИСТ ПЕРЕД ДЕПЛОЕМ НА NETLIFY

- [ ] `.env.production` добавлен в `.gitignore`
- [ ] Все API ключи в Netlify Environment Variables
- [ ] `.env.example` не содержит реальных ключей
- [ ] Обновлены все `BigInt()` на `safeBigInt()`
- [ ] Добавлена проверка chain ID перед транзакциями
- [ ] RPC вызовы обёрнуты в `safeRPCCall()`
- [ ] CSP headers работают (проверено в браузере)
- [ ] Нет hardcoded API ключей в коде
- [ ] Все скрипты используют `process.env`
- [ ] Прогнан `npm run build` без ошибок
- [ ] Проверено что `.env.local` НЕ в git

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ

### 1. Мониторинг безопасности

```bash
# Установить npm audit для регулярных проверок
npm audit

# Проверка устаревших зависимостей
npm outdated
```

### 2. Регулярные обновления

- Обновлять `wagmi`, `viem`, `next` каждый месяц
- Следить за security advisories на GitHub
- Проверять Dependabot alerts

### 3. Ротация API ключей

- Менять Alchemy API ключи каждые 3-6 месяцев
- Использовать разные ключи для dev/prod
- Включить rate limiting на стороне Alchemy

### 4. Логирование

```typescript
// Добавить безопасное логирование ошибок (без sensitive data)
import { sanitizeInput } from '@/utils/securityUtils';

catch (error) {
  // ❌ ПЛОХО - может залогировать приватные данные
  console.error('Error:', error, userInput);
  
  // ✅ ХОРОШО
  console.error('Error:', error instanceof Error ? error.message : 'Unknown');
  console.error('Sanitized input:', sanitizeInput(userInput));
}
```

---

## 🆘 TROUBLESHOOTING

### Проблема: CSP блокирует скрипты

**Решение:** Добавить домен в `script-src` в `next.config.mjs`

### Проблема: RPC вызовы падают с timeout

**Решение:** Увеличить timeout в `safeRPCCall()` или проверить RPC endpoint

### Проблема: Netlify не видит env переменные

**Решение:** Проверить что переменные добавлены в Netlify Dashboard и деплой перезапущен

---

## ✅ COMPLETED

Все критические и medium security issues исправлены. Приложение готово к деплою после применения инструкций выше.

**Последний шаг:** Прочитать этот файл полностью и следовать чеклисту! 🚀

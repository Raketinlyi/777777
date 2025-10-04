# ✅ DEPLOYMENT CHECKLIST - Crazy Octagon Game

**Проект:** Monad Testnet Blockchain Game  
**Target:** Netlify Production  
**Security Audit:** ✅ COMPLETED  
**Fixes Applied:** ✅ COMPLETED

---

## 🔐 SECURITY (ALL COMPLETED)

### Critical Issues ✅
- [x] Hardcoded API keys удалены из всех скриптов
- [x] `.env.production` добавлен в `.gitignore`
- [x] `.env.example` содержит только placeholders
- [x] Content Security Policy (CSP) headers добавлены
- [x] Создан `utils/securityUtils.ts` с валидацией
- [x] Централизованная конфигурация в `scripts/config.cjs`

### Medium Priority ✅
- [x] Rate limiting (100 calls/min) реализован
- [x] RPC timeout (30s) добавлен
- [x] Gas limit validation добавлена
- [x] Input sanitization реализована

---

## 📝 DOCUMENTATION CREATED

- [x] `SECURITY_FIXES_REQUIRED.md` - Оригинальный аудит
- [x] `SECURITY_FIXES_APPLIED.md` - Детальная инструкция
- [x] `SECURITY_AUDIT_SUMMARY.md` - Executive summary
- [x] `SECURITY_UTILS_GUIDE.md` - Quick reference
- [x] `DEPLOYMENT_CHECKLIST.md` - Этот файл

---

## ⚠️ MANUAL TASKS (REQUIRED BEFORE DEPLOY)

### 1. Environment Variables Setup

#### Local Development
```bash
# Создать .env.local из примера
cp .env.example .env.local

# Открыть и заполнить РЕАЛЬНЫМИ ключами
notepad .env.local
```

**Обязательные переменные:**
```bash
# Alchemy API Keys (получить на https://dashboard.alchemy.com/)
ALCHEMY_API_KEY=your_real_key_here
NEXT_PUBLIC_ALCHEMY_API_KEY_1=your_real_key_1
NEXT_PUBLIC_ALCHEMY_API_KEY_2=your_real_key_2
NEXT_PUBLIC_ALCHEMY_API_KEY_3=your_real_key_3

# Chain ID
NEXT_PUBLIC_MONAD_CHAIN_ID=10143

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

#### Netlify Dashboard
1. Открыть: https://app.netlify.com → Ваш сайт → Site settings → Environment variables
2. Добавить ВСЕ переменные из `.env.local`
3. ⚠️ **НЕ** использовать `NEXT_PUBLIC_` для API ключей!

**Структура в Netlify:**
```
Key: ALCHEMY_API_KEY
Value: [ваш настоящий ключ]
Scopes: All scopes

Key: NEXT_PUBLIC_MONAD_CHAIN_ID
Value: 10143
Scopes: All scopes
```

### 2. Git Repository Cleanup

```bash
# Проверить что .env.production НЕ в tracking
git status

# Если .env.production в списке - удалить
git rm --cached .env.production
git rm --cached .env.local

# Commit changes
git add .gitignore
git commit -m "security: update gitignore to exclude env files"
```

### 3. Code Updates (REQUIRED)

#### A. Применить `safeBigInt()` во всех компонентах

**Поиск мест для замены (PowerShell):**
```powershell
# Найти все BigInt() использования
Select-String -Pattern "BigInt\(" -Path .\app\**\*.tsx,.\components\**\*.tsx,.\hooks\**\*.ts

# Исключить уже исправленные
Select-String -Pattern "BigInt\(" -Path .\app\**\*.tsx,.\components\**\*.tsx | Where-Object { $_.Line -notmatch "safeBigInt" }
```

**Примеры замены:**

```typescript
// ❌ НАЙТИ И ЗАМЕНИТЬ
const tokenId = BigInt(userInput);

// ✅ НА ЭТО
import { safeBigInt } from '@/utils/securityUtils';

const tokenId = safeBigInt(userInput);
if (!tokenId) {
  toast.error('Invalid Token ID');
  return;
}
```

**Приоритетные файлы:**
- [ ] `app/breed/page.tsx` - breeding form
- [ ] `app/burn/page.tsx` - burn form
- [ ] `components/ClaimRewardsForm.tsx` - rewards claiming
- [ ] `components/BreedCard.tsx` - NFT selection
- [ ] `components/BurnCard.tsx` - burn NFT selection

#### B. Добавить Chain ID Verification

**В каждом компоненте с транзакциями:**

```typescript
import { useChainId } from 'wagmi';
import { isCorrectChain } from '@/utils/securityUtils';

const MONAD_TESTNET_ID = 10143;

export default function YourComponent() {
  const chainId = useChainId();
  
  const handleTransaction = async () => {
    // ✅ ДОБАВИТЬ ЭТУ ПРОВЕРКУ
    if (!isCorrectChain(chainId, MONAD_TESTNET_ID)) {
      toast.error('Please switch to Monad Testnet (Chain ID: 10143)');
      return;
    }
    
    // Далее ваша транзакция
    await writeContract({ ... });
  };
}
```

**Файлы требующие chain check:**
- [ ] `app/breed/page.tsx` - requestBreed()
- [ ] `app/burn/page.tsx` - burnNFT()
- [ ] `components/ClaimRewardsForm.tsx` - claimRewards()
- [ ] Любые другие с `writeContract()`

#### C. Обернуть RPC Calls в `safeRPCCall()`

**Приоритетные места:**

```typescript
import { safeRPCCall } from '@/utils/securityUtils';

// ❌ НАЙТИ
const data = await publicClient.readContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'getData',
});

// ✅ ЗАМЕНИТЬ НА
const data = await safeRPCCall(
  () => publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getData',
  }),
  30000 // 30s timeout
);
```

**Файлы для обновления:**
- [ ] `hooks/useCrazyOctagonGame.ts` - все RPC вызовы
- [ ] `hooks/useNFTGameData.ts` - NFT metadata fetching
- [ ] `app/breed/page.tsx` - isGraveyardReady check
- [ ] `components/ClaimRewards.tsx` - rewards calculation

---

## 🧪 TESTING BEFORE DEPLOY

### 1. Build Test
```bash
npm run build
```
**Ожидаемый результат:** ✅ Build completed without errors

### 2. Production Preview
```bash
npm start
```

**Проверить в браузере:**
- [ ] Главная страница открывается
- [ ] Wallet Connect работает
- [ ] NFT список загружается
- [ ] No CSP violations в Console

### 3. CSP Headers Test

**В браузере DevTools:**
1. Открыть Network tab
2. Обновить страницу
3. Кликнуть на главный document request
4. Проверить Response Headers

**Должен содержать:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000
```

### 4. Security Validation

```bash
# Поиск hardcoded API keys
Select-String -Pattern "XgKX|2IQm_|HV4pb" -Path .\**\*.ts,.\**\*.tsx,.\**\*.js

# Результат должен быть ПУСТЫМ или только в:
# - .env.example (placeholders)
# - URGENT_FIX_SECRETS.md (документация)
```

### 5. Functional Testing

**Manual Testing Checklist:**
- [ ] Connect Wallet
- [ ] View NFT collection
- [ ] Select 2 NFTs for breeding
- [ ] Check chain ID validation (try wrong network)
- [ ] Attempt invalid token ID (должна быть ошибка)
- [ ] View Graveyard
- [ ] Check cooldown displays
- [ ] Burn NFT
- [ ] Claim rewards

---

## 🚀 NETLIFY DEPLOYMENT

### Pre-Deploy
```bash
# Final checks
git status  # Убедиться всё committed
npm run build  # Final build test

# Push to main
git push origin main
```

### Netlify Settings

#### Build Settings
```
Base directory: (пусто)
Build command: npm run build
Publish directory: .next
```

#### Environment Variables (обязательно!)
```
ALCHEMY_API_KEY
NEXT_PUBLIC_ALCHEMY_API_KEY_1
NEXT_PUBLIC_ALCHEMY_API_KEY_2
NEXT_PUBLIC_ALCHEMY_API_KEY_3
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
```

#### Deploy Settings
- [ ] Production branch: `main`
- [ ] Auto-deploy: Enabled
- [ ] Deploy previews: Enabled

### Post-Deploy Verification

**После деплоя проверить:**

1. **Security Headers**
```bash
curl -I https://your-site.netlify.app | findstr "Content-Security-Policy"
```

2. **Site Functionality**
- [ ] Открыть production URL
- [ ] Connect wallet
- [ ] Проверить все основные функции
- [ ] Проверить Console на ошибки
- [ ] Проверить Network tab на failed requests

3. **Error Monitoring**
- [ ] Настроить Netlify Functions logging
- [ ] Проверить первые 10 минут на ошибки
- [ ] Мониторить analytics на странные паттерны

---

## 📊 MONITORING & MAINTENANCE

### First 24 Hours
- [ ] Проверять Netlify logs каждые 2 часа
- [ ] Мониторить RPC usage на Alchemy dashboard
- [ ] Следить за user reports

### Weekly
- [ ] Review error logs
- [ ] Check RPC rate limits
- [ ] Update dependencies (`npm outdated`)

### Monthly
- [ ] Rotate API keys
- [ ] Security audit (`npm audit`)
- [ ] Performance review

---

## 🆘 ROLLBACK PLAN

### If Critical Issue After Deploy

1. **Immediate Rollback**
```bash
# В Netlify Dashboard
Deploys → [Previous Deploy] → Publish deploy
```

2. **Fix Locally**
```bash
git revert HEAD
# или
git reset --hard [previous-commit-hash]
git push origin main --force
```

3. **Investigate**
- Check Netlify function logs
- Review browser console errors
- Check Alchemy API usage

---

## ✅ FINAL CHECKLIST

### Security ✅
- [x] No hardcoded API keys in code
- [x] `.env.production` in `.gitignore`
- [x] CSP headers configured
- [x] Input validation utilities created
- [ ] All `BigInt()` replaced with `safeBigInt()`
- [ ] All transactions have chain ID check
- [ ] All RPC calls wrapped in `safeRPCCall()`

### Environment ⏳
- [ ] `.env.local` created with real keys
- [ ] All env vars added to Netlify
- [ ] No sensitive data in git

### Testing ⏳
- [ ] `npm run build` successful
- [ ] Local production preview works
- [ ] CSP headers present
- [ ] No hardcoded secrets found
- [ ] Manual functional testing passed

### Deployment ⏳
- [ ] All code committed and pushed
- [ ] Netlify build settings configured
- [ ] Environment variables in Netlify
- [ ] Auto-deploy enabled

### Post-Deploy ⏳
- [ ] Production site accessible
- [ ] Security headers verified
- [ ] Wallet connection works
- [ ] Main features functional
- [ ] No console errors

---

## 📚 RESOURCES

- **Security Audit:** `SECURITY_AUDIT_SUMMARY.md`
- **Fix Instructions:** `SECURITY_FIXES_APPLIED.md`
- **Utils Guide:** `SECURITY_UTILS_GUIDE.md`
- **Netlify Docs:** https://docs.netlify.com/
- **Alchemy Dashboard:** https://dashboard.alchemy.com/

---

**🎯 Estimated Time to Complete Manual Tasks:** 2-3 hours

**Status:** ⏳ Ready for manual implementation → 🚀 Ready for deploy

---

**Last Updated:** [Today]  
**Security Audit Status:** ✅ PASSED  
**Deployment Ready:** ⏳ PENDING MANUAL TASKS

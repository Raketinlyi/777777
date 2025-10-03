# 🔧 Настройка Claim Blocking

## Текущая конфигурация
- **Таймаут**: 4 минуты (240 секунд)
- **Цель**: Предотвращение случайных повторных claim
- **Хранилище**: localStorage (per-chain)

---

## Опции настройки

### Вариант 1: Уменьшить timeout (рекомендую)

```typescript
// hooks/useClaimBlocking.ts
const BLOCK_DURATION = 2 * 60 * 1000; // 2 минуты вместо 4
```

### Вариант 2: Полностью отключить (НЕ рекомендую)

```typescript
// components/ClaimRewards.tsx
// Закомментировать строки 479-495:
/*
{isBlocked && (
  <div className='flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-800/60 p-3 text-sm text-slate-200'>
    <Timer className='h-5 w-5 text-slate-300' />
    <div>
      <div className='font-medium'>{t('sections.claim.blockedBanner.title', 'Claim section blocked')}</div>
      <div>
        {t('sections.claim.blockedBanner.subtitle', 'Please wait before trying again.')}{' '}
        {timeLeft > 0 && (
          <span className='text-slate-100'>
            {t('sections.claim.blockedBanner.remaining', { defaultValue: '{seconds}s remaining', seconds: timeLeft })}
          </span>
        )}
      </div>
    </div>
  </div>
)}
*/

// И убрать вызов blockClaimSection() на строке 382
// blockClaimSection(); // <-- закомментировать
```

### Вариант 3: Сделать гибким (best practice)

Добавить настройку в `.env`:

```env
# .env
NEXT_PUBLIC_CLAIM_BLOCK_DURATION=120000  # 2 минуты в миллисекундах
```

```typescript
// hooks/useClaimBlocking.ts
const BLOCK_DURATION = parseInt(
  process.env.NEXT_PUBLIC_CLAIM_BLOCK_DURATION || '240000',
  10
); // Дефолт: 4 минуты
```

---

## Почему это полезно?

### ✅ Защищает от:
1. **Double-claiming** — случайные повторные клики
2. **Gas waste** — лишние транзакции с ошибками
3. **RPC spam** — перегрузка Alchemy/RPC providers
4. **User confusion** — "почему награда не пришла" (транзакция ещё в pending)

### ⚠️ Минусы отключения:
1. Пользователи могут случайно кликнуть 2-3 раза
2. Увеличение 429 ошибок от RPC
3. Лишние gas fees на failed transactions
4. Хуже UX (повторные попытки без feedback)

---

## Рекомендация

**Оставить как есть** или **уменьшить до 2 минут**.

Если пользователи жалуются на "слишком долго":
- Добавить **визуальную кнопку "Skip wait"** (с предупреждением)
- Показать **progress bar** вместо просто цифр

Пример улучшенного UI:

```tsx
{isBlocked && (
  <div className='...'>
    <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
      <div 
        className="bg-blue-500 h-2 rounded-full transition-all"
        style={{ width: `${((240 - timeLeft) / 240) * 100}%` }}
      />
    </div>
    <div>Waiting... {timeLeft}s remaining</div>
    <button 
      onClick={() => { /* force unlock */ }}
      className="text-xs text-amber-400 hover:underline mt-1"
    >
      Skip wait (not recommended)
    </button>
  </div>
)}
```

---

## Текущий статус: ✅ РАБОТАЕТ ПРАВИЛЬНО

Не меняй без необходимости — это защита, а не баг!

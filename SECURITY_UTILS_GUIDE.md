# 🚀 QUICK START - Security Utils Reference

## Импорт

```typescript
import {
  safeBigInt,
  isValidAddress,
  isValidTokenId,
  isValidAmount,
  isValidGasLimit,
  isCorrectChain,
  sanitizeInput,
  safeRPCCall,
} from '@/utils/securityUtils';
```

---

## 🔢 safeBigInt()

**Безопасная конвертация в BigInt**

```typescript
// ❌ ОПАСНО
const tokenId = BigInt(userInput); // может крашнуть!

// ✅ БЕЗОПАСНО
const tokenId = safeBigInt(userInput);
if (!tokenId) {
  toast.error('Invalid token ID');
  return;
}
```

**Возвращает:**
- `bigint` если успешно
- `null` если невалидный input

**Примеры:**
```typescript
safeBigInt('123')       // 123n
safeBigInt(123)         // 123n
safeBigInt('abc')       // null
safeBigInt('')          // null
safeBigInt(undefined)   // null
safeBigInt(-5)          // null (отрицательные не поддерживаются)
```

---

## 🏠 isValidAddress()

**Валидация Ethereum адреса**

```typescript
const address = '0x1234...';

if (!isValidAddress(address)) {
  toast.error('Invalid wallet address');
  return;
}
```

**Проверяет:**
- Начинается с `0x`
- 40 hex символов после `0x`
- Только валидные символы (0-9, a-f, A-F)

---

## 🎫 isValidTokenId()

**Валидация NFT Token ID**

```typescript
const tokenId = userInput;

if (!isValidTokenId(tokenId)) {
  toast.error('Token ID must be a positive number');
  return;
}

const id = safeBigInt(tokenId)!; // теперь безопасно
```

**Проверяет:**
- Число больше 0
- Не превышает max uint256
- Может быть сконвертировано в BigInt

---

## 💰 isValidAmount()

**Валидация amounts (для токенов/NFT)**

```typescript
import { parseEther } from 'viem';

try {
  const amount = parseEther(amountInput);
  
  if (!isValidAmount(amount)) {
    toast.error('Amount must be positive');
    return;
  }
  
  // Использовать amount
} catch (error) {
  toast.error('Invalid amount format');
  return;
}
```

---

## ⛽ isValidGasLimit()

**Валидация gas limit**

```typescript
const gasLimit = 500000;

if (!isValidGasLimit(gasLimit)) {
  toast.error('Gas limit out of range');
  return;
}
```

**Проверяет:**
- Минимум: 21,000 (минимальная транзакция)
- Максимум: 10,000,000 (разумный лимит для Monad)

---

## 🌐 isCorrectChain()

**Проверка chain ID**

```typescript
import { useChainId } from 'wagmi';

const MONAD_TESTNET_ID = 10143;

const MyComponent = () => {
  const chainId = useChainId();
  
  const handleTransaction = async () => {
    if (!isCorrectChain(chainId, MONAD_TESTNET_ID)) {
      toast.error('Please switch to Monad Testnet (Chain ID: 10143)');
      return;
    }
    
    // Безопасно делать транзакцию
    await writeContract({ ... });
  };
  
  return <button onClick={handleTransaction}>Submit</button>;
};
```

---

## 🧹 sanitizeInput()

**Очистка user input от опасных символов**

```typescript
const userComment = sanitizeInput(rawInput);

// Удаляет:
// - HTML символы: < > " ' &
// - Newlines: \r \n
// - Command injection: ;
// - Обрезает до 1000 символов
```

**Использование:**
```typescript
const handleSubmit = (data: FormData) => {
  const cleanName = sanitizeInput(data.name);
  const cleanComment = sanitizeInput(data.comment);
  
  // Теперь безопасно сохранить
  saveToDatabase({ name: cleanName, comment: cleanComment });
};
```

---

## 🔌 safeRPCCall()

**RPC wrapper с timeout и rate limiting**

```typescript
import { createPublicClient, http } from 'viem';

const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

// ✅ С защитой
const data = await safeRPCCall(
  () => publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getData',
    args: [tokenId],
  }),
  30000 // timeout 30 секунд (опционально, default 30s)
);
```

**Защищает от:**
- ⏱️ Бесконечного ожидания (timeout)
- 🚦 Превышения rate limit (100 calls/min)
- 💥 Неожиданных ошибок

**Обработка ошибок:**
```typescript
try {
  const result = await safeRPCCall(() => 
    publicClient.readContract({ ... })
  );
  
  console.log('Success:', result);
} catch (error) {
  if (error.message === 'Rate limit exceeded. Please wait.') {
    toast.error('Too many requests. Please wait a minute.');
  } else if (error.message === 'RPC call timeout') {
    toast.error('Network timeout. Please try again.');
  } else {
    toast.error('RPC error: ' + error.message);
  }
}
```

---

## 🎯 ПОЛНЫЙ ПРИМЕР: Breed Transaction

```typescript
'use client';

import { useState } from 'react';
import { useChainId, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import {
  safeBigInt,
  isValidTokenId,
  isCorrectChain,
  safeRPCCall,
} from '@/utils/securityUtils';

const MONAD_TESTNET_ID = 10143;
const CONTRACT_ADDRESS = '0x...';

export default function BreedForm() {
  const [tokenId1, setTokenId1] = useState('');
  const [tokenId2, setTokenId2] = useState('');
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  const handleBreed = async () => {
    // 1. Проверка chain ID
    if (!isCorrectChain(chainId, MONAD_TESTNET_ID)) {
      toast.error('Please switch to Monad Testnet');
      return;
    }

    // 2. Валидация inputs
    const id1 = safeBigInt(tokenId1);
    const id2 = safeBigInt(tokenId2);

    if (!id1 || !isValidTokenId(id1)) {
      toast.error('Invalid Token ID #1');
      return;
    }

    if (!id2 || !isValidTokenId(id2)) {
      toast.error('Invalid Token ID #2');
      return;
    }

    try {
      // 3. Проверка graveyard с защитой
      const isReady = await safeRPCCall(
        () => publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: GAME_ABI,
          functionName: 'isGraveyardReady',
        }),
        30000
      );

      if (!isReady) {
        toast.error('Graveyard is not ready');
        return;
      }

      // 4. Отправка транзакции
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'requestBreed',
        args: [id1, id2],
      });

      toast.success(`Breeding started! Hash: ${hash}`);
    } catch (error) {
      toast.error('Transaction failed: ' + error.message);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleBreed(); }}>
      <input
        value={tokenId1}
        onChange={(e) => setTokenId1(e.target.value)}
        placeholder="Token ID 1"
      />
      <input
        value={tokenId2}
        onChange={(e) => setTokenId2(e.target.value)}
        placeholder="Token ID 2"
      />
      <button type="submit">Breed</button>
    </form>
  );
}
```

---

## 📚 КОГДА ИСПОЛЬЗОВАТЬ

| Функция | Когда использовать |
|---------|-------------------|
| `safeBigInt()` | Перед ЛЮБЫМ `BigInt()` на user input |
| `isValidAddress()` | Проверка wallet адресов |
| `isValidTokenId()` | Проверка NFT IDs |
| `isValidAmount()` | Проверка token amounts |
| `isCorrectChain()` | Перед ЛЮБОЙ транзакцией |
| `sanitizeInput()` | Перед сохранением user text |
| `safeRPCCall()` | Для ВСЕХ RPC вызовов |

---

## ⚠️ ВАЖНО

1. **ВСЕГДА** используйте `safeBigInt()` вместо `BigInt()`
2. **ВСЕГДА** проверяйте chain ID перед транзакциями
3. **ВСЕГДА** оборачивайте RPC calls в `safeRPCCall()`
4. **НИКОГДА** не доверяйте user input без валидации

---

## 🐛 DEBUGGING

```typescript
// Включить детальное логирование
import { globalRateLimiter } from '@/utils/securityUtils';

// Сбросить rate limiter (для дебага)
globalRateLimiter.reset();

// Проверить можно ли делать вызов
if (globalRateLimiter.canMakeCall()) {
  console.log('OK to make RPC call');
} else {
  console.log('Rate limited, wait a bit');
}
```

---

**Готово! 🚀 Используйте эти утилиты везде и приложение будет безопасным.**

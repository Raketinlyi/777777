# План: единая точка переключения контрактов на всём сайте

Цель: менять адреса и небольшие отличия контрактов только в одном месте, чтобы весь фронтенд автоматически подхватывал изменения без правок страниц и хука каждого экрана. Без упоминаний монет, названий игры и сетей — документация и код остаются нейтральными.

## Что считаем «одним местом»

1) Файл окружения `.env` (или `.env.production`) — в нём хранятся адреса контрактов:

- `NEXT_PUBLIC_CORE_PROXY` — основной контракт
- `NEXT_PUBLIC_NFT_ADDRESS` — коллекция NFT
- `NEXT_PUBLIC_READER_ADDRESS` — вспомогательный ридер (если используется)

2) Конфигурация `config/chains.ts` — только читает значения из `.env` и отдаёт их дальше. В ней нет жёсткозашитых названий.

3) Единый модуль экспорта конфигов контрактов: `lib/contracts.ts` — сюда импортируются адреса из `config/chains.ts`, и отсюда забирают их все хуки/страницы.

## Архитектура: слои абстракции

- Слой окружения: `.env` → `config/chains.ts`
- Слой контрактов: `lib/contracts.ts` (адреса + ABI)
- Слой «клиента»/адаптера: единые методы взаимодействия, которые прячут различия в именах и сигнатурах
- Хуки и страницы: используют только клиент-адаптер, не знают про адреса/ABI

## Шаги реализации

1. Централизовать адреса
- Используем уже существующие ключи `.env`: `NEXT_PUBLIC_CORE_PROXY`, `NEXT_PUBLIC_NFT_ADDRESS`, `NEXT_PUBLIC_READER_ADDRESS`.
- Убедиться, что `config/chains.ts` не содержит жёстких названий и только читает значения через `process.env`.

2. Расширить `lib/contracts.ts`
- Экспортировать конфиги всех нужных контрактов из одного места: `coreContractConfig`, `nftContractConfig`, `readerContractConfig` (если требуется).
- Ни один другой модуль не должен хранить адреса или ABI — только импортировать из `lib/contracts.ts`.

3. Добавить универсальный хук
- Создать `useContractsV2` (или аналог):
  - Возвращает готовые конфиги и/или клиентов: `{ core, reader, nft, chainId }`.
  - Источник адресов — только `lib/contracts.ts`.

4. Реализовать адаптер-клиент
- Цель: единые методы, одинаковые для всех версий контрактов:
  - `ping(tokenId)`
  - `burnNFT(tokenId)`
  - `requestBreed(parent1Id, parent2Id)`
  - `claimBurnRewards(args)`
  - `getBreedQuote(args)`
- Внутри адаптера:
  - Если контракт использует альтернативное имя метода (например, `breed` вместо `requestBreed`), клиент сам подбирает правильное имя.
  - Если какая-то сигнатура слегка отличается — адаптер трансформирует аргументы.
- Итого: фронтенд вызывает только методы клиента. При смене контракта правим адаптер в одном месте.

5. Рефактор хуков
- Перевести существующие хуки (ping, burn, rewards, breed и т.п.) на использование адаптера.
- Исключить прямые обращения к адресам/ABI и конкретным functionName из хуков.

6. Интеграция на страницах
- Страницы используют только хуки, а хуки — только адаптер. Никаких адресов/ABI/имён функций в коде страниц.

7. Валидация на сборке
- Добавить скрипт проверки окружения (например, в `scripts/`):
  - Проверить корректность адресов из `.env`.
  - Проверить наличие базовых методов в ABI (или что адаптер умеет подбирать альтернативы).
- Если проверка не проходит — сборка падает с понятным сообщением.

8. Smoke-тесты совместимости
- Лёгкие тесты на запуске dev:
  - Пробный вызов чтения состояния (`state`, `meta` или аналог).
  - Пробный вызов адаптера `ping` (без транзакции, либо dry-run, если поддерживается).
  - Проверка ридера (`getBreedQuote`), если есть.

## Как переключать контракт «в одном месте»

1) Откройте `.env` и обновите адреса:

```
NEXT_PUBLIC_CORE_PROXY=0x...
NEXT_PUBLIC_NFT_ADDRESS=0x...
NEXT_PUBLIC_READER_ADDRESS=0x...
```

2) Перезапустите dev-сервер.

3) Всё: страницы и хуки автоматически подхватят новые адреса, потому что они завязаны только на `lib/contracts.ts` и адаптер.

## Чек-лист «без упоминаний»

- Документация (README, гайды): не используем названия монет, игры и сетей.
- UI тексты (локализации в `lib/locales/`): удалить/обобщить специфичные названия.
- Конфиг: переменные окружения и ключи остаются нейтральными.
- Логи/тосты: тексты нейтральные (например, «Операция успешна», «Ошибка транзакции»), без названий.

## Пример адаптера (псевдокод)

```ts
// lib/coreAdapter.ts — пример интерфейса и простого клиента
export interface CoreClient {
  ping: (tokenId: bigint | number) => Promise<void>;
  burnNFT: (tokenId: bigint | number) => Promise<void>;
  requestBreed: (parent1Id: bigint | number, parent2Id: bigint | number) => Promise<void>;
  claimBurnRewards: (args: unknown) => Promise<void>;
  getBreedQuote: (args: unknown) => Promise<unknown>;
}

export function createCoreClient(deps: {
  writeContract: (args: { address: string; abi: unknown; functionName: string; args?: unknown[] }) => Promise<unknown>;
  readContract: (args: { address: string; abi: unknown; functionName: string; args?: unknown[] }) => Promise<unknown>;
  coreConfig: { address: string; abi: unknown };
  readerConfig?: { address: string; abi: unknown };
}): CoreClient {
  const { writeContract, readContract, coreConfig, readerConfig } = deps;

  const callCore = async (fn: string, args: unknown[] = []) => {
    return writeContract({ address: coreConfig.address, abi: coreConfig.abi, functionName: fn, args });
  };

  const callReader = async (fn: string, args: unknown[] = []) => {
    if (!readerConfig) throw new Error('Reader not configured');
    return readContract({ address: readerConfig.address, abi: readerConfig.abi, functionName: fn, args });
  };

  return {
    ping: async (tokenId) => {
      // авто-выбор имени функции (пример)
      await callCore('ping', [tokenId]);
    },
    burnNFT: async (tokenId) => {
      await callCore('burnNFT', [tokenId]);
    },
    requestBreed: async (a, b) => {
      // если в новой версии контракт называет метод иначе, адаптер решает это в одном месте
      // например, можно сначала попытаться вызвать 'requestBreed', при ошибке — 'breed'
      try { await callCore('requestBreed', [a, b]); }
      catch { await callCore('breed', [a, b]); }
    },
    claimBurnRewards: async (args) => {
      await callCore('claimBurnRewards', Array.isArray(args) ? args : [args]);
    },
    getBreedQuote: async (args) => {
      return callReader('getBreedQuote', Array.isArray(args) ? args : [args]);
    },
  };
}
```

## Итог

После внедрения этой схемы вы меняете адреса контрактов только в `.env`, а возможные отличия между версиями контрактов — в одном адаптере. Страницы и хуки не трогаете. Документация и тексты остаются нейтральными — без названий монет, игры и сетей.
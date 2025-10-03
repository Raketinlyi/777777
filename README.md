# Руководство по подключению фронтенда к смарт-контрактам

Это руководство описывает, как подключить фронтенд к основным функциям смарт-контрактов проекта.

## 1. Подключение к сайту

Для взаимодействия с контрактами используйте `ethers.js`. Вам понадобятся ABI файлов `CrazyOctagonCoreUUPS.json` и `CrazyOctagonReader.json` из папки `контрамонад2в1/artifacts/contracts-core/`, а также адреса контрактов.

**Адреса контрактов:**
- `CORE_PROXY`: `0xb8Fee974031de01411656F908E13De4Ad9c74A9B`
- `READER`: `0xF9017a4701E1464690d6b71E2Fb3AF9c4c1acab1`
- `NFT`: `0x4bcd4aff190d715fa7201cce2e69dd72c0549b07`
- `OCTA`: `0xB4832932D819361e0d250c338eBf87f0757ed800`
- `CRAA`: `0x7D7F4BDd43292f9E7Aae44707a7EEEB5655ca465`

**Пример инициализации контрактов:**

```javascript
import { ethers } from "ethers";
import CoreAbi from "./CrazyOctagonCoreUUPS.json"; // Укажите правильный путь к ABI
import ReaderAbi from "./CrazyOctagonReader.json"; // Укажите правильный путь к ABI

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const coreContract = new ethers.Contract("0xb8Fee974031de01411656F908E13De4Ad9c74A9B", CoreAbi.abi, signer);
const readerContract = new ethers.Contract("0xF9017a4701E1464690d6b71E2Fb3AF9c4c1acab1", ReaderAbi.abi, provider);
```

---

## 2. Ping

Пинг позволяет пользователю получать награды в токенах **OCTA** за владение NFT.

### Настройка и условия
- **Активация:** NFT должен быть активирован. Первый вызов `ping` для NFT активирует его.
- **Владение:** Пользователь должен быть владельцем NFT.
- **Статус:** NFT не должен находиться на кладбище (`isInGraveyard` должно быть `false`).
- **Кулдаун:** Между пингами должен пройти интервал времени, заданный в контракте (`pingInterval`).

### Действие
- **Вызов:** `coreContract.ping(tokenId)`
- **Логика:**
  1. Контракт проверяет все условия.
  2. Рассчитывает награду в **OCTA** на основе `sharePerPing` и бонусов (например, за редкость).
  3. Начисляет награду на внутренний баланс NFT (`lockedOcta`).
- **Пример:**
  ```javascript
  // Проверка, что все условия выполнены, перед отображением кнопки пинга
  const state = await coreContract.state(tokenId);
  const isReadyToPing = state.lastPingTime === 0 || (Date.now() / 1000) > state.lastPingTime + await coreContract.pingInterval();

  if (isReadyToPing) {
    await coreContract.ping(tokenId);
  }
  ```

---

## 3. Burn (Сжигание)

Сжигание NFT для получения накопленных наград **OCTA**.

### Действие
1.  **Комиссия:** Пользователь платит комиссию за сжигание в токенах **OCTA**. Эта комиссия рассчитывается от накопленной суммы (`lockedOcta`).
2.  **Перевод NFT:** NFT переводится на адрес контракта.
3.  **Ожидание:** Запускается период ожидания (`waitMinutes`), по истечении которого можно будет забрать награды.

### Вызов
- **Функция:** `burnNFT(tokenId, waitMinutes)`
- **Параметры:**
    - `tokenId`: ID сжигаемого NFT.
    - `waitMinutes`: Время ожидания в минутах (например, `30`, `120`, `480`). От этого выбора зависит, какая часть наград достанется игроку.
- **Пример:**
  ```javascript
  const tokenId = 123;
  const waitMinutes = 120; // Пользователь выбирает время ожидания

  // 1. Рассчитать и подтвердить комиссию в OCTA
  const feeBps = await coreContract.burnFeeBps();
  const state = await coreContract.state(tokenId);
  const lockedOcta = state.lockedOcta;
  const fee = (lockedOcta * feeBps) / 10000n;
  
  // const octaContract = new ethers.Contract(OCTA_ADDRESS, ERC20_ABI, signer);
  // await octaContract.approve(coreContract.address, fee);

  // 2. Вызвать сжигание
  await coreContract.burnNFT(tokenId, waitMinutes);
  ```

---

## 4. Breed (Родить)

Скрещивание двух NFT для получения нового. Это единственная операция, где используется токен **CRAA**.

### Действие
1.  **Оплата:** Пользователь платит за скрещивание токенами **OCTA** и **CRAA**.
2.  **Родители:** Два NFT-родителя теряют по одной звезде.
3.  **Новый NFT:** Пользователь получает "воскрешенного" NFT с кладбища.

### Вызов
- **Функция:** `requestBreed(parent1Id, parent2Id, salt)`
- **Пример:**
  ```javascript
  // 1. Получить стоимость в OCTA и CRAA
  const [octaCost, craaCost] = await coreContract.getBreedCosts();

  // 2. Запросить approve на OCTA и CRAA
  // await octaContract.approve(coreContract.address, octaCost);
  // await craaContract.approve(coreContract.address, craaCost);

  // 3. Вызвать скрещивание
  await coreContract.requestBreed(parent1Id, parent2Id, Math.floor(Math.random() * 1e9));
  ```

---

## 5. Graveyard (Кладбище)

Кладбище используется для "воскрешения" NFT в процессе скрещивания.

- **Оповещение:** Фронтенд может отображать, готово ли кладбище для использования, с помощью функции `isGraveyardReady()`.
- **Пример:**
  ```javascript
  const isReady = await coreContract.isGraveyardReady();
  if (isReady) {
    // Показать пользователю, что можно использовать NFT с кладбища
  }
  ```

---

## 6. Rewards (Claim)

Получение наград **OCTA** после сжигания NFT.

- **Действие:** Вызвать `claimBurnRewards(tokenId)` после истечения времени ожидания.
- **Пример:**
  ```javascript
  await coreContract.claimBurnRewards(tokenId);
  ```

---

## 7. Info (Получение информации)

Для отображения актуальной информации на фронтенде можно использовать следующие view-функции и публичные переменные контракта `coreContract`:

- `meta(tokenId)`: Возвращает метаданные NFT (редкость, пол и т.д.).
- `state(tokenId)`: Возвращает состояние NFT (звезды, заблокированные **OCTA**, время последнего пинга).
- `nftLP(tokenId)`: Информация о ликвидности, связанной с NFT.
- `getBreedCosts()`: Возвращает стоимость скрещивания в **OCTA** и **CRAA**.
- `burnFeeBps()`: Комиссия за сжигание в базисных пунктах (платится в **OCTA**).
- `isGraveyardReady()`: Готовность кладбища.

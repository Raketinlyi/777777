# CrazyOctagon — Core + Helper (Reader)

Этот документ описывает:
- Архитектуру проекта (Core + Helper/Reader)
- Пошаговый деплой и настройку (Monad testnet)
- Полный перечень админ‑функций (Core + Helper)
- Инструкции для фронтенда (как подключить, какие функции вызывать)
- Индексацию событий и мониторинг
- Частые проблемы и их решение


## 1) Архитектура

- Core (CrazyOctagonCoreUUPS)
  - UUPS‑апгрейдируемый контракт за ERC1967-прокси
  - Хранит все средства и игровую логику: пулы, ping, burn/claim, кладбище/graveyard, breed, экономику и LP-настройки
  - Сетап параметров через роли (AccessControl)

- Helper/Reader (CrazyOctagonReader)
  - Выполняет операции UniswapV2: swap/add/remove через Router V2
  - Все LP‑методы доступны только Core (onlyCore), защищены паузой и nonReentrant
  - Пауза с таймлоком (задаётся Core): смена длительности сопровождается «окном паузы», новое значение вступает в силу только после текущего окна
  - Имеет вспомогательные вью‑методы для фронта

- Выдача LP при claim: фиксированный режим — снять ликвидность, OCTA сжечь, вторую монету (pairToken) отправить пользователю.


## 2) Адреса сети (Monad testnet — пример)

- NFT (ERC721): 0x4bcd4aff190d715fa7201cce2e69dd72c0549b07
- OCTA (ERC20): 0xB4832932D819361e0d250c338eBf87f0757ed800
- CRAA (ERC20): 0x7D7F4BDd43292f9E7Aae44707a7EEEB5655ca465
- Router V2: 0x3a3eBAe0Eec80852FBC7B9E824C6756969cc8dc1
- pairToken (WMON): 0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701
- Dead: 0x000000000000000000000000000000000000dEaD


## 3) Подготовка окружения

- .env:
  - PRIVATE_KEY=0x...
  - RPC_URL=https://... (Monad testnet)
  - (опционально) NFT, OCTA, CRAA, ROUTER, PAIR_TOKEN
- addresses.json — справочник адресов, скрипты читают/записывают туда CORE_PROXY/CORE_IMPL/READER


## 4) Сборка

- npx hardhat compile


## 5) Деплой и базовая настройка

1. Деплой Core (имплементация + ERC1967Proxy с initialize(NFT, OCTA, admin))
   - npx hardhat run scripts/deploy_core.js --network mainnetLike

2. Деплой Helper/Reader (конструктор: CORE_PROXY, ROUTER, PAIR_TOKEN)
   - npx hardhat run scripts/deploy_reader.js --network mainnetLike

3. Привязка Helper к Core, установка слиппеджа
   - npx hardhat run scripts/set_lpmanager.js --network mainnetLike

4. Базовая конфигурация Core
   - npx hardhat run scripts/set_config_base.js --network mainnetLike
   - Что включает скрипт:
     - CRAA адрес (setCRAA)
     - «Раздачу на 9800»: monthlyUnlock=4%, distributionDenominator=9800, evenDailyDistribution=true, returnUnusedAtPeriodEnd=true, minSharePerPing=1
  - Параметры ping/sweep и экономику breed
  - Режим LP фиксирован (сжечь OCTA, пользователю только pairToken)
  - recalcShareNow() или poke()


## 6) Роли и безопасность

- DEFAULT_ADMIN_ROLE, ADMIN_ROLE — полный контроль и апгрейды, пауза, emergency‑выводы
- CONFIGURATOR_ROLE — настройка параметров (тайминги, проценты, лимиты, LP)
- FUND_ROLE — reconcileBalances() (техоперации по балансам)
- PRICER_ROLE — ручные цены: setManualFloor, setCRARateManual

Core защищён Pausable и ReentrancyGuard, Helper — onlyCore, whenNotPaused (paused + pauseEnd), nonReentrant, дедлайны для DEX‑операций.


## 7) Полный перечень админ‑функций

Core (CrazyOctagonCoreUUPS):
- Роли и пауза:
  - grantRole(bytes32,address), revokeRole(bytes32,address), renounceRole(bytes32,address)
  - pause(), unpause()

- Unlock/распределение и расчёты:
  - setMonthDuration(uint256 sec)
  - setMonthlyUnlockPercentage(uint16 bps) — [0..10000]
  - setReturnUnused(bool)
  - setEvenDailyDistribution(bool)
  - setDistributionDenominator(uint256) — [1..1_000_000]
  - setMinSharePerPing(uint256)
  - setPingTiming(uint256 interval, uint256 maxAccum)
  - setSweepInterval(uint256 sec)
  - setManualSharePerPing(uint256 perPing, bool on)
  - (setTargetPerMinute удалён)
  - forceMoveToMonthly(uint256 amount)

- Экономика/риски:
  - setSafetyBps(uint16 bps) — <=10%
  - setBurnFeeBps(uint16 bps) — <=20%

- Бонусы и лимиты:
  - setRarityBonus(uint8 r, uint16 bps) — r ∈ [1..6]
  - setClampBounds(int16 minPenaltyBps, int16 maxBonusBps)
  - setSpecialBonus(uint256 tokenId, int16 bps)

- Breed/LP/Sponsor/цены:
  - setBreedPercents(uint16 octaBps, uint16 craaBps, uint16 lpFromFloorBps) — octa+craa=4000 (40%), lp<=octa
  - setCRAA(address)
  - setCRARateManual(uint256 rate1e18) / setCRARateOracle(address oracle, bool use)
  - setManualFloor(uint256 floor1e18) / setFloorOracle(address oracle, bool use)
  - setSponsor(address treasury, uint16 bps) — <=20000 (200%)
  - setLPHelper(address helper)
  - setLPSlippageBps(uint16 bps) — <=2000 (20%)
  - (LP payout mode — фиксирован, без переключений)
  - setDeadAddress(address)
  - setManualActivateEnabled(bool)

- Graveyard / revive:
  - setGraveChunkSize(uint16 s) — [1..1000]
  - setReviveGate(uint16 min, uint16 max)
  - adminSeedGrave(uint256[] ids, uint256 releaseDelaySec) — массовое помещение уже принадлежащих Core NFT в кладбище

- Метаданные NFT (до первой активации):
  - adminSetMeta(uint256 tokenId, uint8 rarity, uint8 initialStars, uint8 gender)
  - adminSetMetaBatch(uint256[] ids, uint8[] rar, uint8[] stars, uint8[] genders)

- Экстренные выводы (ADMIN_ROLE):
  - adminWithdrawERC20(address token, address to, uint256 amount)
  - adminWithdrawERC721(address nftAddr, uint256 tokenId, address to)

- Утилиты:
  - reconcileBalances()

Helper/Reader (CrazyOctagonReader):
- Управление паузой/дедлайнами (onlyCore):
  - setPaused(bool on) — включает паузу минимум на minPauseDuration (если не задана — 60 сек)
  - setPauseDuration(uint256 seconds) — новое значение вступает после текущего enforced окна; при вызове включается пауза на текущее окно
  - applyPendingPauseDuration() — применяет ранее заданное значение после pendingMinPauseActivateAt и после окончания pauseEnd
  - setDeadlineWindow(uint256 seconds) — дедлайн окна для Router операций
- Вью:
  - getLPParams() → (router, lpPairAddress)


## 8) Фронтенд: как подключить и вызывать

Пример на ethers.js:

```ts
import { ethers } from "ethers";
import CoreAbi from "./artifacts/CrazyOctagonCoreUUPS.json";
import ReaderAbi from "./artifacts/CrazyOctagonReader.json";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer   = await provider.getSigner();

const core   = new ethers.Contract(CORE_PROXY, CoreAbi.abi, signer);
const reader = new ethers.Contract(READER_ADDR, ReaderAbi.abi, provider);
```

Пользовательские действия:
- Ping:
```ts
await core.ping(tokenId);
```
- Burn:
```ts
const feeBps = await core.burnFeeBps();
const st = await core.state(tokenId);
const locked = st.lockedOcta;
const fee = locked * feeBps / 10000n;
await octa.approve(CORE_PROXY, fee);
await core.burnNFT(tokenId, 120); // 30 / 120 / 480
```
- Claim:
```ts
await core.claimBurnRewards(tokenId);
// В режиме 2 Helper снимает LP, сжигает OCTA, пользователю переводит pairToken
```
- Breed:
```ts
const [octaCost, craaCost, lpPart, octaToMain] = await core.getBreedCosts();
const sponsorBps = await core.sponsorBps();
const sponsorFee = (octaCost * sponsorBps) / 10000n;

await octa.approve(CORE_PROXY, octaCost + sponsorFee);
if (craaCost > 0n) await craa.approve(CORE_PROXY, craaCost);
await core.requestBreed(parent1Id, parent2Id, Math.floor(Math.random()*1e9));
```

Инспекторы/вью (минимум):
- core.isGraveyardReady()
- core.getBreedCosts()
- core.nftOwner(tokenId)
- Прямое чтение публичных структур:
  - core.meta(tokenId) → (rarity, initialStars, gender, isActivated)
  - core.state(tokenId) → (currentStars, bonusStars, isInGraveyard, lockedOcta, lastPingTime, lastBreedTime)
  - core.nftLP(tokenId) → (helper, pair, lpAmount, octaDeposited, pairDeposited)
  - Параметры системы (pingInterval, maxAccumulation, safetyBps и т.д.)


## 9) Массовое наполнение кладбища (~3000 NFT)

1) Переведите нужные tokenId на адрес Core (Core должен стать владельцем)
2) Вызвать core.adminSeedGrave(idsBatch, releaseDelaySec) партиями (200–500 id)
3) После истечения releaseDelaySec NFT станут кандидатами для revive


## 10) События (для индексации/аналитики)

- Pinged(tokenId, reward, newLocked)
- PingBonus(tokenId, newBonusBps)
- BurnScheduled(tokenId, owner, amount, claimAt, waitMin)
- BurnClaimed(tokenId, owner, player, pool, burned)
- BreedRequested(user, p1, p2, octaCost, craaCost, lpPart, octaMain, sponsorFee)
- BreedFinalized(user, revived, bonusStars)
- ClaimReserveFunded(tokenId, principal, safety)
- ClaimReserveReleased(tokenId, principal, safety)
- SafetyShortfall(required, funded)
- ExcessSwept(amount)
- Config(key, a, b)
- Reader: PauseSet(on, pauseEnd), PauseDurationProposed(newSeconds, applyAt), PauseDurationApplied(newSeconds)


## 11) Мониторинг (минимум)

- Пулы: monthlyRewardPool, totalLockedForRewards, claimReservePool
- sharePerPing > 0 при положительном monthlyRewardPool (если evenDailyDistribution=true)
- SafetyShortfall события — тревога
- isGraveyardReady() — периодическая true при заполненном кладбище
- Изменения админ-параметров (слушать Config)
- LP режим 2: при claim пользователю не должен приходить OCTA (ожидается burn)


## 12) Частые проблемы и решения

- OpenZeppelin upgradeable импорты (5.x): используйте utils/ для ReentrancyGuardUpgradeable/PausableUpgradeable
- Router/Pair: убедитесь, что factory.getPair(OCTA, pairToken) существует; иначе LP операции упадут (Reader проверяет)
- Пауза Helper: все LP операции блокируются если paused=true или сейчас < pauseEnd; смена длительности — через timelock‑процедуру
- CRAA unset: set_config_base.js вызывает setCRAA; без этого breed при CRAA>0 будет revert


## 13) Порядок запуска (чек‑лист)

- npx hardhat compile
- npx hardhat run scripts/deploy_core.js --network mainnetLike
- npx hardhat run scripts/deploy_reader.js --network mainnetLike
- npx hardhat run scripts/set_lpmanager.js --network mainnetLike
- npx hardhat run scripts/set_config_base.js --network mainnetLike


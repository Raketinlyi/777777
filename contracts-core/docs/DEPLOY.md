# Deploy — step by step

This guide assumes contracts compiled and available to Hardhat:
- `CrazyOctagonCoreUUPS` (implementation behind ERC1967 proxy)
- `CrazyOctagonReader` (Helper+Reader in one contract: LP ops callable only by Core, plus view helpers)

---

## 0) Install & prepare

```bash
npm i
Copy-Item .env.sample .env   # PowerShell (Windows)
# fill PRIVATE_KEY and either MONAD_RPC (preferred) or RPC_URL
```

## 1) Deploy Core (UUPS proxy)

```bash
npx hardhat run scripts/deploy_core.js --network mainnetLike   # generic
# or Monad testnet
npx hardhat run scripts/deploy_core.js --network monadTestnet
```

Script will:
- deploy implementation `CrazyOctagonCoreUUPS`
- deploy `ERC1967Proxy` with `initialize(NFT, OCTA, admin)`
- print the proxy address (write to `addresses.json`)

## 2) Configure Core

Call (via script) the following baseline setters:

- `setMonthDuration(…seconds…)`
- `setMonthlyUnlockPercentage(…bps…)`
- `setReturnUnused(true/false)`
- `setPingTiming(interval, maxAccumulation)`
- `setSweepInterval(…seconds…)`
- `setEvenDailyDistribution(true/false)`
- `setDistributionDenominator(20000)`
- `setMinSharePerPing(1)`
- `setSafetyBps(300)`
- `setBurnFeeBps(1000)`
- `setBreedPercents(3000, 1000, 1000)`  # 30% OCTA; 10% CRAA; 10% of floor goes to LP from OCTA part
- `setCRAA(CRAA_TOKEN_ADDRESS)`
- **Manual pricing only (no oracles in Core)**:
  - `setManualFloor(1e18 * 10_000)`   # example
  - `setCRARateManual(1e18)`          # CRAA per 1 OCTA
- Sponsor:
  - `setSponsor(TREASURY, 10_000)`    # 100% surcharge (optional)
- Grave window:
  - `setGraveChunkSize(50)`
  - `setReviveGate(10, 20)`
- LPPayout controls (how to give LP on claim):
  - LP payout mode is fixed in Core (burn OCTA + send pair token)

Use:
```bash
npx hardhat run scripts/set_config_base.js --network mainnetLike
```

## 3) Wire LP helper (Reader) in Core

Deploy Reader and set it as LP helper in Core:

```bash
npx hardhat run scripts/deploy_reader.js --network mainnetLike
npx hardhat run scripts/deploy_reader.js --network monadTestnet    # Monad testnet
npx hardhat run scripts/set_lpmanager.js --network mainnetLike
npx hardhat run scripts/set_lpmanager.js --network monadTestnet
```

## 4) Deploy Reader (optional but recommended)

Already covered above.

Use the Reader address in the website to fetch inspectors with a single RPC call.

## 5) Batch‑set metadata for your ~3000 NFTs

Prepare `scripts/misc/meta.csv` in the format:
```
tokenId,rarity,stars,gender
1,3,4,1
2,2,5,2
...
```

Call:
```bash
node scripts/set_meta_batch.js --csv scripts/misc/meta.csv --batch 120 --network mainnetLike
node scripts/set_meta_batch.js --csv scripts/misc/meta.csv --batch 120 --network monadTestnet
```

> You can safely run multiple batches. Metadata can be set **only before the first activation** of a token (`ping`).

---

## 6) Final checks

Run either recalcShareNow() or a poke once (both will sweep & recalc; poke will also auto-unlock if period elapsed).
- Verify `isGraveyardReady()` and `getBreedCosts()` give sane values.
- Test flow on small test accounts before public launch.

---

## Monad testnet specifics

- Set `MONAD_RPC` in `.env`. If you know chain id, set `MONAD_CHAIN_ID` (some devnets used 20143; check current docs/chainlist for public testnet). If omitted, Hardhat will attempt to auto-detect.
- Use addresses for `NFT`, `OCTA`, `CRAA`, `ROUTER`, and `PAIR_TOKEN` available on Monad testnet. Router must be UniswapV2-compatible; pair token is typically wrapped native (e.g., WMON).
- On Windows PowerShell, use `;` to chain commands if needed.

Quick path (PowerShell):

```powershell
# .env must have MONAD_RPC and PRIVATE_KEY
npm run deploy:core:monad ; npm run deploy:reader:monad ; npm run lp:set:monad ; npm run config:monad
```

### Autonomous mode (minimal scripts)

- Route surcharge back to Core so funds remain inside the system:
  - `npm run sponsor:set:monad -- --addr %CORE_PROXY% --bps 1000`  # 10% surcharge back to Core
- Set prices only when needed (manual floor and CRAA rate):
  - `npm run price:set:monad -- --floor 10000 --rate 1`
- Optional periodic maintenance (can be cron or manual):
  - `npm run poke:monad`  # sweep/recalc via poke


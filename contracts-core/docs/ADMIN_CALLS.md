# Admin call reference

All calls are on the **Core (proxy)** unless noted.

## Roles
- `grantRole(bytes32 role, address account)`
- `revokeRole(bytes32 role, address account)`
- `renounceRole(bytes32 role, address account)`
- Roles: `DEFAULT_ADMIN_ROLE`, `ADMIN_ROLE`, `CONFIGURATOR_ROLE`, `FUND_ROLE`

## Pausing
- `pause()` / `unpause()`

## Unlocking & distribution
- `setMonthDuration(uint256 sec)` — [60 .. 30 days]
- `setMonthlyUnlockPercentage(uint16 bps)` — [0 .. 10000]
- `setReturnUnused(bool on)`
- `setEvenDailyDistribution(bool on)`
- `setDistributionDenominator(uint256 d)` — [1 .. 1_000_000]
- `setMinSharePerPing(uint256 v)`
- `setPingTiming(uint256 interval, uint256 maxAccum)`` — [60..3d], [interval..14d]
- `setSweepInterval(uint256 sec)` — [60 .. 7d]
Use `recalcShareNow()` to sweep and recalc immediately (without rolling the unlock), or `poke()` to do the same and also roll unlock if period elapsed.

## Safety & burn
- `setSafetyBps(uint16 bps)` — default 300 (3%)
- `setBurnFeeBps(uint16 bps)` — default 1000 (10%)
- `setGraveChunkSize(uint16 s)` — default 50

## Rarity & bonus clamps
- `setRarityBonus(uint8 r, uint16 bps)` — r in [1..6]
- `setClampBounds(int16 minPen, int16 maxBon)` — min [-9999..0], max [0..32767]
- `setSpecialBonus(uint256 tokenId, int16 bps)`

## Breed economics
- `setBreedPercents(uint16 octaBps, uint16 craaBps, uint16 lpFromFloorBps)` (sum == 4000)
- `setCRAA(address token)`
- **Manual pricing** (no on‑chain oracles):
  - `setManualFloor(uint256 floor1e18)`
  - `setCRARateManual(uint256 rate1e18)`  # CRAA per 1 OCTA
- Sponsor:
  - `setSponsor(address treasury, uint16 bps)`  # up to 20000 (200%)

## LP config
- `setLPConfig(address router, address pairToken)`
- `setLPSlippageBps(uint16 bps)` — default 300 (3%)
LP payout mode is fixed in Core: burn OCTA + send pair token to user on claim

## Revive & graveyard
- `setReviveGate(uint16 min, uint16 max)` — default 10..20
- (Grave handled internally; you can check `isGraveyardReady()`)

## Housekeeping
- `setDeadAddress(address)`
- `setManualActivateEnabled(bool)`
- `reconcileBalances()` — in case extra OCTA was sent to the Core

## NFT metadata (before first activation only)
- `adminSetMeta(uint256 tokenId, uint8 rarity, uint8 initialStars, uint8 gender)`
- `adminSetMetaBatch(uint256[] ids, uint8[] rar, uint8[] stars, uint8[] genders)`

## Graveyard seeding

- `adminSeedGraveBatch(uint256[] ids)` — onlyConf/ADMIN
  - Batch grave seeding of NFTs already held by Core (ownerOf(id) == Core).
  - Soft limit: recommend 1..200 IDs per tx to avoid block gas limit.
  - For each id: marks `state[id].isInGraveyard`, updates `inGrave`, `graveIdx`, pushes into `graveList`, and sets `burns[id].graveReleaseAt = now + graveyardCooldown`.
  - Event: `GraveSeedBatch(requested, seeded)`


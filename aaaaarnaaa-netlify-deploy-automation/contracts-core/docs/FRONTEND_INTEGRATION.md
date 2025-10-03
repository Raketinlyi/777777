# Front‑end integration (ethers.js)

This section assumes you have **Core proxy** and (optionally) **Reader** addresses.

> If your Core implementation **already exposes** inspectors `getNFTInspector` / `getSystemInspector`, use them directly.  
> If not (to keep Core small), deploy `CrazyOctagonReader` and call its `view` methods.

---

## Connect

```ts
import { ethers } from "ethers";
import CoreAbi from "./artifacts/CrazyOctagonCoreUUPS.json";
import ReaderAbi from "./artifacts/CrazyOctagonReader.json";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer   = await provider.getSigner();

const core   = new ethers.Contract(CORE_PROXY, CoreAbi.abi, signer);
const reader = new ethers.Contract(READER_ADDR, ReaderAbi.abi, provider);
```

## Inspectors for site

Use Reader methods to render all sections (Ping/Breed/Burn/Graveyard/LP):

```ts
const nft = await reader.getNFTSummary(tokenId);
const lp  = await reader.getLPInfo(tokenId);
const burn= await reader.getBurnInfo(tokenId);
const g   = await reader.getGlobalStats();
const q   = await reader.getBreedQuote();
const t   = await reader.getPingTiming();
const pz  = await reader.getPauseStatus();
const [ids,total,cursor,chunk] = await reader.viewGraveWindow(offset, limit);
```

`getNFTSummary`: owner/existence, activation, rarity/stars, bonuses, grave status, last ping/breed, locked OCTA.  
`getLPInfo`: helper/pair, lpAmount, amounts deposited.  
`getBurnInfo`: burn record with immediate split amounts.  
`getGlobalStats`: pools and sharePerPing/safety.  
`getBreedQuote`: costs and sponsorFee.  
`getPingTiming`: pingInterval, maxAccumulation, sweepInterval, monthDuration.  
`getPauseStatus`: reader pause/deadline info.  
`viewGraveWindow`: windowed listing of graveyard IDs for UI.

## User actions

### 1) Ping
```ts
await core.ping(tokenId);
```

### 2) Burn
Before calling `burnNFT`, the user must approve **OCTA fee**:
```ts
const feeBps = await core.burnFeeBps();
const locked  = (await reader.getNFTInspector(tokenId)).lockedOcta;
const fee = locked * feeBps / 10000;

await octa.approve(CORE_PROXY, fee);
await core.burnNFT(tokenId, 120); // wait preset: 30 / 120 / 480
```

User later claims:
```ts
await core.claimBurnRewards(tokenId);
```

### 3) Breed
- Approvals required: `OCTA` for `(octaCost + sponsorFee)` and `CRAA` for `craaCost`.
- Estimation:
```ts
const [octaCost, craaCost, lpFromOcta, octaToMain] = await core.getBreedCosts();
const sponsorBps = await core.sponsorBps();
const sponsorFee = (octaCost * sponsorBps) / 10000;

await octa.approve(CORE_PROXY, octaCost + sponsorFee);
if (craaCost > 0) await craa.approve(CORE_PROXY, craaCost);

await core.requestBreed(parent1Id, parent2Id, Math.floor(Math.random()*1e9));
```

### 4) Allowance helpers
Always re‑use existing allowance:
```ts
const need = amount;
const cur  = await octa.allowance(user, CORE_PROXY);
if (cur < need) await octa.approve(CORE_PROXY, need);
```

---

## LP Manager wiring (front does nothing)
LP add/remove is performed by Core calling LPManager. No UI action is required except showing stats (LP attached to revived NFTs is visible in `nftInfo`).


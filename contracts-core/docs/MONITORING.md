# Monitoring, analytics & indexers

Below are recommended monitors to run from an off‑chain service (cron) and/or The Graph indexer.

## Events to index
- `Pinged(tokenId, reward, newLocked)`
- `BurnScheduled(tokenId, owner, amount, claimAt, waitMin)`
- `BurnClaimed(tokenId, owner, player, pool, burned)`
- `BreedRequested(user, p1, p2, octaCost, craaCost, lpPart, octaToMain, sponsorFee)`
- `BreedFinalized(user, revived, bonusStars)`

> If you removed some events to keep Core tiny, keep at least the 5 above.

## Health checks (cron)
- `monthlyRewardPool` and `totalLockedForRewards` trending vs unlock percentage.
- `sharePerPing` non‑zero when `monthlyRewardPool>0`.
- `claimReservePool` enough for expected claims (alert when < X).
- `isGraveyardReady()` must return `true` periodically (if grave not empty).
- LP approvals (Core -> LPManager) should be zero **except** briefly during operations.

## Risk monitoring
- Admin changes (listen to on‑chain txs calling setters).
- `burnFeeBps`, `safetyBps`, `breedPercents`, `sponsorBps` bounds.
- Excess funds: run `reconcileBalances()` if extra OCTA is sent.

## Suggested dashboards
- Locked OCTA per NFT histogram
- Daily pings count & average reward
- Burn queue size / ready queue size
- Breed throughput & success/fail reasons

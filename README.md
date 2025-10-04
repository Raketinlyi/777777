# Upgrade (UUPS)

Core is UUPS‑upgradeable. Only `ADMIN_ROLE` can upgrade.

Two options are provided:
1. **Direct call:** `upgradeTo(newImplementation)` from the proxy (script included).
2. **OpenZeppelin upgrades plugin:** optional; we keep a minimal direct script here.

---

## Safety checklist

- New implementation must keep **storage layout** (append-only). Do **not** reorder or remove storage variables.
- Keep `function _authorizeUpgrade(address) internal onlyRole(ADMIN_ROLE)` in the new impl.
- Test on a fork: dry‑run `upgrade_core.js` + quick functional smoke (ping/burn/breed).

---

## Scripts

```bash
npx hardhat run scripts/upgrade_core.js --network mainnetLike   --impl 0xNewImplementationAddress
```

If you want the script to auto‑deploy the new impl and then upgrade in one shot, use `scripts/upgrade_core_deploy.js`.

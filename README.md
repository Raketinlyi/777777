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

---

## Frontend: централизованная смена контрактов и сети

См. docs/CONTRACT_SWITCHING_GUIDE.md — пошаговый план, как менять адреса и сеть в одном месте через `.env`, чтобы весь сайт автоматически подхватывал изменения без правок страниц/хуков.

Коротко:
1) Обновите адреса в .env: `NEXT_PUBLIC_CORE_PROXY`, `NEXT_PUBLIC_NFT_ADDRESS`, `NEXT_PUBLIC_READER_ADDRESS`
2) Перезапустите dev-сервер
3) Все хуки/страницы используют единый источник адресов (`lib/contracts.ts` → `config/chains.ts` → `.env`)

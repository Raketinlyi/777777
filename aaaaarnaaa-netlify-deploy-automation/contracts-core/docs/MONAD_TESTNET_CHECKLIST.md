# CrazyOctagon — Monad testnet checklist

Wallet (deployer): 0xeBFF65513DC3EDF6a1602dbbE3545e2344080362
Private key: <DO NOT STORE IN REPO>
IMPORTANT: The private key was shared in chat. Rotate (revoke) it and use a new one before deploying.

Addresses provided:
- NFT (ERC721): 0x4bcd4aff190d715fa7201cce2e69dd72c0549b07
- OCTA (ERC20): 0xB4832932D819361e0d250c338eBf87f0757ed800
- CRAA (ERC20): 0x7D7F4BDd43292f9E7Aae44707a7EEEB5655ca465
- Router V2?: 0x3a3eBAe0Eec80852FBC7B9E824C6756969cc8dc1
- pairToken (WMON): 0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701
- Pair WMON/OCTA (ref): 0xccB4322565fB6b468993CfaEEd29Ca1354272012
- NEW_LP_TOKEN (user-specified): 0xA4DdFDEb408e37199a3784584D174C670591cb42
- dead: 0x000000000000000000000000000000000000dEaD

Notes:
- Our current Reader assumes UniswapV2-compatible router (factory/getPair/addLiquidity/removeLiquidity).
- If router is UniswapV3-only (no factory()), our Reader won't work; we'd need a V3 helper.

## Quick validation (PowerShell)

1) Fill `.env` with MONAD_RPC and addresses above.
2) Check router type and LP token for OCTA/WMON:

```powershell
node scripts/check_router_monad.js --rpc $env:MONAD_RPC --router 0x3a3eBAe0Eec80852FBC7B9E824C6756969cc8dc1 --octa 0xB4832932D819361e0d250c338eBf87f0757ed800 --pair 0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701 --expectLP 0xA4DdFDEb408e37199a3784584D174C670591cb42
```

Expected outcomes:
- If "Router looks like UniswapV2-compatible" and `Factory.getPair` returns `0xA4Dd...` (matches `NEW_LP_TOKEN`) — we're good to proceed with current Reader.
- If NOT V2: we must either switch to a V2 router on Monad testnet or implement a V3-compatible helper.

## Deploy flow (Monad testnet)

- Deploy Core (UUPS): `npm run deploy:core:monad`
- Configure Core: `npx hardhat run scripts/set_config_base.js --network monadTestnet`
- Deploy Reader: `npm run deploy:reader:monad`
- Wire LP helper: `npx hardhat run scripts/set_lpmanager.js --network monadTestnet`
- Batch metadata: `node scripts/set_meta_batch.js --csv scripts/misc/sample_meta.csv --batch 120 --network monadTestnet`

Security tips:
- NEVER commit real private keys. Use .env only and keep it out of VCS. Rotate the provided private key immediately.

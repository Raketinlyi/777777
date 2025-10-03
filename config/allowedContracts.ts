import { monadChain } from './chains';

const dedupe = (addresses: Array<`0x${string}` | undefined>): `0x${string}`[] => {
  const set = new Set<`0x${string}`>();
  for (const address of addresses) {
    if (!address) continue;
    set.add(address.toLowerCase() as `0x${string}`);
  }
  return Array.from(set);
};

const RAW_ALLOWED = dedupe([
  monadChain.contracts.crazyCubeNFT.address,
  monadChain.contracts.crazyToken.address,
  monadChain.contracts.octaaToken?.address,
  monadChain.contracts.gameProxy.address,
  monadChain.contracts.reader?.address,
  monadChain.contracts.lpManager?.address,
  monadChain.contracts.pairToken?.address,
]);

export const ALLOWED_CONTRACTS = new Set<`0x${string}`>(RAW_ALLOWED);

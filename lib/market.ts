import axios from 'axios';
import { monadChain } from '@/config/chains';

const OCTAA_ADDR = monadChain.contracts.octaaToken.address.toLowerCase();
const WMON_ADDR = monadChain.contracts.pairToken.address.toLowerCase();
const COLLECTION_ADDR = monadChain.contracts.crazyCubeNFT.address.toLowerCase();

const NETWORK_SLUG =
  process.env.NEXT_PUBLIC_MONAD_NETWORK_SLUG || 'monad-testnet';
const MONAD_FLOOR_API = process.env.NEXT_PUBLIC_MONAD_FLOOR_API || '';
const DEFAULT_POOL = process.env.NEXT_PUBLIC_MONAD_GECKO_POOL || '';

const GECKO_BASE = 'https://api.geckoterminal.com/api/v2';
const GECKO_POOLS = [
  `${GECKO_BASE}/networks/${NETWORK_SLUG}/tokens/${OCTAA_ADDR}`,
  DEFAULT_POOL
    ? `${GECKO_BASE}/networks/${NETWORK_SLUG}/pools/${DEFAULT_POOL}`
    : '',
].filter(Boolean);

const DEX_SCREENER_URL = (addr: string) =>
  `https://api.dexscreener.com/latest/dex/tokens/${addr}`;

async function tryRequest<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function fetchFloorMon() {
  if (!MONAD_FLOOR_API) {
    return 0.2; // fallback floor price if no API configured
  }

  const config = {
    timeout: 15000,
    ...(process.env.MONAD_FLOOR_API_KEY && {
      headers: { 'x-api-key': String(process.env.MONAD_FLOOR_API_KEY) },
    }),
  } as const;

  const response = await tryRequest(() => axios.get(MONAD_FLOOR_API, config));
  if (!response?.data) return 0.2;

  const prices = Object.values(response.data.tokens || {})
    .map(Number)
    .filter(price => Number.isFinite(price) && price > 0);

  if (!prices.length) return 0.2;
  return Math.min(...prices);
}

export async function fetchOCTAAPriceUsd() {
  for (const url of GECKO_POOLS) {
    const response = await tryRequest(() => axios.get(url, { timeout: 8000 }));
    if (!response?.data) continue;
    const tokenPrice =
      response.data?.data?.attributes?.price_usd ??
      response.data?.data?.attributes?.token_price_usd ??
      response.data?.data?.[0]?.attributes?.token_price_usd;
    if (tokenPrice && !Number.isNaN(Number(tokenPrice))) {
      return Number(tokenPrice);
    }
  }

  const dsResponse = await tryRequest(() =>
    axios.get(DEX_SCREENER_URL(OCTAA_ADDR), { timeout: 15000 })
  );
  const price =
    dsResponse?.data?.pairs?.[0]?.priceUsd ??
    dsResponse?.data?.pairs?.[0]?.priceUSD;
  if (price && !Number.isNaN(Number(price))) {
    return Number(price);
  }

  return 0.0000006; // final fallback
}

export async function fetchTokenPriceUsd(addr: string) {
  const response = await tryRequest(() =>
    axios.get(DEX_SCREENER_URL(addr), { timeout: 15000 })
  );
  const price =
    response?.data?.pairs?.[0]?.priceUsd ??
    response?.data?.pairs?.[0]?.priceUSD;
  if (price && !Number.isNaN(Number(price))) {
    return Number(price);
  }

  if (addr.toLowerCase() === WMON_ADDR.toLowerCase()) {
    return 1; // default WMON ~ 1 USD on testnet
  }

  throw new Error('No price data');
}

export async function fetchMarketData() {
  try {
    const [floorMon, octaaUsd, monUsd] = await Promise.all([
      fetchFloorMon(),
      fetchOCTAAPriceUsd(),
      fetchTokenPriceUsd(WMON_ADDR),
    ]);

    const floorOctaa = octaaUsd > 0 ? (floorMon * monUsd) / octaaUsd : 0;
    const floorUsd = floorMon * monUsd;

    return {
      floorMon: Number(floorMon.toFixed(4)),
      octaaUsd: Number(octaaUsd.toFixed(10)),
      monUsd: Number(monUsd.toFixed(2)),
      floorOctaa: Number(floorOctaa.toFixed(0)),
      floorUsd: Number(floorUsd.toFixed(2)),
    };
  } catch {
    return {
      floorMon: 0.2,
      octaaUsd: 0.0000006,
      monUsd: 1,
      floorOctaa: 450,
      floorUsd: 0.2,
    };
  }
}

export const MARKET_CONSTANTS = {
  OCTAA_ADDR,
  WMON_ADDR,
  COLLECTION_ADDR,
  NETWORK_SLUG,
};

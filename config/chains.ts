import { defineChain } from 'viem';

const isHexAddress = (value?: string): value is `0x${string}` =>
  typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);

const pickAddress = (keys: string[], fallback: `0x${string}`): `0x${string}` => {
  for (const key of keys) {
    const value = process.env[key];
    if (isHexAddress(value)) {
      return value;
    }
  }
  return fallback;
};

const FALLBACK_ADDRESSES = {
  coreProxy: '0xb8Fee974031de01411656F908E13De4Ad9c74A9B' as `0x${string}`,
  nft: '0x4bcd4aff190d715fa7201cce2e69dd72c0549b07' as `0x${string}`,
  octa: '0xB4832932D819361e0d250c338eBf87f0757ed800' as `0x${string}`,
  octaa: '0x7D7F4BDd43292f9E7Aae44707a7EEEB5655ca465' as `0x${string}`,
  reader: '0xF9017a4701E1464690d6b71E2Fb3AF9c4c1acab1' as `0x${string}`,
  lpManager: '0xF9017a4701E1464690d6b71E2Fb3AF9c4c1acab1' as `0x${string}`,
  pairToken: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701' as `0x${string}`,
} as const;

const CORE_PROXY = pickAddress(
  [
    'NEXT_PUBLIC_CORE_PROXY',
    'NEXT_PUBLIC_GAME_PROXY',
    'NEXT_PUBLIC_CORE_PROXY_ADDRESS',
    'CORE_PROXY',
    'GAME_PROXY',
  ],
  FALLBACK_ADDRESSES.coreProxy
);

const NFT_COLLECTION = pickAddress(
  ['NEXT_PUBLIC_NFT_ADDRESS', 'NFT'],
  FALLBACK_ADDRESSES.nft
);

const OCTA_TOKEN = pickAddress(
  ['NEXT_PUBLIC_OCTA_ADDRESS', 'OCTA'],
  FALLBACK_ADDRESSES.octa
);

const OCTAA_TOKEN = pickAddress(
  ['NEXT_PUBLIC_OCTAA_ADDRESS', 'OCTAA'],
  FALLBACK_ADDRESSES.octaa
);

const READER_CONTRACT = pickAddress(
  ['NEXT_PUBLIC_READER_ADDRESS', 'READER', 'NEXT_PUBLIC_LP_HELPER'],
  FALLBACK_ADDRESSES.reader
);

const LP_MANAGER = pickAddress(
  ['NEXT_PUBLIC_LP_MANAGER', 'LP_MANAGER'],
  FALLBACK_ADDRESSES.lpManager
);

const PAIR_TOKEN = pickAddress(
  ['NEXT_PUBLIC_PAIR_TOKEN', 'PAIR_TOKEN'],
  FALLBACK_ADDRESSES.pairToken
);

const MONAD_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_MONAD_CHAIN_ID ||
    process.env.MONAD_CHAIN_ID ||
    '10143'
);

const MONAD_RPC =
  process.env.NEXT_PUBLIC_MONAD_RPC || process.env.MONAD_RPC || '';

// Multicall3 address (env override or default)
const MULTICALL3_ADDRESS = (process.env.NEXT_PUBLIC_MULTICALL3_ADDRESS as `0x${string}`) || '0xcA11bde05977b3631167028862bE2a173976CA11';

// Fallback RPC URLs for better reliability (env keys only, no hardcoded keys)
const FALLBACK_RPCS = [
  ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_1 ? [`https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_1}`] : []),
  ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_2 ? [`https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_2}`] : []),
  ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_3 ? [`https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_3}`] : []),
  ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_4 ? [`https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_4}`] : []),
  ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_5 ? [`https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_5}`] : []),
  'https://monad-testnet.rpc.thirdweb.com',
  'https://rpc.monad.xyz',
];

export const apeChain = defineChain({
  id: 33139, // Updated Chain ID for ApeChain mainnet 2025
  name: 'ApeChain',
  network: 'apechain',
  nativeCurrency: {
    decimals: 18,
    name: 'Craa',
    symbol: 'CRAA',
  },
  rpcUrls: {
    default: { http: ['https://rpc.apechain.com'] },
    public: { http: ['https://rpc.apechain.com'] },
  },
  contracts: {
    craaAdapter: {
      address: '0x5375423481F78eD616DeC656381AC496CA129E25', // Adapter contract address
      blockCreated: 0,
    },
    craaToken: {
      address: '0xBb526D657Cc1Ba772469A6EC96AcB2ed9D2A93e5', // Token contract address
      blockCreated: 0,
    },
    crazyCubeNFT: {
      address: '0x606a47707d5aEdaE9f616A6f1853fE3075bA740B', // NFT contract address
      blockCreated: 1234567,
    },
    gameProxy: {
      address: '0x7dFb75F1000039D650A4C2B8a068f53090e857dD', // Game proxy contract address
      blockCreated: 1234650,
    },
  },
});

export const monadChain = defineChain({
  id: MONAD_CHAIN_ID,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [
        // PRIORITY: Alchemy RPCs with API keys (high rate limit)
        ...FALLBACK_RPCS,
        // FALLBACK: Public RPCs (only if Alchemy fails)
        ...(MONAD_RPC ? [MONAD_RPC] : []),
        ...(process.env.RPC_URL ? [process.env.RPC_URL] : []),
      ],
    },
    public: {
      http: [
        // PRIORITY: Alchemy RPCs with API keys (high rate limit)
        ...FALLBACK_RPCS,
        // FALLBACK: Public RPCs (only if Alchemy fails)
        ...(MONAD_RPC ? [MONAD_RPC] : []),
        ...(process.env.RPC_URL ? [process.env.RPC_URL] : []),
      ],
    },
  },
  blockExplorers: {
    default: { name: 'MonadScan', url: 'https://explorer.monad.xyz' },
  },
  contracts: {
    multicall3: { address: MULTICALL3_ADDRESS, blockCreated: 0 },
    crazyCubeNFT: { address: NFT_COLLECTION, blockCreated: 0 },
    gameProxy: { address: CORE_PROXY, blockCreated: 0 },
    crazyToken: { address: OCTA_TOKEN, blockCreated: 0 },
    octaToken: { address: OCTA_TOKEN, blockCreated: 0 },
    octaaToken: { address: OCTAA_TOKEN, blockCreated: 0 },
    reader: { address: READER_CONTRACT, blockCreated: 0 },
    lpManager: { address: LP_MANAGER, blockCreated: 0 },
    pairToken: { address: PAIR_TOKEN, blockCreated: 0 },
  },
});

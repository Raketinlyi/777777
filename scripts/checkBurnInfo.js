const { createPublicClient, http } = require('viem');
const readerAbi = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getBurnInfo',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'claimAt', type: 'uint256' },
      { name: 'graveReleaseAt', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
      { name: 'waitMinutes', type: 'uint32' },
      { name: 'playerAmount', type: 'uint256' },
      { name: 'poolAmount', type: 'uint256' },
      { name: 'burnedAmount', type: 'uint256' },
    ],
  },
];

// Безопасное получение RPC URL из env переменных
const getAlchemyRpcUrl = () => {
  const apiKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  ALCHEMY_API_KEY not set, using public fallback RPC');
    return 'https://monad-testnet.rpc.caldera.xyz/http';
  }
  
  return `https://monad-testnet.g.alchemy.com/v2/${apiKey}`;
};

(async () => {
  const rpc = process.env.NEXT_PUBLIC_MONAD_RPC || process.env.MONAD_RPC || getAlchemyRpcUrl();
  const reader = process.env.NEXT_PUBLIC_READER_ADDRESS || '0xF9017a4701E1464690d6b71E2Fb3AF9c4c1acab1';
  const client = createPublicClient({ transport: http(rpc) });
  try {
    const res = await client.readContract({ address: reader, abi: readerAbi, functionName: 'getBurnInfo', args: [102n] });
    // res may contain BigInts; convert them to strings for logging
    const stringify = (v) => {
      if (typeof v === 'bigint') return v.toString();
      if (Array.isArray(v)) return v.map(stringify);
      if (v && typeof v === 'object') {
        const out = {};
        for (const k of Object.keys(v)) out[k] = stringify(v[k]);
        return out;
      }
      return v;
    };
    console.log(JSON.stringify(stringify(res), null, 2));
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : String(e));
    process.exit(1);
  }
})();

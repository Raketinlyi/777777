const { createPublicClient, http } = require('viem');
const readerAbi = require('../lib/abi/generated/crazyOctagonReaderAbi.json');

(async () => {
  const rpc = process.env.NEXT_PUBLIC_MONAD_RPC || process.env.MONAD_RPC || 'https://monad-testnet.g.alchemy.com/v2/XgKXPDCwM8SYsWDPk1yCs';
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

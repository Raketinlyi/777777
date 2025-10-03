import { createPublicClient, http, isAddressEqual, parseAbiItem } from 'viem';

// Конфигурация (как в хуке)
const RPC_URL = 'https://monad-testnet.g.alchemy.com/v2/XgKXPDCwM8SYsWDPk1yCs';
const READER_ADDRESS = '0xF9017a4701E1464690d6b71E2Fb3AF9c4c1acab1';
const CORE_ADDRESS = '0xb8Fee974031de01411656F908E13De4Ad9c74A9B'; // из .env

const READER_ABI = [
  {
    "inputs": [{"type": "uint256"}, {"type": "uint256"}],
    "name": "viewGraveWindow",
    "outputs": [
      {"type": "uint256[]", "name": "ids"},
      {"type": "uint256", "name": "total"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256"}],
    "name": "getBurnInfo",
    "outputs": [
      {"type": "address", "name": "owner"},
      {"type": "uint256", "name": "totalAmount"},
      {"type": "uint256", "name": "claimAt"},
      {"type": "uint256", "name": "waitMin"},
      {"type": "bool", "name": "claimed"},
      {"type": "uint256", "name": "burnedAt"},
      {"type": "uint256", "name": "playerAmount"},
      {"type": "uint256", "name": "poolAmount"},
      {"type": "uint256", "name": "burnedAmount"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CORE_BURN_EVENT = parseAbiItem(
  'event BurnScheduled(uint256 indexed tokenId, address indexed owner, uint256 amount, uint256 claimAt, uint32 waitMin)'
);

async function debugHook(userAddress) {
  console.log('🔍 DEBUG: Проверяем почему хук не работает');
  console.log('👤 Адрес:', userAddress);
  console.log('📖 Reader:', READER_ADDRESS);
  console.log('🎮 Core:', CORE_ADDRESS);
  console.log('');

  const client = createPublicClient({
    transport: http(RPC_URL),
    chain: {
      id: 10143,
      name: 'Monad Testnet',
      network: 'monad-testnet',
      nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
      rpcUrls: { default: { http: [RPC_URL] } }
    }
  });

  // 1. Проверяем Alchemy логи (как в хуке)
  console.log('🔍 1. Проверяем Alchemy логи...');
  try {
    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock > 100000n ? currentBlock - 100000n : 0n;
    
    console.log(`📊 Текущий блок: ${currentBlock}`);
    console.log(`📊 Ищем с блока: ${fromBlock}`);

    const logs = await client.getLogs({
      address: CORE_ADDRESS,
      event: CORE_BURN_EVENT,
      args: { owner: userAddress },
      fromBlock,
      toBlock: 'latest',
    });

    console.log(`📋 Найдено логов: ${logs.length}`);
    
    if (logs.length > 0) {
      logs.forEach((log, i) => {
        console.log(`  Log ${i + 1}:`);
        console.log(`    TokenId: ${log.args.tokenId}`);
        console.log(`    Amount: ${log.args.amount}`);
        console.log(`    ClaimAt: ${log.args.claimAt}`);
        console.log(`    Block: ${log.blockNumber}`);
      });
    } else {
      console.log('❌ Логи не найдены!');
    }
  } catch (error) {
    console.log('❌ Ошибка при поиске логов:', error.message);
  }

  console.log('');

  // 2. Проверяем Reader (как в хуке)
  console.log('🔍 2. Проверяем Reader...');
  try {
    const header = await client.readContract({
      address: READER_ADDRESS,
      abi: READER_ABI,
      functionName: 'viewGraveWindow',
      args: [0n, 0n]
    });

    const totalRecords = Number(header[1]);
    console.log(`📊 Всего записей: ${totalRecords}`);

    if (totalRecords > 0) {
      // Берём последние записи (как в хуке)
      const MAX_IDS = 1000;
      const PAGE_SIZE = 100;
      const max = Math.min(totalRecords, MAX_IDS);
      let start = Math.max(totalRecords - max, 0);
      
      console.log(`📊 Проверяем с ${start} по ${totalRecords - 1}`);

      const take = Math.min(PAGE_SIZE, totalRecords - start);
      const window = await client.readContract({
        address: READER_ADDRESS,
        abi: READER_ABI,
        functionName: 'viewGraveWindow',
        args: [BigInt(start), BigInt(take)]
      });

      const ids = window[0];
      console.log(`📋 IDs: ${ids.map(id => id.toString())}`);

      for (const id of ids) {
        const info = await client.readContract({
          address: READER_ADDRESS,
          abi: READER_ABI,
          functionName: 'getBurnInfo',
          args: [id]
        });

        const [owner, totalAmount, claimAt, waitMin, claimed] = info;
        
        console.log(`  NFT #${id}:`);
        console.log(`    Owner: ${owner}`);
        console.log(`    User: ${userAddress}`);
        console.log(`    Match: ${isAddressEqual(owner, userAddress)}`);
        console.log(`    Claimed: ${claimed}`);
        console.log(`    Amount: ${totalAmount.toString()}`);
      }
    }
  } catch (error) {
    console.log('❌ Ошибка Reader:', error.message);
  }

  console.log('');

  // 3. Проверяем переменные окружения
  console.log('🔍 3. Проверяем конфигурацию...');
  console.log(`NEXT_PUBLIC_ALCHEMY_RPC: ${process.env.NEXT_PUBLIC_ALCHEMY_RPC || 'НЕТ'}`);
  console.log(`NEXT_PUBLIC_READER_ADDRESS: ${process.env.NEXT_PUBLIC_READER_ADDRESS || 'НЕТ'}`);
  console.log(`NEXT_PUBLIC_CORE_PROXY: ${process.env.NEXT_PUBLIC_CORE_PROXY || 'НЕТ'}`);
  console.log(`NEXT_PUBLIC_GAME_PROXY: ${process.env.NEXT_PUBLIC_GAME_PROXY || 'НЕТ'}`);
}

const userAddress = process.argv[2];
if (!userAddress) {
  console.log('❌ Укажите адрес: node scripts/debug-hook.js 0xAddress');
  process.exit(1);
}

debugHook(userAddress);
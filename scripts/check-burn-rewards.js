import { createPublicClient, http, isAddressEqual } from 'viem';

// Конфигурация
const RPC_URL = process.env.MONAD_RPC || 'https://monad-testnet.g.alchemy.com/v2/XgKXPDCwM8SYsWDPk1yCs';
const READER_ADDRESS = '0xF9017a4701E1464690d6b71E2Fb3AF9c4c1acab1';

// ABI для Reader контракта
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

async function checkBurnRewards(userAddress) {
  console.log('🔍 Проверяем burn-награды для:', userAddress);
  console.log('📡 RPC:', RPC_URL);
  console.log('📖 Reader:', READER_ADDRESS);
  console.log('');

  try {
    // Создаем клиент
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

    console.log('✅ Клиент создан');

    // Получаем общее количество записей в graveyard
    const header = await client.readContract({
      address: READER_ADDRESS,
      abi: READER_ABI,
      functionName: 'viewGraveWindow',
      args: [0n, 0n]
    });

    const totalRecords = Number(header[1]);
    console.log(`📊 Всего записей в graveyard: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('❌ Graveyard пустой');
      return;
    }

    // Проверяем последние 100 записей
    const checkCount = Math.min(100, totalRecords);
    const startIndex = Math.max(0, totalRecords - checkCount);
    
    console.log(`🔎 Проверяем записи с ${startIndex} по ${startIndex + checkCount - 1}`);

    const window = await client.readContract({
      address: READER_ADDRESS,
      abi: READER_ABI,
      functionName: 'viewGraveWindow',
      args: [BigInt(startIndex), BigInt(checkCount)]
    });

    const ids = window[0];
    console.log(`📋 Найдено ${ids.length} NFT ID:`, ids.map(id => id.toString()));

    let userRewards = [];
    const now = Math.floor(Date.now() / 1000);

    // Проверяем каждый NFT
    for (let i = 0; i < ids.length; i++) {
      const tokenId = ids[i];
      console.log(`\n🔍 Проверяем NFT #${tokenId}...`);

      try {
        const burnInfo = await client.readContract({
          address: READER_ADDRESS,
          abi: READER_ABI,
          functionName: 'getBurnInfo',
          args: [tokenId]
        });

        const [owner, totalAmount, claimAt, waitMin, claimed, burnedAt, playerAmount, poolAmount, burnedAmount] = burnInfo;

        console.log(`  👤 Владелец: ${owner}`);
        console.log(`  💰 Общая сумма: ${totalAmount.toString()}`);
        console.log(`  ⏰ Можно забрать: ${new Date(Number(claimAt) * 1000).toLocaleString()}`);
        console.log(`  ✅ Уже забрано: ${claimed}`);

        // Проверяем принадлежность пользователю
        if (isAddressEqual(owner, userAddress)) {
          console.log(`  🎯 ПРИНАДЛЕЖИТ ПОЛЬЗОВАТЕЛЮ!`);
          
          if (!claimed) {
            const isClaimable = now >= Number(claimAt);
            console.log(`  🎁 Можно забрать сейчас: ${isClaimable}`);
            
            userRewards.push({
              tokenId: tokenId.toString(),
              totalAmount: totalAmount.toString(),
              playerAmount: playerAmount.toString(),
              poolAmount: poolAmount.toString(),
              burnedAmount: burnedAmount.toString(),
              claimAt: Number(claimAt),
              isClaimable,
              claimed
            });
          } else {
            console.log(`  ❌ Уже забрано`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Ошибка при проверке NFT #${tokenId}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎯 РЕЗУЛЬТАТ для ${userAddress}:`);
    console.log(`📊 Найдено наград: ${userRewards.length}`);

    if (userRewards.length > 0) {
      userRewards.forEach((reward, index) => {
        console.log(`\n🎁 Награда #${index + 1}:`);
        console.log(`  🆔 NFT ID: ${reward.tokenId}`);
        console.log(`  💰 Игроку: ${(BigInt(reward.playerAmount) / BigInt(10**18)).toString()} OCTA`);
        console.log(`  🏊 В пул: ${(BigInt(reward.poolAmount) / BigInt(10**18)).toString()} OCTA`);
        console.log(`  🔥 Сожжено: ${(BigInt(reward.burnedAmount) / BigInt(10**18)).toString()} OCTA`);
        console.log(`  ⏰ Доступно: ${reward.isClaimable ? '✅ СЕЙЧАС' : '❌ ' + new Date(reward.claimAt * 1000).toLocaleString()}`);
      });
    } else {
      console.log('❌ Наград не найдено');
    }

  } catch (error) {
    console.error('💥 Ошибка:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Запуск скрипта
const userAddress = process.argv[2];
if (!userAddress) {
  console.log('❌ Укажите адрес кошелька:');
  console.log('node scripts/check-burn-rewards.js 0xYourAddress');
  process.exit(1);
}

checkBurnRewards(userAddress);
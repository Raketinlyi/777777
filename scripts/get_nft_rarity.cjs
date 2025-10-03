const { createPublicClient, http } = require('viem');
const fs = require('fs');
const path = require('path');

// Читаем ABI файл
const abiPath = path.resolve(__dirname, '../lib/abi/generated/crazyOctagonCoreAbi.json');
console.log('Loading ABI from:', abiPath);

const crazyOctagonCoreAbi = require(abiPath);

const CORE_PROXY_ADDRESS = '0xb8Fee974031de01411656F908E13De4Ad9c74A9B';
const NFT_ID = 93n; // Use BigInt for tokenId

// Создаем клиент для Monad Testnet
const publicClient = createPublicClient({
  chain: {
    id: 10143,
    name: 'Monad Testnet',
    network: 'monad-testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Monad',
      symbol: 'MON',
    },
    rpcUrls: {
      default: {
        http: ['https://monad-testnet.g.alchemy.com/v2/XgKXPDCwM8SYsWDPk1yCs'],
      },
      public: {
        http: ['https://monad-testnet.g.alchemy.com/v2/XgKXPDCwM8SYsWDPk1yCs'],
      },
    },
  },
  transport: http('https://monad-testnet.g.alchemy.com/v2/XgKXPDCwM8SYsWDPk1yCs'),
});

async function main() {
    console.log(`Запрашиваю полную информацию для NFT ID ${NFT_ID}...`);
    
    try {
        // Получаем заводскую редкость
        const metaResult = await publicClient.readContract({
            address: CORE_PROXY_ADDRESS,
            abi: crazyOctagonCoreAbi,
            functionName: 'meta',
            args: [NFT_ID]
        });
        
        // Получаем текущее состояние
        const stateResult = await publicClient.readContract({
            address: CORE_PROXY_ADDRESS,
            abi: crazyOctagonCoreAbi,
            functionName: 'state',
            args: [NFT_ID]
        });
        
        const [rarity, initialStars, gender, isActivated] = metaResult;
        const [lastPingTime, lastBreedTime, currentStars, bonusStars, isInGraveyard, lockedOcta] = stateResult;
        
        console.log('\n=== ПОЛНАЯ ИНФОРМАЦИЯ ДЛЯ NFT ID', NFT_ID, '===');
        
        console.log('\n🏭 ЗАВОДСКИЕ ХАРАКТЕРИСТИКИ:');
        console.log('Редкость:', rarity);
        console.log('Начальные звезды:', initialStars);
        console.log('Пол:', gender === 1 ? 'Мужской' : 'Женский');
        console.log('Активирован:', isActivated ? 'Да' : 'Нет');
        
        console.log('\n⭐ ТЕКУЩЕЕ СОСТОЯНИЕ:');
        console.log('Текущие звезды:', currentStars);
        console.log('Бонусные звезды:', bonusStars);
        console.log('Общие звезды:', Number(currentStars) + Number(bonusStars));
        console.log('В кладбище:', isInGraveyard ? 'Да' : 'Нет');
        console.log('Заблокировано OCTA:', lockedOcta.toString());
        
        // Определяем название редкости
        const rarityNames = {
            1: 'Обычная',
            2: 'Необычная', 
            3: 'Редкая',
            4: 'Эпическая',
            5: 'Легендарная',
            6: 'Мифическая'
        };
        
        console.log('\n📊 АНАЛИЗ:');
        console.log('Название редкости:', rarityNames[rarity] || 'Неизвестная');
        
        // Проверяем, есть ли бонус от родов
        if (Number(bonusStars) > 0) {
            console.log('🎉 БОНУС ОТ РОДОВ: +' + bonusStars + ' звезд!');
        }
        
        // Проверяем изменения в звездах
        const starDiff = Number(currentStars) - Number(initialStars);
        if (starDiff !== 0) {
            console.log('📈 Изменение звезд:', starDiff > 0 ? '+' + starDiff : starDiff);
        }
        
        // Временные метки
        if (Number(lastPingTime) > 0) {
            const pingDate = new Date(Number(lastPingTime) * 1000);
            console.log('🏓 Последний пинг:', pingDate.toLocaleString('ru-RU'));
        }
        
        if (Number(lastBreedTime) > 0) {
            const breedDate = new Date(Number(lastBreedTime) * 1000);
            console.log('👶 Последние роды:', breedDate.toLocaleString('ru-RU'));
        }
        
    } catch (error) {
        console.error('Ошибка при получении данных NFT:', error);
    }
}

main();

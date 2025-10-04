const { createPublicClient, http } = require('viem');
const { MONAD_TESTNET_CONFIG, CONTRACTS } = require('./config.cjs');

// Минимальный набор ABI, необходимый для чтения meta/state
const crazyOctagonCoreAbi = [
    {
        type: 'function',
        stateMutability: 'view',
        name: 'meta',
        inputs: [
            { name: '', type: 'uint256' },
        ],
        outputs: [
            { name: 'rarity', type: 'uint8' },
            { name: 'initialStars', type: 'uint8' },
            { name: 'gender', type: 'uint8' },
            { name: 'isActivated', type: 'bool' },
        ],
    },
    {
        type: 'function',
        stateMutability: 'view',
        name: 'state',
        inputs: [
            { name: '', type: 'uint256' },
        ],
        outputs: [
            { name: 'lastPingTime', type: 'uint48' },
            { name: 'lastBreedTime', type: 'uint48' },
            { name: 'currentStars', type: 'uint8' },
            { name: 'bonusStars', type: 'uint8' },
            { name: 'isInGraveyard', type: 'bool' },
            { name: 'lockedOcta', type: 'uint256' },
        ],
    },
];

const CORE_PROXY_ADDRESS = CONTRACTS.CORE_PROXY;
const NFT_ID = 93n; // Use BigInt for tokenId

// Создаем клиент для Monad Testnet
const publicClient = createPublicClient({
  chain: MONAD_TESTNET_CONFIG,
  transport: http(MONAD_TESTNET_CONFIG.rpcUrls.default.http[0]),
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

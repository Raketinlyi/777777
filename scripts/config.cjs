/**
 * Общая конфигурация для скриптов
 * Использует переменные окружения вместо hardcoded значений
 */

require('dotenv').config(); // Загружаем .env файл

// Получаем RPC URL из переменных окружения
const getAlchemyRpcUrl = () => {
  const apiKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  ALCHEMY_API_KEY not found in .env');
    console.warn('⚠️  Using fallback public RPC (может быть медленнее)');
    return 'https://monad-testnet.rpc.caldera.xyz/http';
  }
  
  return `https://monad-testnet.g.alchemy.com/v2/${apiKey}`;
};

// Monad Testnet конфигурация
const MONAD_TESTNET_CONFIG = {
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
      http: [getAlchemyRpcUrl()],
    },
    public: {
      http: ['https://monad-testnet.rpc.caldera.xyz/http'],
    },
  },
};

// Contract addresses
const CONTRACTS = {
  CORE_PROXY: process.env.NEXT_PUBLIC_CRAZY_OCTAGON_CORE_PROXY || '0xb8Fee974031de01411656F908E13De4Ad9c74A9B',
  NFT: process.env.NEXT_PUBLIC_CRAZY_OCTAGON_NFT || '0x5C5b4bF1b1485d8fb01b1f9bc09F90Cd2fF1f1fF',
  COIN: process.env.NEXT_PUBLIC_CRAZY_COIN || '0x7C7b4F1b1485d8fb01b1f9bc09F90Cd2fF1f1fF',
  DUST: process.env.NEXT_PUBLIC_CRAZY_DUST || '0x8C8b4F1b1485d8fb01b1f9bc09F90Cd2fF1f1fF',
};

module.exports = {
  MONAD_TESTNET_CONFIG,
  CONTRACTS,
  getAlchemyRpcUrl,
};

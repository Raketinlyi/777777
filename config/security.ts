import { monadChain } from './chains';

// Security configuration for dApp (Monad Testnet)
export const SECURITY_CONFIG = {
  // Expected chain ID (Monad Testnet)
  EXPECTED_CHAIN_ID: monadChain.id,

  // Contract addresses (from chains.ts)
  CONTRACTS: {
    GAME_CONTRACT: monadChain.contracts.gameProxy.address,
    // было: crazyToken, теперь корректно используем octaaToken из chains
  OCTAA_TOKEN: monadChain.contracts.octaaToken.address,
    // добавляем OCTA токен для валидаций где нужно
    OCTA_TOKEN: monadChain.contracts.octaToken.address,
    NFT_CONTRACT: monadChain.contracts.crazyCubeNFT.address,
  },

  // RPC endpoints (primary comes from env via chains.ts)
  RPC_ENDPOINTS: {
    MONAD: monadChain.rpcUrls.default.http[0] || '',
    ALTERNATIVE: monadChain.rpcUrls.public.http[0] || '',
  },

  // Security limits
  LIMITS: {
    MAX_APPROVE_AMOUNT: '1000000000000000000000000', // 1M OCTAA
    MAX_GAS_LIMIT: 500000,
    MAX_GAS_PRICE: '20000000000', // 20 gwei
  },

  // Rate limiting
  RATE_LIMITS: {
    BURN_PER_HOUR: 10,
    APPROVE_PER_HOUR: 5,
    PING_PER_HOUR: 20,
  },
};

// Validation functions
export const validateChainId = (chainId: number): boolean => {
  return chainId === SECURITY_CONFIG.EXPECTED_CHAIN_ID;
};

export const validateContractAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const validateAmount = (amount: string): boolean => {
  try {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= parseFloat(SECURITY_CONFIG.LIMITS.MAX_APPROVE_AMOUNT);
  } catch {
    return false;
  }
};

export const validateGasPrice = (gasPrice: string): boolean => {
  try {
    const price = parseFloat(gasPrice);
    const maxPrice = parseFloat(SECURITY_CONFIG.LIMITS.MAX_GAS_PRICE);
    return !isNaN(price) && price > 0 && price <= maxPrice;
  } catch {
    return false;
  }
};
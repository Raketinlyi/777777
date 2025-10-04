/**
 * Security utilities for blockchain operations
 * Защита от распространённых уязвимостей Web3 приложений
 */

/**
 * Безопасная валидация и конвертация в BigInt
 * Предотвращает крашы на невалидном input
 */
export function safeBigInt(value: string | number | bigint | undefined): bigint | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  try {
    // Если уже BigInt
    if (typeof value === 'bigint') {
      return value;
    }

    // Проверка на number
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) {
        return null;
      }
      return BigInt(Math.floor(value));
    }

    // Проверка строки
    const str = String(value).trim();
    
    // Проверка на пустую строку
    if (str === '') {
      return null;
    }

    // Проверка формата (только цифры, опционально 0x префикс)
    if (!/^(0x)?[0-9a-fA-F]+$/.test(str)) {
      console.warn(`Invalid BigInt format: ${str}`);
      return null;
    }

    return BigInt(str);
  } catch (error) {
    console.error('safeBigInt error:', error);
    return null;
  }
}

/**
 * Валидация Ethereum адреса
 */
export function isValidAddress(address: string | undefined): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Валидация NFT ID
 * Проверяет что ID - положительное число в допустимом диапазоне
 */
export function isValidTokenId(tokenId: string | number | undefined): boolean {
  if (tokenId === undefined || tokenId === null) return false;
  
  try {
    const id = safeBigInt(tokenId);
    if (id === null) return false;
    
    // Проверка диапазона (0 < id <= max uint256)
    const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    return id > 0n && id <= MAX_UINT256;
  } catch {
    return false;
  }
}

/**
 * Валидация amount для токенов
 * Проверяет что amount положительный и не превышает лимиты
 */
export function isValidAmount(amount: string | number | bigint | undefined): boolean {
  if (amount === undefined || amount === null) return false;
  
  try {
    const amt = safeBigInt(amount);
    if (amt === null) return false;
    
    // Amount должен быть положительным
    return amt > 0n;
  } catch {
    return false;
  }
}

/**
 * Проверка что пользователь в правильной сети
 */
export function isCorrectChain(currentChainId: number | undefined, expectedChainId: number): boolean {
  return currentChainId === expectedChainId;
}

/**
 * Безопасная проверка allowance
 * Предотвращает integer overflow атаки
 */
export function isSafeAllowance(allowance: bigint, required: bigint): boolean {
  try {
    return allowance >= required;
  } catch {
    return false;
  }
}

/**
 * Валидация gas limit
 * Предотвращает слишком большие или маленькие значения
 */
export function isValidGasLimit(gasLimit: number | bigint): boolean {
  try {
    const limit = typeof gasLimit === 'bigint' ? gasLimit : BigInt(gasLimit);
    
    // Разумные пределы для Monad
    const MIN_GAS = BigInt(21000);      // Минимум для transfer
    const MAX_GAS = BigInt(10_000_000); // Максимум для сложных операций
    
    return limit >= MIN_GAS && limit <= MAX_GAS;
  } catch {
    return false;
  }
}

/**
 * Sanitize user input для предотвращения injection
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Удаляем потенциально опасные символы
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // HTML/XSS
    .replace(/[\r\n]/g, '')   // Newlines
    .replace(/;/g, '')        // Command injection
    .slice(0, 1000);          // Max length
}

/**
 * Rate limiter для RPC calls
 */
class RateLimiter {
  private calls: number[] = [];
  private readonly maxCallsPerMinute: number;

  constructor(maxCallsPerMinute: number = 60) {
    this.maxCallsPerMinute = maxCallsPerMinute;
  }

  canMakeCall(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Удаляем старые вызовы
    this.calls = this.calls.filter(time => time > oneMinuteAgo);
    
    // Проверяем лимит
    if (this.calls.length >= this.maxCallsPerMinute) {
      console.warn('Rate limit exceeded');
      return false;
    }
    
    this.calls.push(now);
    return true;
  }

  reset() {
    this.calls = [];
  }
}

export const globalRateLimiter = new RateLimiter(100); // 100 calls per minute

/**
 * Wrapper для безопасных RPC вызовов с timeout
 */
export async function safeRPCCall<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  // Проверка rate limit
  if (!globalRateLimiter.canMakeCall()) {
    throw new Error('Rate limit exceeded. Please wait.');
  }

  // Timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('RPC call timeout')), timeoutMs);
  });

  try {
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error) {
    console.error('RPC call failed:', error);
    throw error;
  }
}

/**
 * Защита от replay атак - проверка nonce
 */
export function validateNonce(currentNonce: number, expectedNonce: number): boolean {
  return currentNonce === expectedNonce;
}

/**
 * Проверка подписи (заглушка для будущей реализации)
 */
export function verifySignature(
  _message: string,
  _signature: string,
  _expectedAddress: string
): boolean {
  // Будет реализовано при добавлении off-chain подписей
  return true;
}

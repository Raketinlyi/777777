'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { monadChain } from '@/config/chains';

export function useMonadGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const pathname = usePathname();

  const isMonadChain = chainId === monadChain.id;
  const isBridgePage = pathname === '/bridge';

  // Auto-switch to Monad Testnet when wallet connects (except on bridge page)
  useEffect(() => {
    if (isConnected && !isMonadChain && !isBridgePage) {
      // Small delay for stability
      const timer = setTimeout(() => {
        switchToMonadChain();
      }, 1500);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isConnected, isMonadChain, isBridgePage]);

  // Try to switch to Monad Testnet
  const switchToMonadChain = async () => {
    if (!switchChain) {
      toast({
        title: 'Переключить сеть',
        description: 'Пожалуйста, переключитесь на Monad Testnet в кошельке!',
        variant: 'destructive',
      });
      return;
    }

    try {
      await switchChain({ chainId: monadChain.id });
      toast({
        title: 'Сеть переключена',
        description: 'Успешно подключились к Monad Testnet!',
        variant: 'default',
      });
    } catch (e: any) {
      // If user declined the switch, show instruction
      if (e.code === 4001) {
        toast({
          title: 'Требуется переключение сети',
          description: 'Пожалуйста, вручную переключитесь на Monad Testnet в кошельке!',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Ошибка переключения',
          description: 'Не удалось переключиться на Monad Testnet. Попробуйте вручную.',
          variant: 'destructive',
        });
      }
    }
  };

  // Force switch with retry attempts
  const forceSwitchToMonadChain = async (maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await switchToMonadChain();
        if (isMonadChain) break;
      } catch (e) {
        if (i === maxRetries - 1) {
          toast({
            title: 'Переключение не удалось',
            description: 'Пожалуйста, вручную переключитесь на Monad Testnet в кошельке!',
            variant: 'destructive',
          });
        }
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  // Wrapper for actions that require Monad Testnet
  const requireMonadChain =
    <T extends any[]>(action: (...args: T) => Promise<any> | void) =>
    async (...args: T) => {
      if (!isMonadChain) {
        toast({
          title: 'Неправильная сеть',
          description: 'Переключаемся на Monad Testnet...',
          variant: 'default',
        });
        await forceSwitchToMonadChain();
        return;
      }
      return action(...args);
    };

  return {
    isMonadChain,
    requireMonadChain,
    switchToMonadChain,
    forceSwitchToMonadChain,
  };
}
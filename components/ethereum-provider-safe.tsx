'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

interface EthereumProviderSafeProps {
  children: React.ReactNode;
}

export function EthereumProviderSafe({ children }: EthereumProviderSafeProps) {
  const [walletStatus, setWalletStatus] = useState<
    'checking' | 'ready' | 'conflict' | 'error'
  >('checking');
  const [walletInfo, setWalletInfo] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const { isMobile, isTelegram } = useMobile();

  useEffect(() => {
    const checkEthereumProvider = () => {
      try {
        // Check if we're in a mobile browser that typically doesn't have wallet extensions
        const isMobileBrowser = isMobile || isTelegram;
        const isGoogleChrome =
          typeof window !== 'undefined' &&
          /Chrome/.test(navigator.userAgent) &&
          /Google Inc/.test(navigator.vendor);
        const isYandexBrowser =
          typeof window !== 'undefined' &&
          /YaBrowser/.test(navigator.userAgent);
        const isTelegramBrowser =
          typeof window !== 'undefined' && /Telegram/.test(navigator.userAgent);

        // Check if window.ethereum exists
        if (typeof window !== 'undefined' && window.ethereum) {
          // Check for multiple providers
          const providers = [];

          if (window.ethereum.isMetaMask) {
            providers.push('MetaMask');
          }
          if (window.ethereum.isWalletConnect) {
            providers.push('WalletConnect');
          }
          if (window.ethereum.isCoinbaseWallet) {
            providers.push('Coinbase Wallet');
          }
          if (window.ethereum.isRainbow) {
            providers.push('Rainbow');
          }
          if (window.ethereum.isTrust) {
            providers.push('Trust Wallet');
          }

          if (providers.length === 0) {
            providers.push('Unknown Provider');
          }

          if (providers.length > 1) {
            setWalletStatus('conflict');
            setWalletInfo(
              `Multiple wallets detected: ${providers.join(', ')}. This may cause conflicts.`
            );
            // Only show conflicts on desktop, not on mobile
            setShowAlert(!isMobileBrowser);
          } else {
            setWalletStatus('ready');
            setWalletInfo(`Wallet ready: ${providers[0]}`);
            setShowAlert(false); // Hide alert for normal operation
          }
        } else {
          setWalletStatus('error');
          setWalletInfo(
            'No Ethereum provider detected. Please install a wallet extension.'
          );
          // Hide "No Ethereum provider" message on mobile browsers, Google, Yandex, and Telegram
          const shouldHideOnMobile =
            isMobileBrowser ||
            isGoogleChrome ||
            isYandexBrowser ||
            isTelegramBrowser;
          setShowAlert(!shouldHideOnMobile); // Only show on desktop browsers
        }
      } catch (error) {
        setWalletStatus('error');
        setWalletInfo(
          `Error checking wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        // Hide error messages on mobile browsers too
        const isMobileBrowser = isMobile || isTelegram;
        setShowAlert(!isMobileBrowser);
      }
    };

    // Check immediately
    checkEthereumProvider();

    // Listen for wallet changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = () => {
        checkEthereumProvider();
      };

      const handleChainChanged = () => {
        checkEthereumProvider();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener(
            'accountsChanged',
            handleAccountsChanged
          );
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }

    // Return empty cleanup function if no listeners were set up
    return () => {};
  }, [isMobile, isTelegram]);

  const getStatusIcon = () => {
    switch (walletStatus) {
      case 'ready':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'conflict':
        return <AlertTriangle className='h-4 w-4 text-yellow-600' />;
      case 'error':
        return <AlertTriangle className='h-4 w-4 text-red-600' />;
      default:
        return <Wallet className='h-4 w-4 text-blue-600' />;
    }
  };

  const getStatusColor = () => {
    switch (walletStatus) {
      case 'ready':
        return 'border-green-200 bg-green-50';
      case 'conflict':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (walletStatus === 'checking') {
    return <>{children}</>;
  }

  return (
    <div className='space-y-4 ethereum-provider-safe'>
      {/* Wallet Status Alert - Only show for conflicts or errors, and hide on mobile */}
      {showAlert && !isMobile && !isTelegram && (
        <Alert
          className={`${getStatusColor()} ethereum-provider-alert hidden md:block`}
          role='alert'
        >
          {getStatusIcon()}
          <AlertDescription className='flex items-center justify-between'>
            <span>{walletInfo}</span>
            {walletStatus === 'conflict' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.location.reload()}
                className='ml-2'
              >
                Refresh Page
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
}

// Hook for safe Ethereum provider access
export function useEthereumProvider() {
  const [provider, setProvider] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initProvider = () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          setProvider(window.ethereum);
          setIsReady(true);
        }
      } catch (error) {
        setIsReady(false);
      }
    };

    initProvider();

    // Listen for provider changes
    if (typeof window !== 'undefined') {
      const handleProviderChange = () => {
        initProvider();
      };

      window.addEventListener('ethereum#initialized', handleProviderChange);
      window.addEventListener('ethereum#accountsChanged', handleProviderChange);
      window.addEventListener('ethereum#chainChanged', handleProviderChange);

      return () => {
        window.removeEventListener(
          'ethereum#initialized',
          handleProviderChange
        );
        window.removeEventListener(
          'ethereum#accountsChanged',
          handleProviderChange
        );
        window.removeEventListener(
          'ethereum#chainChanged',
          handleProviderChange
        );
      };
    }

    // Return empty cleanup function if no listeners were set up
    return () => {};
  }, []);

  return { provider, isReady };
}

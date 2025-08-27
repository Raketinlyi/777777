'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { useMobile } from '@/hooks/use-mobile';

import dynamic from 'next/dynamic';
import { TabNavigation } from '@/components/tab-navigation';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';

const CoinsAnimation = dynamic(
  () => import('@/components/coins-animation').then(m => m.CoinsAnimation),
  { ssr: false }
);

export default function ClaimPage() {
  const { isConnected: connected, address: account } = useAccount();
  const balance = '0';
  const { isMobile } = useMobile();
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();

  // State for wallet validation
  const [isValidating, setIsValidating] = useState(false);
  const [isValidWallet, setIsValidWallet] = useState(true);
  const [hasClaimableRewards, setHasClaimableRewards] = useState(false);

  // Validate wallet when connected
  useEffect(() => {
    if (connected && account) {
      const validateWallet = async () => {
        setIsValidating(true);
        try {
          // Simulate API call to validate wallet
          await new Promise(resolve => setTimeout(resolve, 1000));

          // For demo purposes, we'll assume the wallet is valid if the address starts with "0x"
          const isValid = account.startsWith('0x');
          setIsValidWallet(isValid);

          // Check if wallet has claimable rewards
          // This would be an actual API call in production
          const hasRewards = Number.parseFloat(balance) > 0;
          setHasClaimableRewards(hasRewards);

          if (!isValid) {
            toast({
              title: 'Invalid Wallet',
              description: 'Your wallet is not eligible for claiming rewards',
              variant: 'destructive',
            });
          }
        } catch (error) {
          setIsValidWallet(false);
          
          // CRITICAL: XSS Protection - sanitize error message
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const sanitizedMessage = DOMPurify.sanitize(errorMessage, { 
            ALLOWED_TAGS: [], 
            ALLOWED_ATTR: [] 
          });
          
          toast({
            title: 'Validation Error',
            description: sanitizedMessage || 'Failed to validate your wallet. Please try again later.',
            variant: 'destructive',
          });
        } finally {
          setIsValidating(false);
        }
      };

      validateWallet();
    }
  }, [connected, account, balance, toast]);

  useEffect(() => {
    if (connected) {
      router.replace('/rewards');
    }
  }, [connected, router]);

  if (!connected) {
    return (
      <div className='min-h-screen mobile-content-wrapper bg-gradient-to-br from-yellow-900 via-amber-900 to-yellow-900 flex flex-col items-center justify-center p-4'>
        <div className='mb-6 w-24 h-24 relative'>
          {/* Gold coin instead of logo */}
          <div className='w-24 h-24 rounded-full bg-gradient-radial from-yellow-300 via-yellow-500 to-yellow-700 shadow-lg'></div>
          <div className='absolute inset-0 rounded-full bg-gradient-radial from-yellow-300/0 via-yellow-500/30 to-yellow-700/50 blur-md'></div>
        </div>
        <Card className='w-full max-w-md bg-black/30 border border-yellow-500/50 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='text-xl md:text-2xl text-center text-yellow-400'>
              {t('sections.claim.title')}
            </CardTitle>
            <CardDescription className='text-center text-yellow-300 text-sm md:text-base'>
              {t('sections.claim.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex justify-center'>
            <WalletConnect />
          </CardContent>
          <CardFooter className='flex justify-center'>
            <Link href='/'>
              <Button
                variant='outline'
                className='border-yellow-500/30 bg-black/20 text-yellow-300 hover:bg-black/40 mobile-safe-button'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                {t('construction.returnHome')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen mobile-content-wrapper bg-gradient-to-br from-yellow-900 via-amber-900 to-yellow-900 p-4 pb-24'>
      {/* Use only our new coin animation with high intensity */}
      <CoinsAnimation intensity={isMobile ? 1.5 : 2.5} />

      <div className='container mx-auto'>
        <header className='mb-8 mobile-header-fix mobile-safe-layout'>
          <div className='mobile-header-spacing'>
            <div className='flex items-center justify-between w-full'>
              <Link href='/'>
                <Button
                  variant='outline'
                  className='border-yellow-500/30 bg-black/20 text-yellow-300 hover:bg-black/40 mobile-safe-button'
                >
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  {t('construction.returnHome')}
                </Button>
              </Link>

              <WalletConnect />
            </div>

            {!isMobile && (
              <div className='flex justify-center'>
                <TabNavigation />
              </div>
            )}
          </div>

          <h1 className='text-xl md:text-2xl lg:text-3xl font-bold mt-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300'>
            {t('sections.claim.title')}
          </h1>
          <p className='text-center text-yellow-300 mt-2 text-sm md:text-base'>
            {t('sections.claim.description')}
          </p>
        </header>

        {/* Wallet validation status */}
        {isValidating ? (
          <div className='flex justify-center my-4'>
            <div className='bg-black/30 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 flex items-center'>
              <div className='animate-spin rounded-full h-5 w-5 border-t-2 border-yellow-500 mr-3'></div>
              <span className='text-yellow-300 text-sm md:text-base'>
                {t('wallet.validating')}
              </span>
            </div>
          </div>
        ) : !isValidWallet ? (
          <div className='flex justify-center my-4'>
            <div className='bg-black/30 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 flex items-center'>
              <AlertTriangle className='h-5 w-5 text-red-500 mr-3' />
              <span className='text-red-300 text-sm md:text-base'>
                {t('wallet.invalid')}
              </span>
            </div>
          </div>
        ) : hasClaimableRewards ? (
          <div className='flex justify-center my-4'>
            <div className='bg-black/30 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 flex items-center'>
              <div className='h-5 w-5 bg-green-500 rounded-full mr-3'></div>
              <span className='text-green-300 text-sm md:text-base'>
                {t('wallet.claimable')}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

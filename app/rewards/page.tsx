'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { BurnedNftCard } from '@/components/BurnedNftCard';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { useMobile } from '@/hooks/use-mobile';
import { TabNavigation } from '@/components/tab-navigation';
import { useBurnedNfts } from '@/hooks/useBurnedNfts';

const CoinsAnimation = dynamic(
  () => import('@/components/coins-animation').then(m => m.CoinsAnimation),
  { ssr: false }
);

export default function RewardsPage() {
  const { isMobile } = useMobile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const { burnedNfts, isLoading: isLoadingNfts, error: nftsError } = useBurnedNfts();

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className='flex flex-col items-center justify-center text-center py-20'>
          <Info className='w-16 h-16 text-amber-400 mb-4' />
          <h2 className='text-2xl font-bold text-white mb-2'>
            {t('rewards.connect.title')}
          </h2>
          <p className='text-slate-400 mb-6'>
            {t('rewards.connect.description')}
          </p>
          <WalletConnect />
        </div>
      );
    }

    if (isLoadingNfts) {
      return (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400'></div>
          <span className='ml-3 text-amber-300'>Loading rewards...</span>
        </div>
      );
    }

    if (nftsError) {
      return (
        <div className='text-center py-12'>
          <div className='text-red-400 mb-2'>Error loading data</div>
          <div className='text-slate-400'>{nftsError}</div>
        </div>
      );
    }

    if (!burnedNfts || burnedNfts.length === 0) {
      return (
        <div className='text-center py-12'>
          <div className='text-amber-300 mb-2 text-lg font-semibold'>
            No rewards available
          </div>
          <div className='text-slate-400 max-w-md mx-auto'>
            The appearance of rewards can sometimes be delayed by 3-5 minutes due to blockchain delays or network congestion. Try burning some NFTs to earn rewards!
          </div>
        </div>
      );
    }

    return (
      <div className='nft-card-grid'>
        {burnedNfts.map((nft) => (
          <BurnedNftCard key={nft.tokenId} nft={nft} />
        ))}
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-900 text-white p-4 sm:p-8 relative overflow-hidden'>
      <CoinsAnimation intensity={isMobile ? 0.6 : 1.8} />
      <div className='container mx-auto relative z-10'>
        <header className='mb-4 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-amber-500/30 bg-black/20 text-amber-300 hover:bg-black/40 hover:border-amber-500/30 mobile-safe-button'
            >
              <ArrowLeft className='mr-2 w-4 h-4' />{' '}
              {t('navigation.home', 'Home')}
            </Button>
          </Link>

          {!isMobile && <TabNavigation />}

          <WalletConnect />
        </header>

        <main>{mounted ? renderContent() : null}</main>
      </div>
    </div>
  );
}

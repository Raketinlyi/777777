'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Flame } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { useAlchemyNfts } from '@/hooks/useAlchemyNfts';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { BurnCard } from '@/components/BurnCard';

import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { TabNavigation } from '@/components/tab-navigation';

import { useTranslation, Trans } from 'react-i18next';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { useMobile } from '@/hooks/use-mobile';
import DOMPurify from 'isomorphic-dompurify';

const FireAnimation = dynamic(() => import('@/components/fire-animation'), {
  ssr: false,
});

export default function BurnPage() {
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { nfts, isLoading: isLoadingNFTs, refetch } = useAlchemyNfts();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { t } = useTranslation();
  const { isLiteMode } = usePerformanceContext();
  const { isMobile } = useMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch before mount
  if (!mounted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-red-900 flex items-center justify-center'>
        <div className='text-white'>{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  const handleConnectWallet = async () => {
    if (isConnecting) return; // Prevent multiple clicks

    setIsConnecting(true);
    try {
      const injectedConnector = connectors.find(
        connector => connector.type === 'injected'
      );
      if (injectedConnector) {
        await connect({ connector: injectedConnector });
      }
    } catch (error) {
      } finally {
      // Reset after a delay to prevent rapid clicking
      setTimeout(() => {
        setIsConnecting(false);
      }, 2000);
    }
  };

  const refreshPage = () => {
    setIsRefreshing(true);
    refetch();
    // Visual refresh effect
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div
      className='min-h-screen mobile-content-wrapper relative p-4'
    >
      {/* Full screen gradient background */}
      <div className='fixed inset-0 -z-10 bg-gradient-to-br from-red-900 via-orange-900 to-red-900' />
      {/* Fire animation anchored to bottom - always show */}
        <div className='fixed bottom-0 inset-x-0 h-56 pointer-events-none z-10'>
          <FireAnimation
            intensity={isMobile ? 1 : 3}
            className='w-full h-full'
          />
        </div>

      <div className='container mx-auto relative z-10'>
        {/* Header like in breed page */}
        <header className='mb-4 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-red-500/30 bg-black/20 text-red-300 hover:bg-black/40 mobile-safe-button'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('navigation.home', 'Home')}
            </Button>
          </Link>
          {!isMobile && <TabNavigation />}
          <WalletConnect />
        </header>

        <main>
          {/* Title like in breed */}
          <div className='mt-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center'>
            <h1 className='text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 whitespace-nowrap'>
              {t('sections.burn.title', 'Burn NFT (Roast the Cube!) 🔥')}
            </h1>
          </div>
          <p className='text-center text-red-300 mt-1 mb-2 text-xs md:text-sm lg:text-base'>
            {t('burn.description', 'Burn the cube — get CRA. Easy money! 💰')}
          </p>

          {/* Guide accordion - reduced spacing */}
          <div className='flex justify-center my-2'>
            <Accordion type='single' collapsible className='w-full max-w-lg'>
              <AccordionItem value='guide' className='border-none'>
                <AccordionTrigger className='w-full bg-black/30 backdrop-blur-sm border border-orange-500/40 rounded-full px-4 py-2 text-center text-orange-200 text-sm md:text-base font-semibold hover:bg-black/50 focus:outline-none focus:ring-0 after:hidden'>
                  {t('sections.burn.feeBox.guide.title')}
                </AccordionTrigger>
                <AccordionContent className='text-sm space-y-2 text-orange-200 mt-2 bg-black/90 p-4 rounded-lg border border-orange-500/20'>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(t('sections.burn.feeBox.guide.intro')),
                    }}
                  />
                  <p>
                    <Trans i18nKey='sections.burn.feeBox.guide.pingLock' />
                  </p>
                  <p>
                    <Trans i18nKey='sections.burn.feeBox.guide.loss' />
                  </p>
                  <p>
                    <Trans i18nKey='sections.burn.feeBox.guide.bridgeNote' />
                  </p>
                  <ol className='list-decimal list-inside pl-4 space-y-0.5'>
                    <li>{t('sections.burn.feeBox.guide.step1')}</li>
                    <li>{t('sections.burn.feeBox.guide.step2')}</li>
                    <li>{t('sections.burn.feeBox.guide.step3')}</li>
                  </ol>
                  <p>{t('sections.burn.feeBox.guide.timing')}</p>
                  <p className='text-xs text-orange-300'>
                    {t('sections.burn.feeBox.guide.note')}
                  </p>
                  <p className='text-xs text-orange-300'>
                    <Trans
                      i18nKey='sections.burn.feeBox.guide.sellCRAA'
                      components={{
                        a: (
                          <a
                            href='https://app.camelot.exchange/'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-cyan-400 hover:text-cyan-300 underline'
                          />
                        ),
                      }}
                    />
                  </p>
                  <p className='text-xs text-orange-300'>
                    <Trans i18nKey='sections.burn.feeBox.guide.fees' />
                  </p>
                  <p className='text-xs text-orange-300 font-mono'>
                    {t('sections.burn.feeBox.guide.contractAddress')}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Wallet connection check - reduced spacing */}
          {!isConnected ? (
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-full mb-4'>
                <Flame
                  className={`h-8 w-8 ${mounted ? 'text-orange-500' : 'text-gray-500'}`}
                />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {t('burn.connectWallet', 'Connect Your Wallet')}
              </h3>
              <p className='text-gray-300 mb-4'>
                {t(
                  'burn.connectWalletDesc',
                  'Please connect your wallet to view and burn your NFTs'
                )}
              </p>
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className='bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isConnecting ? (
                  <div className='flex items-center gap-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    {t('wallet.connecting', 'Connecting...')}
                  </div>
                ) : (
                  t('wallet.connect', 'Connect Wallet')
                )}
              </Button>
            </div>
          ) : isLoadingNFTs && mounted ? (
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-full mb-4 animate-spin'>
                <Flame className='h-8 w-8 text-orange-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {t('common.loadingNFTs', 'Loading NFTs...')}
              </h3>
              <p className='text-gray-300'>
                {t(
                  'common.fetchingCollection',
                  'Fetching your CrazyCube collection'
                )}
              </p>
            </div>
          ) : nfts.length === 0 ? (
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-500/20 rounded-full mb-4'>
                <Flame className='h-8 w-8 text-gray-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {t('common.noNFTsFound', 'No NFTs Found')}
              </h3>
              <p className='text-gray-300'>
                {t(
                  'burn.noNFTsDescription',
                  "You don't have any CrazyCube NFTs to burn"
                )}
              </p>
              <Link href='/' className='mt-4 inline-block'>
                <Button className='bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'>
                  {t('common.goToCollection', 'Go to Collection')}
                </Button>
              </Link>
            </div>
          ) : (
            <div
              className={`nft-card-grid relative ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isRefreshing && (
                <div className='absolute inset-0 flex items-center justify-center z-10'>
                  <div className='bg-red-500/20 backdrop-blur-sm rounded-lg p-4 flex items-center gap-2'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-red-500'></div>
                    <span className='text-red-200 font-medium'>
                      {t('sections.burn.updating', 'Updating...')}
                    </span>
                  </div>
                </div>
              )}
              {nfts.map((nft, idx) => (
                <BurnCard
                  key={idx}
                  nft={nft}
                  index={idx}
                  onActionComplete={() => {
                    refreshPage();
                    // Removed repeated refetch call after 3 seconds
                  }}
                />
              ))}
            </div>
          )}

          <div className='mt-8 text-center'>
            <Link href='/'>
              <Button className='bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'>
                {t('navigation.home', 'Home')}
              </Button>
            </Link>
          </div>
        </main>
      </div>

      {/* Burn effect overlay remains optional and can be triggered inside BurnCard if desired */}
    </div>
  );
}

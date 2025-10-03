'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { useAlchemyNftsQuery } from '@/hooks/useAlchemyNftsQuery';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { BurnCard } from '@/components/BurnCard';

import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { TabNavigation } from '@/components/tab-navigation';
import { BackgroundLightning } from '@/components/background-lightning';

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
import { monadChain } from '@/config/chains';
import { useBurnState } from '@/hooks/use-burn-state';
import { useNFTsBatchData } from '@/hooks/useContractBatch';

const PlasmaAnimation = dynamic(() => import('@/components/plasma-animation'), {
  ssr: false,
});

export default function BurnPage() {
  // Все хуки должны быть вызваны до любых условных возвратов
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { data: nfts = [], isLoading: isLoadingNFTs, refetch } = useAlchemyNftsQuery();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { t } = useTranslation();
  const { isLiteMode } = usePerformanceContext();
  const { isMobile } = useMobile();
  const { isBurning } = useBurnState();
  const chainName = monadChain.name;
  const pairTokenSymbol = monadChain.nativeCurrency.symbol;

  // Батчинг запросов NFT данных - один запрос для всех NFT
  const tokenIds = nfts.map(nft => nft.tokenId.toString());
  const { data: batchedNFTData } = useNFTsBatchData(tokenIds);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch before mount
  if (!mounted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 flex items-center justify-center'>
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
  } catch {
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
      className='min-h-screen mobile-content-wrapper relative px-4 pt-2 pb-0 burn-background'
    >
      {/* Enhanced burn background with animations */}
      <div className='fixed inset-0 -z-10 burn-background' />
      
      {/* Background lightning effects - very minimal */}
      <BackgroundLightning />
      
      {/* Plasma animation - gated by Performance Lite mode */}
      {!isLiteMode && (
        <div className='fixed inset-0 pointer-events-none z-0'>
          <PlasmaAnimation
            intensity={isMobile ? 2 : 4}
            className='w-full h-full'
            isPaused={isBurning}
          />
        </div>
      )}

      <div className='container mx-auto relative z-10'>
        {/* Header like in breed page */}
        <header className='mb-1 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-purple-500/30 bg-black/20 text-purple-300 hover:bg-black/40 mobile-safe-button'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('navigation.home', 'Home')}
            </Button>
          </Link>
          {!isMobile && <TabNavigation />}
          <WalletConnect />
        </header>

        <main>
          {/* Title - компактный */}
          <div className='flex items-center justify-center gap-2 text-center mb-0.5'>
            <h1 className='text-lg md:text-xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400'>
              🔥 Burn NFT • Get OCTAA
            </h1>
          </div>



          {/* Guide accordion - как в разделе Breed */}
          <div className='flex justify-center mb-1.5'>
            <Accordion type='single' collapsible className='w-full max-w-lg'>
              <AccordionItem value='guide' className='border-none'>
                <AccordionTrigger className='w-full bg-gradient-to-r from-purple-600/80 via-pink-600/80 to-purple-600/80 hover:from-purple-500/90 hover:via-pink-500/90 hover:to-purple-500/90 backdrop-blur-sm border-2 border-purple-400/60 rounded-lg px-4 py-2.5 text-center text-white text-sm md:text-base font-bold hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] focus:outline-none focus:ring-2 focus:ring-purple-400/50 after:hidden shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-300 cursor-pointer'>
                  <span className='flex items-center justify-center gap-2 w-full'>
                    <span>🔥 {t('sections.burn.feeBox.guide.title', 'Burning Guide')}</span>
                    <span className='text-xs text-purple-200 font-normal'>
                      • {t('sections.burn.guide.clickToLearn', 'Click to learn')}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className='text-sm space-y-2 text-purple-200 mt-2 bg-slate-900/90 p-4 rounded-lg border border-purple-400/20 backdrop-blur-md'>
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
                  <p className='text-xs text-purple-300'>
                    {t('sections.burn.feeBox.guide.note')}
                  </p>
                  <p className='text-xs text-purple-300'>
                    <Trans
                      i18nKey='sections.burn.feeBox.guide.sellOCTA'
                      components={{
                        a: (
                          <a
                            href='https://pancakeswap.finance/'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-cyan-400 hover:text-cyan-300 underline'
                          />
                        ),
                      }}
                    />
                  </p>
                  <p className='text-xs text-purple-300'>
                    <Trans i18nKey='sections.burn.feeBox.guide.fees' />
                  </p>
                  <p className='text-xs text-purple-300 font-mono'>
                    {t('sections.burn.feeBox.guide.contractAddress')}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Wallet connection check - reduced spacing */}
          {!isConnected ? (
            <div className='text-center py-8 bg-transparent'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4'>
                <Zap
                  className={`h-8 w-8 ${mounted ? 'text-purple-500' : 'text-gray-500'}`}
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
                className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed'
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
              <div className='inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4 animate-spin'>
                <Zap className='h-8 w-8 text-purple-500' />
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
                <Zap className='h-8 w-8 text-gray-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {t('common.noNFTsFound', 'No NFTs Found')}
              </h3>
              <p className='text-gray-300'>
                {t(
                  'burn.noNFTsDescription',
                  "You don't have any CrazyCube NFTs to transmute"
                )}
              </p>
              <Link href='/' className='mt-4 inline-block'>
                <Button className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'>
                  {t('common.goToCollection', 'Go to Collection')}
                </Button>
              </Link>
            </div>
          ) : (
            <div
              className={`nft-card-grid burn-card-grid relative ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isRefreshing && (
                <div className='absolute inset-0 flex items-center justify-center z-10'>
                  <div className='bg-purple-500/20 backdrop-blur-sm rounded-lg p-4 flex items-center gap-2'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-red-500'></div>
                    <span className='text-purple-200 font-medium'>
                      {t('sections.burn.updating', 'Updating...')}
                    </span>
                  </div>
                </div>
              )}
              {nfts.map((nft, idx) => {
                // Передаём предзагруженные данные из батча в карточку
                const batchData = batchedNFTData?.find(
                  item => item.tokenId === nft.tokenId.toString()
                );
                return (
                  <BurnCard
                    key={idx}
                    nft={nft}
                    index={idx}
                    batchedData={batchData}
                    onActionComplete={() => {
                      // Локальное обновление без перезагрузки страницы для сохранения анимаций
                      // refreshPage(); // Убрано для сохранения состояния анимаций
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className='mt-8 text-center'>
            <Link href='/'>
              <Button className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'>
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

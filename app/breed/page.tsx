'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { ArrowLeft, Heart, Clock, Plus, X } from 'lucide-react';
import { useAlchemyNfts } from '@/hooks/useAlchemyNfts';
import DOMPurify from 'isomorphic-dompurify';
import Link from 'next/link';
import { ParticleEffect } from '@/components/particle-effect';
import { useMobile } from '@/hooks/use-mobile';
import { TabNavigation } from '@/components/tab-navigation';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSimpleToast } from '@/components/simple-toast';
import { useTranslation, Trans } from 'react-i18next';
import Image from 'next/image';
import { BreedingEffect } from '@/components/breeding-effect';

import { useCrazyCubeGame } from '@/hooks/useCrazyCubeGame';
import { usePublicClient, useAccount, useConnect } from 'wagmi';
import { parseEther } from 'viem';

import { BreedCard } from '@/components/BreedCard';
import dynamic from 'next/dynamic';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import CubeObservers from '@/components/breeding-cube-observers';
import { useLiveBredCubes } from '@/hooks/useLiveBredCubes';

import { useGraveyardReadiness } from '@/hooks/useGraveyardReadiness';
import { formatCRAA, formatSmart } from '@/utils/formatNumber';

// Lazy-load HeartRain only on the client to shave ~30 KB from first load
const HeartRain = dynamic(() => import('@/components/heart-rain'), {
  ssr: false,
  loading: () => null,
});

// Convert ipfs:// URLs to HTTPS gateway
const resolveImageSrc = (url?: string) => {
  if (!url) return '/favicon.ico';
  if (url.startsWith('ipfs://')) {
    return `https://nftstorage.link/ipfs/${url.slice(7)}`;
  }
  if (url.startsWith('https://')) {
    return url;
  }
  return '/favicon.ico';
};

export default function BreedPage() {
  const { isConnected: connected, address: account } = useAccount();
  const { connect, connectors } = useConnect();
  const {
    nfts: allNFTs,
    error: allNFTsError,
    refetch: refetchAllNFTs,
  } = useAlchemyNfts();
  const [userNFTs, setUserNFTs] = useState<import('@/types/nft').NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (allNFTs) {
      setUserNFTs(allNFTs);
      setIsLoading(false);
    }
    if (allNFTsError) {
      setError(allNFTsError);
      setIsLoading(false);
    }
  }, [allNFTs, allNFTsError]);

  const refetch = useCallback(() => {
    refetchAllNFTs();
  }, [refetchAllNFTs]);

  const [bredNFTsCooldown, setBredNFTsCooldown] = useState<{
    [tokenId: number]: number;
  }>({});

  // Function to set cooldown on bred NFTs (3 minutes for parents)
  const addBredNFTsCooldown = useCallback((usedTokenIds: number[]) => {
    const now = Date.now();
    const cooldownDuration = 3 * 60 * 1000; // 3 minutes in milliseconds

    setBredNFTsCooldown(prev => {
      const newCooldowns = { ...prev };
      usedTokenIds.forEach(tokenId => {
        newCooldowns[tokenId] = now + cooldownDuration;
      });
      return newCooldowns;
    });

    setTimeout(() => {
      setBredNFTsCooldown(prev => {
        const updated = { ...prev };
        usedTokenIds.forEach(tokenId => {
          delete updated[tokenId];
        });
        return updated;
      });
    }, cooldownDuration);
  }, []);

  const handleConnectWallet = async () => {
    if (isConnecting) return; // Prevent multiple clicks

    setIsConnecting(true);
    try {
      const connector = connectors[0];
      if (connector) {
        await connect({ connector });
      }
    } catch (error) {
      } finally {
      // Reset after a delay to prevent rapid clicking
      setTimeout(() => {
        setIsConnecting(false);
      }, 2000);
    }
  };
  const {
    revived: liveRevived,
    startWatching,
    stopWatching,
  } = useLiveBredCubes();
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);
  const [isBreeding, setIsBreeding] = useState(false);
  const [showBreedingEffect, setShowBreedingEffect] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedNFTsData, setSelectedNFTsData] = useState<{
    [tokenId: number]: { currentStars: number; isActivated: boolean };
  }>({});

  const { getNFTGameData } = useCrazyCubeGame();
  const {
    breedCost,
    breedNFTs,
    approveCRAA,
    craaBalance,
    isTxLoading,
    isTxSuccess,
    isTxError,
    txHash,
    txError,
    CRAA_TOKEN_ADDRESS,
    CRAA_TOKEN_ABI,
    GAME_CONTRACT_ADDRESS,
  } = useCrazyCubeGame();

  // Use new hook to check graveyard readiness
  const {
    isReady: graveyardIsReady,
    timeUntilReady,
    totalTokens: graveyardTotalTokens,
    loading: graveyardLoading,
  } = useGraveyardReadiness();

  const { isMobile } = useMobile();
  const { toast } = useSimpleToast();
  const { t } = useTranslation();
  const publicClient = usePublicClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const tr = useCallback(
    (key: string, fallback: string) => (mounted ? t(key, fallback) : fallback),
    [mounted, t]
  );

  // Function to refresh data after breeding (like in ping and burn pages)
  const refreshDataAfterBreeding = useCallback(
    (usedTokenIds: number[]) => {
      // Set cooldown on used NFTs (3 minutes for parents)
      addBredNFTsCooldown(usedTokenIds);

      // Show loading message
      toast({
        title: tr(
          'sections.breed.breedingSuccessful',
          'Breeding Successful! 💕'
        ),
        description: tr('sections.breed.updatingData', 'Updating NFT data...'),
      });

      // Single refresh after 3 seconds to ensure blockchain is updated
      setTimeout(() => {
        refetch();
      }, 3000);
    },
    [addBredNFTsCooldown, toast, tr, refetch]
  );

  // Clear selected NFTs when disconnected
  useEffect(() => {
    if (!connected) {
      setSelectedNFTs([]);
      setSelectedNFTsData({});
    }
  }, [connected]);

  // Start/stop event watching based on page visibility
  useEffect(() => {
    if (connected) {
      startWatching();
      return () => stopWatching();
    }
    // when disconnected nothing to clean
    return undefined;
  }, [connected, startWatching, stopWatching]);

  // Load data for selected NFTs
  useEffect(() => {
    const loadNFTData = async () => {
      for (const tokenId of selectedNFTs) {
        if (!selectedNFTsData[tokenId]) {
          try {
            const nftData = await getNFTGameData(tokenId.toString());
            if (nftData) {
              setSelectedNFTsData(prev => ({
                ...prev,
                [tokenId]: {
                  currentStars: nftData.currentStars,
                  isActivated: nftData.isActivated,
                },
              }));
            }
          } catch {
            // Ignore errors
          }
        }
      }
    };

    if (selectedNFTs.length > 0 && connected) {
      loadNFTData();
    }
  }, [selectedNFTs, connected, getNFTGameData]);

  // Check if selected NFTs can be bred
  const canBreedSelectedNFTs = () => {
    if (selectedNFTs.length !== 2) return false;

    // Check graveyard readiness
    if (!graveyardIsReady) {
      return false;
    }

    // Check that both NFTs have stars (not gray)
    for (const tokenId of selectedNFTs) {
      const nftData = selectedNFTsData[tokenId];
      if (!nftData || nftData.currentStars === 0) {
        return false;
      }
    }

    return true;
  };

  const handleSelectNFT = (tokenId: number) => {
    // Block selection during breeding
    if (isBreeding) {
      return;
    }

    // Check if NFT is on cooldown (3 minutes for parents)
    const now = Date.now();
    const cooldownEndTime = bredNFTsCooldown[tokenId];
    if (cooldownEndTime && now < cooldownEndTime) {
      const remainingSeconds = Math.ceil((cooldownEndTime - now) / 1000);
      toast({
        title: tr('sections.breed.nftOnCooldown', 'NFT on Cooldown'),
        description: tr(
          'sections.breed.nftCooldownDesc',
          'This NFT was recently used for breeding. Wait {seconds} seconds.'
        ).replace('{seconds}', remainingSeconds.toString()),
        variant: 'destructive',
      });
      return;
    }

    if (selectedNFTs.includes(tokenId)) {
      setSelectedNFTs(prev => prev.filter(id => id !== tokenId));
    } else if (selectedNFTs.length < 2) {
      setSelectedNFTs(prev => [...prev, tokenId]);
    } else {
      toast({
        title: tr(
          'sections.breed.maximumSelectionReached',
          'Maximum selection reached'
        ),
        description: tr(
          'sections.breed.canOnlySelectTwoNfts',
          'You can only select 2 NFTs for breeding'
        ),
        variant: 'destructive',
      });
    }
  };

  const handleBreeding = async () => {
    if (selectedNFTs.length !== 2) {
      toast({
        title: tr('sections.breed.invalidSelection', 'Invalid selection'),
        description: tr(
          'sections.breed.mustSelectExactlyTwoNfts',
          'You must select exactly 2 NFTs for breeding'
        ),
        variant: 'destructive',
      });
      return;
    }

    if (!connected) {
      toast({
        title: tr('sections.breed.walletNotConnected', 'Wallet not connected'),
        description: tr(
          'sections.breed.pleaseConnectWalletFirst',
          'Please connect your wallet first'
        ),
        variant: 'destructive',
      });
      return;
    }

    // Check graveyard readiness
    if (!graveyardIsReady) {
      let description = tr(
        'sections.breed.graveyardCooldownDesc',
        'Wait until at least one burned cube finishes cooldown.'
      );

      if (timeUntilReady && timeUntilReady > 0) {
        const minutes = Math.floor(timeUntilReady / 60);
        const seconds = timeUntilReady % 60;
        description = `${tr('sections.breed.timeUntilReady', 'Time until ready:')} ${minutes}m ${seconds}s`;
      }

      toast({
        title: tr(
          'sections.breed.graveyardCooldown',
          'Graveyard cooldown active'
        ),
        description,
        variant: 'destructive',
      });
      return;
    }

    // Check that both NFTs have stars
    for (const tokenId of selectedNFTs) {
      const nftData = selectedNFTsData[tokenId];
      if (!nftData || nftData.currentStars === 0) {
        toast({
          title: tr(
            'sections.breed.inactiveNftSelected',
            'Inactive NFT selected'
          ),
          description: tr(
            'sections.breed.nftNoStarsLeft',
            'NFT #{id} has no stars left and cannot be used for breeding.'
          ).replace('{id}', tokenId.toString()),
          variant: 'destructive',
        });
        return;
      }
    }

    // Pre-checks
    const costWei = parseEther(breedCost || '0');
    if (craaBalance && BigInt(parseEther(craaBalance)) < costWei) {
      toast({
        title: tr('sections.breed.insufficientCra', 'Insufficient CRAA'),
        description: tr(
          'sections.breed.needCraToBreed',
          'Need {amount} CRAA to breed'
        ).replace('{amount}', breedCost),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check allowance
      if (!publicClient) throw new Error('No RPC client');

      const allowance: bigint = (await publicClient.readContract({
        address: CRAA_TOKEN_ADDRESS as `0x${string}`,
        abi: CRAA_TOKEN_ABI,
        functionName: 'allowance',
        args: [account as `0x${string}`, GAME_CONTRACT_ADDRESS],
      })) as bigint;

      if (allowance < costWei) {
        toast({
          title: tr('sections.breed.approveCra', 'Approve CRAA'),
          description: tr(
            'sections.breed.approveCraDesc',
            'First transaction: give contract permission to spend CRAA'
          ),
        });
        await approveCRAA(breedCost);
        toast({
          title: tr('sections.breed.approvalConfirmed', 'Approval confirmed'),
          description: tr(
            'sections.breed.craAllowanceSet',
            'CRAA allowance set'
          ),
        });
      }

      setIsBreeding(true);
      setShowBreedingEffect(true);

      toast({
        title: tr('sections.breed.confirmBreeding', 'Confirm breeding'),
        description: tr(
          'sections.breed.signBreedingTransaction',
          'Sign breeding transaction'
        ),
      });
      await breedNFTs(String(selectedNFTs[0]), String(selectedNFTs[1]));

      // Note: refreshDataAfterBreeding will be called in useEffect when isTxSuccess becomes true
    } catch (e: unknown) {
      toast({
        title: tr('sections.breed.breedingCanceled', 'Breeding canceled'),
        description:
          (e as Error)?.message ||
          tr('sections.breed.transactionRejected', 'Transaction rejected'),
        variant: 'destructive',
      });
      setIsBreeding(false);
      setShowBreedingEffect(false);
    }
  };

  const shownSuccessToast = useRef(false);
  const shownErrorToast = useRef(false);
  // Watch tx status (after toast is defined)
  useEffect(() => {
    if (isTxSuccess && !shownSuccessToast.current) {
      shownSuccessToast.current = true;
      const usedNFTs = [...selectedNFTs];
      toast({
        title: tr(
          'sections.breed.breedingSuccessful',
          'Breeding Successful! 💕'
        ),
        description: tr(
          'sections.breed.txConfirmed',
          'Tx confirmed: {hash}...'
        ).replace('{hash}', txHash?.slice(0, 10) || ''),
      });
      setSelectedNFTs([]);
      setIsBreeding(false);
      setShowBreedingEffect(false);
      if (usedNFTs.length > 0) {
        refreshDataAfterBreeding(usedNFTs);
      }
    }
    if (isTxError && !shownErrorToast.current) {
      shownErrorToast.current = true;
      toast({
        title: tr('sections.breed.transactionError', 'Transaction error'),
        description:
          txError?.message ||
          tr('sections.breed.unknownError', 'Unknown error occurred'),
        variant: 'destructive',
      });
      setIsBreeding(false);
      setShowBreedingEffect(false);
    }
    // Reset flags when status resets
    if (!isTxSuccess) shownSuccessToast.current = false;
    if (!isTxError) shownErrorToast.current = false;
  }, [isTxSuccess, isTxError, selectedNFTs, txError?.message, txHash]);

  // calculate whether breeding cube observer should be shown
  const selectionCount = selectedNFTs.length;
  const phase: 'idle' | 'breeding' | 'success' = isBreeding
    ? 'breeding'
    : isTxSuccess
      ? 'success'
      : 'idle';

  useEffect(() => {
    if (liveRevived.length > 0) {
      // immediately refetch list to show resurrected cube
      refetch();
    }
  }, [liveRevived, refetch]);

  return (
    <div className='min-h-screen mobile-content-wrapper relative p-4 pb-24'>
      {/* Full screen gradient background */}
      <div className='fixed inset-0 -z-10 bg-gradient-to-br from-pink-900 via-purple-900 to-pink-900' />
      
      {/* Background hearts rain */}
      <div className='fixed inset-0 pointer-events-none z-0'>
      <HeartRain
        density={isMobile ? 15 : 30}
        color='#fb7185'
        className='mix-blend-screen'
      />
      {/* Background particles in pink/purple tones */}
      <ParticleEffect
        count={isMobile ? 8 : 30}
        colors={['#ec4899', '#f472b6', '#c084fc', '#a855f7']}
        speed={isMobile ? 0.3 : 0.5}
        size={isMobile ? 4 : 7}
      />
      </div>
      
      <div className='container mx-auto relative z-10'>
        <header className='mb-4 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-pink-500/30 bg-black/20 text-pink-300 hover:bg-black/40 mobile-safe-button'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {tr('navigation.home', 'Home')}
            </Button>
          </Link>
          {!isMobile && <TabNavigation />}
          <WalletConnect />
        </header>

        <main>
          {/* Guide accordion */}
          <div className='flex justify-center mb-2'>
            <Accordion type='single' collapsible className='w-full max-w-lg'>
              <AccordionItem value='guide' className='border-none'>
                <AccordionTrigger className='w-full bg-black/30 backdrop-blur-sm border border-pink-500/40 rounded-full px-4 py-2 text-center text-pink-200 text-sm md:text-base font-semibold hover:bg-black/50 focus:outline-none focus:ring-0 after:hidden'>
                  {tr('sections.breed.guide.title', '🪄 Breed Guide')}
                </AccordionTrigger>
                <AccordionContent className='text-sm space-y-2 text-pink-200 mt-2 bg-black/90 p-4 rounded-lg border border-pink-500/20'>
                  {mounted ? (
                    <>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(tr('sections.breed.guide.intro', '')),
                        }}
                      />
                      <p>
                        <Trans i18nKey='sections.breed.guide.fee' />
                      </p>
                      <p>
                        <Trans i18nKey='sections.breed.guide.requirement' />
                      </p>
                      <p>
                        <Trans i18nKey='sections.breed.guide.rarity' />
                      </p>
                      <p>
                        <Trans i18nKey='sections.breed.guide.penalty' />
                      </p>
                      <ol className='list-decimal list-inside pl-4 space-y-0.5'>
                        <li>{t('sections.breed.guide.step1')}</li>
                        <li>{t('sections.breed.guide.step2')}</li>
                      </ol>
                      <p className='text-xs text-pink-300'>
                        <Trans i18nKey='sections.breed.guide.note' />
                      </p>
                      <p className='text-xs text-pink-300'>
                        <Trans
                          i18nKey='sections.breed.guide.buyNFT'
                          components={{
                            a: (
                              <a
                                href='https://magiceden.io/ru/collections/apechain/crazycube-2'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-cyan-400 hover:text-cyan-300 underline'
                              />
                            ),
                          }}
                        />
                      </p>
                      <p className='text-xs text-pink-300 font-mono'>
                        {tr(
                          'sections.breed.guide.contractAddress',
                          'CRAA Token Contract: 0xBb526D657Cc1Ba772469A6EC96AcB2ed9D2A93e5'
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Breed a cube by paying 20 % of current price.</p>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Wallet connection check */}
          {!connected ? (
            <div className='text-center py-12'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-pink-500/20 rounded-full mb-4'>
                <Heart className='h-8 w-8 text-pink-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {tr('sections.breed.connectWallet', 'Connect Your Wallet')}
              </h3>
              <p className='text-gray-300 mb-4'>
                {tr(
                  'sections.breed.connectWalletDesc',
                  'Please connect your wallet to view and breed your NFTs'
                )}
              </p>
              {connectors.length > 0 && connectors[0] && (
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className='bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isConnecting ? (
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      {tr('wallet.connecting', 'Connecting...')}
                    </div>
                  ) : (
                    tr('sections.breed.connectWalletButton', 'Connect Wallet')
                  )}
                </Button>
              )}
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4'>
                <Heart className='h-8 w-8 text-red-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {tr('sections.breed.errorLoadingNfts', 'Error Loading NFTs')}
              </h3>
              <p className='text-gray-300 mb-4'>{error.message}</p>
              <Button
                onClick={() => window.location.reload()}
                className='bg-gradient-to-r from-red-600 to-red-700'
              >
                {tr('common.retry', 'Retry')}
              </Button>
            </div>
          ) : isLoading ? (
            <div className='text-center py-12'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-pink-500/20 rounded-full mb-4 animate-spin'>
                <Heart className='h-8 w-8 text-pink-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {tr('sections.breed.loadingNfts', 'Loading NFTs...')}
              </h3>
              <p className='text-gray-300'>
                {tr(
                  'sections.breed.loadingNftsDesc',
                  'Fetching your CrazyCube collection'
                )}
              </p>
            </div>
          ) : userNFTs.length === 0 ? (
            <div className='text-center py-12'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-500/20 rounded-full mb-4'>
                <Heart className='h-8 w-8 text-gray-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {tr('sections.breed.noNftsFound', 'No NFTs Found')}
              </h3>
              <p className='text-gray-300'>
                {tr(
                  'sections.breed.noNftsFoundDesc',
                  "You don't have any CrazyCube NFTs to breed"
                )}
              </p>
              <Link href='/' className='mt-4 inline-block'>
                <Button className='bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500'>
                  {tr('sections.breed.goToCollection', 'Go to Collection')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className='space-y-8'>
              {/* Breeding Selection Area */}
              <div className='text-center'>
                <h3 className='text-xl font-semibold text-white mb-2 whitespace-nowrap'>
                  {tr(
                    'sections.breed.selectNftsForBreeding',
                    'Select 2 NFTs for Breeding'
                  )}{' '}
                  ({selectedNFTs.length}/2)
                </h3>

                {/* Graveyard status info */}
                <div className='mb-4'>
                  {graveyardLoading ? (
                    <p className='text-sm text-pink-200'>
                      ⏳{' '}
                      {tr(
                        'sections.breed.loadingGraveyardStatus',
                        'Loading graveyard status...'
                      )}
                    </p>
                  ) : graveyardTotalTokens === 0 ? (
                    <p className='text-sm text-amber-300'>
                      ⚰️{' '}
                      {tr(
                        'sections.breed.graveyardEmpty',
                        'No burned cubes in graveyard'
                      )}
                    </p>
                  ) : graveyardIsReady ? (
                    <p className='text-sm text-green-300'>
                      ✅{' '}
                      {tr(
                        'sections.breed.graveyardReady',
                        'Graveyard is ready for breeding'
                      )}
                    </p>
                  ) : (
                    <div className='text-sm text-red-300'>
                      <p>
                        ⚠️{' '}
                        {tr(
                          'sections.breed.graveyardCooldown',
                          'Graveyard cooldown active'
                        )}
                      </p>
                      {timeUntilReady && timeUntilReady > 0 && (
                        <p className='text-xs'>
                          {tr(
                            'sections.breed.timeUntilReady',
                            'Time until ready:'
                          )}{' '}
                          {Math.floor(timeUntilReady / 60)}m{' '}
                          {timeUntilReady % 60}s
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected NFTs Display */}
                <div className='flex justify-center gap-3 mb-2'>
                  {[0, 1].map(index => (
                    <div
                      key={index}
                      className='w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 border-2 border-dashed border-pink-500/50 rounded-lg flex items-center justify-center bg-pink-500/10'
                    >
                      {selectedNFTs[index] ? (
                        <div className='relative group'>
                          {(() => {
                            const nft = userNFTs.find(
                              n => n.tokenId === selectedNFTs[index]
                            );
                            return nft ? (
                              <>
                                <div className='relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28'>
                                  <Image
                                    src={resolveImageSrc(nft.image)}
                                    alt={`Selected ${nft.name}`}
                                    fill
                                    sizes='(max-width: 768px) 80px, 96px'
                                    className='object-contain rounded-md'
                                    priority
                                  />
                                </div>
                                <button
                                  onClick={() => handleSelectNFT(nft.tokenId)}
                                  className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                                >
                                  <X className='w-4 h-4 text-white' />
                                </button>
                              </>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <div className='text-center'>
                          <Plus className='w-8 h-8 text-pink-500/50 mx-auto mb-2' />
                          <p className='text-xs text-pink-300/50'>
                            {tr('sections.breed.selectNft', 'Select NFT')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Breeding Button */}
                {selectedNFTs.length === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='mb-6'
                  >
                    <Button
                      onClick={handleBreeding}
                      disabled={
                        isBreeding || isTxLoading || !canBreedSelectedNFTs()
                      }
                      className='w-full max-w-xs mx-auto bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed container-adaptive'
                    >
                      {isBreeding ? (
                        <span className='adaptive-text-lg flex items-center justify-center'>
                          <Clock className='mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin flex-shrink-0' />
                          <span className='truncate'>
                            {tr('sections.breed.breeding', 'Breeding...')}
                          </span>
                        </span>
                      ) : (
                        <span className='adaptive-text-lg flex items-center justify-center'>
                          <Heart className='mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0' />
                          <span className='truncate'>
                            {tr('sections.breed.breedNfts', 'Breed NFTs')} (
                            {formatSmart(breedCost || '0', 8)} CRAA)
                          </span>
                        </span>
                      )}
                    </Button>

                    {/* Warning message when breeding is blocked */}
                    {!canBreedSelectedNFTs() && !isBreeding && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className='mt-3 text-center'
                      >
                        {!graveyardIsReady ? (
                          <div className='text-red-400 text-sm'>
                            <p>
                              ⚠️{' '}
                              {tr(
                                'sections.breed.graveyardCooldown',
                                'Graveyard cooldown active'
                              )}
                            </p>
                            <p className='text-xs'>
                              {tr(
                                'sections.breed.graveyardCooldownDesc',
                                'Wait until at least one burned cube finishes cooldown'
                              )}
                            </p>
                            {timeUntilReady && timeUntilReady > 0 && (
                              <p className='text-xs'>
                                {tr(
                                  'sections.breed.timeUntilReady',
                                  'Time until ready:'
                                )}{' '}
                                {Math.floor(timeUntilReady / 60)}m{' '}
                                {timeUntilReady % 60}s
                              </p>
                            )}
                          </div>
                        ) : selectedNFTs.some(tokenId => {
                            const nftData = selectedNFTsData[tokenId];
                            return !nftData || nftData.currentStars === 0;
                          }) ? (
                          <p className='text-red-400 text-sm'>
                            ⚠️{' '}
                            {tr(
                              'sections.breed.selectedNftsNoStars',
                              'Selected NFTs have no stars left! Choose active NFTs with stars.'
                            )}
                          </p>
                        ) : (
                          <p className='text-red-400 text-sm'>
                            ⚠️{' '}
                            {tr(
                              'sections.breed.cannotBreedSelectedNfts',
                              'Cannot breed selected NFTs. Check requirements.'
                            )}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* NFT Grid */}
              <div
                className={`nft-card-grid ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isRefreshing && (
                  <div className='absolute inset-0 flex items-center justify-center z-10'>
                    <div className='bg-pink-500/20 backdrop-blur-sm rounded-lg p-4 flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500'></div>
                      <span className='text-pink-200 font-medium'>
                        {tr('sections.breed.updating', 'Updating...')}
                      </span>
                    </div>
                  </div>
                )}
                {userNFTs.map((nft, index) => {
                  const isSelected = selectedNFTs.includes(nft.tokenId);
                  const selectedOrder =
                    selectedNFTs[0] === nft.tokenId
                      ? 1
                      : selectedNFTs[1] === nft.tokenId
                        ? 2
                        : undefined;

                  // Check if NFT is on breeding cooldown (3 minutes for parents)
                  const now = Date.now();
                  const cooldownEndTime = bredNFTsCooldown[nft.tokenId];
                  const isOnCooldown = !!(
                    cooldownEndTime && now < cooldownEndTime
                  );
                  const cooldownRemaining = isOnCooldown
                    ? Math.ceil((cooldownEndTime - now) / 1000)
                    : undefined;

                  return (
                    <BreedCard
                      key={nft.tokenId || index}
                      nft={nft}
                      index={index}
                      selected={isSelected}
                      {...(selectedOrder && { selectedOrder })}
                      onSelect={handleSelectNFT}
                      onActionComplete={refetch}
                      isOnCooldown={isOnCooldown}
                      cooldownRemaining={cooldownRemaining}
                    />
                  );
                })}
              </div>

              {/* Cube observers commenting on breeding when 1 NFT selected */}
              <CubeObservers selectionCount={selectionCount} phase={phase} />
            </div>
          )}
        </main>
      </div>{' '}
      {/* Breeding Effect */}
      {showBreedingEffect && (
        <BreedingEffect
          isActive={showBreedingEffect}
          onComplete={() => setShowBreedingEffect(false)}
        />
      )}
    </div>
  );
}

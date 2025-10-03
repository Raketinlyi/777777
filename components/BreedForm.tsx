'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { useAlchemyNftsQuery } from '@/hooks/useAlchemyNftsQuery';
import { useGraveyardAvailability } from '@/hooks/useGraveyardAvailability';
import { useNetwork } from '@/hooks/use-network';
import {
  useCrazyOctagonGame,
  type NFTGameData,
} from '@/hooks/useCrazyOctagonGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'isomorphic-dompurify';
import { formatEther } from 'viem';

export function BreedForm() {
  const { address } = useAccount();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: nfts = [], isLoading: isLoadingNFTs } = useAlchemyNftsQuery();
  const { has: graveyardReady, loading: loadingGraveyard } = useGraveyardAvailability();
  const { isMonadChain, requireMonadChain } = useNetwork();

  const {
    getNFTGameData,
    breedNFTs,
  approveNFT,
    approveOCTAA,
    approveOCTA,
    breedCost,
    breedOctaCost,
    breedSponsorFee,
    breedLpContribution,
    breedCostWei,
    breedOctaCostWei,
    breedSponsorFeeWei,
  } = useCrazyOctagonGame();

  const [parent1, setParent1] = useState<number | null>(null);
  const [parent2, setParent2] = useState<number | null>(null);
  const [parent1Info, setParent1Info] = useState<NFTGameData | null>(null);
  const [parent2Info, setParent2Info] = useState<NFTGameData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (parent1 === null) {
        setParent1Info(null);
        return;
      }
      try {
        const info = await getNFTGameData(String(parent1));
        if (!cancelled) setParent1Info(info);
      } catch (error) {
        if (!cancelled) {
          toast({
            title: t('status.error', 'Error'),
            description: (error as Error).message,
            variant: 'destructive',
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [parent1, getNFTGameData, toast, t]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (parent2 === null) {
        setParent2Info(null);
        return;
      }
      try {
        const info = await getNFTGameData(String(parent2));
        if (!cancelled) setParent2Info(info);
      } catch (error) {
        if (!cancelled) {
          toast({
            title: t('status.error', 'Error'),
            description: (error as Error).message,
            variant: 'destructive',
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [parent2, getNFTGameData, toast, t]);

  const reset = () => {
    setParent1(null);
    setParent2(null);
    setParent1Info(null);
    setParent2Info(null);
  };

  const ready = parent1 !== null && parent2 !== null && parent1 !== parent2 && parent1Info && parent2Info;

  const validations = useMemo(() => {
    if (!ready || !parent1Info || !parent2Info) return [] as string[];
    const messages: string[] = [];
    if (!parent1Info.isActivated || !parent2Info.isActivated) {
      messages.push(t('breed.validation.activated', 'Both parents must be activated.'));
    }
    if (parent1Info.isInGraveyard || parent2Info.isInGraveyard) {
      messages.push(t('breed.validation.graveyard', 'A parent is currently in the graveyard.'));
    }
    if (parent1Info.gender === parent2Info.gender) {
      messages.push(t('breed.validation.gender', 'Parents must have different genders.'));
    }
    if (parent1Info.currentStars === 0 || parent2Info.currentStars === 0) {
      messages.push(t('breed.validation.stars', 'Parents need at least one star left.'));
    }
    return messages;
  }, [ready, parent1Info, parent2Info, t]);

  const canBreed = ready && validations.length === 0 && graveyardReady;

  const handleBreed = requireMonadChain(async () => {
    if (!canBreed || parent1 === null || parent2 === null) return;
    setIsProcessing(true);
    try {
      const totalOctaWei = breedOctaCostWei + breedSponsorFeeWei;
      if (totalOctaWei > 0n) {
        await approveOCTA(formatEther(totalOctaWei));
      }
      if (breedCostWei > 0n) {
        // OCTAA burn approval (hook provides approveOCTAA)
      await approveOCTAA(formatEther(breedCostWei));
      }
      await Promise.all([
        approveNFT(String(parent1)),
        approveNFT(String(parent2)),
      ]);
      await breedNFTs(String(parent1), String(parent2));
      toast({
        title: t('breed.successTitle', 'Breed requested'),
        description: t('breed.successDesc', 'Random cube will be revived from the graveyard soon.'),
      });
      reset();
    } catch (error) {
      toast({
        title: t('status.error', 'Error'),
        description: DOMPurify.sanitize((error as Error).message),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  });

  if (!address) {
    return <p className='text-center text-slate-400'>{t('wallet.connectFirst', 'Connect wallet first')}</p>;
  }

  return (
    <Card className='mx-auto mt-8 max-w-4xl bg-slate-950/70 border-purple-500/20 backdrop-blur'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between text-purple-200'>
          <span>{t('sections.breed.title', 'Select parents for revival')}</span>
          <div className='flex flex-wrap items-center gap-2 text-xs text-slate-300'>
            {/* Show both CRAA (burn) and OCTA (main pool) balances in the web-model form header */}
            <SummaryBadge label={t('sections.breed.costs.craaBurn', 'CRAA burn')} value={`${breedCost} CRAA`} />
            <SummaryBadge label={t('sections.breed.costs.octa', 'OCTA main pool')} value={`${breedOctaCost} OCTA`} />
            <SummaryBadge label={t('sections.breed.costs.sponsor', 'Sponsor fee')} value={`${breedSponsorFee} OCTA`} />
            <SummaryBadge label={t('sections.breed.costs.lp', 'LP allocation')} value={`${breedLpContribution} OCTA`} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {loadingGraveyard ? (
          <LoadingState message={t('sections.breed.loadingGraveyard', 'Checking graveyard status...')} />
        ) : !graveyardReady ? (
          <EmptyState message={t('sections.breed.graveEmpty', 'Graveyard is empty for now. Deposit more burned cubes to continue.')} />
        ) : isLoadingNFTs ? (
          <LoadingState message={t('sections.breed.loadingNfts', 'Loading your cubes...')} />
        ) : (
          <div className='grid gap-4 md:grid-cols-2'>
            <ParentColumn
              title={t('sections.breed.parent1', 'Parent #1')}
              nfts={nfts}
              selected={parent1}
              onSelect={setParent1}
              otherSelected={parent2}
              info={parent1Info}
            />
            <ParentColumn
              title={t('sections.breed.parent2', 'Parent #2')}
              nfts={nfts}
              selected={parent2}
              onSelect={setParent2}
              otherSelected={parent1}
              info={parent2Info}
            />
          </div>
        )}

        {validations.length > 0 && (
          <ul className='space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200'>
            {validations.map(msg => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}

        <div className='flex flex-col gap-2 text-xs text-slate-400'>
          <div className='flex items-center gap-2'>
            <Sparkles className='h-4 w-4 text-purple-300' />
            <span>{t('sections.breed.note.stars', 'Each parent loses one star after breeding. Revived cube comes from the graveyard.')}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Shield className='h-4 w-4 text-cyan-300' />
            <span>{t('sections.breed.note.fee', 'OCTA fee is split automatically between player pool and burn, rest added to LP.')}</span>
          </div>
        </div>

        <div className='flex justify-end gap-3'>
          <Button variant='secondary' onClick={reset} disabled={isProcessing}>
            {t('common.reset', 'Reset')}
          </Button>
          <Button
                disabled={!isMonadChain || !canBreed || isProcessing}
            onClick={handleBreed}
            className='bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-400 hover:to-cyan-400'
          >
            {isProcessing ? <Loader2 className='h-4 w-4 animate-spin' /> : t('sections.breed.action', 'Request breed')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ParentColumnProps {
  title: string;
  nfts: import('@/types/nft').NFT[];
  selected: number | null;
  otherSelected: number | null;
  onSelect: (id: number | null) => void;
  info: NFTGameData | null;
}

function ParentColumn({ title, nfts, selected, otherSelected, onSelect, info }: ParentColumnProps) {
  const { t } = useTranslation();
  return (
    <div className='rounded-xl border border-purple-500/20 bg-slate-900/60 p-4 backdrop-blur'>
      <h3 className='mb-3 text-sm font-semibold text-purple-200'>{title}</h3>
      <div className='grid max-h-80 gap-3 overflow-y-auto pr-1'>
        {nfts.map(nft => {
          const isSelected = nft.tokenId === selected;
          const disabled = otherSelected === nft.tokenId;
          return (
            <button
              type='button'
              key={nft.id}
              disabled={disabled}
              onClick={() => onSelect(isSelected ? null : nft.tokenId)}
              className={`flex items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                isSelected ? 'border-purple-400 bg-purple-500/10' : 'border-slate-700 hover:border-purple-400'
              } ${disabled ? 'opacity-40' : ''}`}
            >
              <img
                src={nft.image}
                alt={nft.name ?? `Cube #${nft.tokenId}`}
                className='h-16 w-16 rounded-md object-cover'
              />
              <div className='flex-1 text-xs text-slate-300'>
                <div className='font-semibold text-purple-100'>#{nft.tokenId}</div>
                {isSelected && info ? (
                  <ul className='space-y-0.5 text-[11px] text-slate-400'>
                    <li>
                      {t('sections.breed.stats.stars', 'Stars')}: {info.currentStars}/{info.initialStars}
                    </li>
                    <li>
                      {t('sections.breed.stats.gender', 'Gender')}: {genderLabel(info.gender)}
                    </li>
                    <li>
                      {t('sections.breed.stats.grave', 'In graveyard')}: {info.isInGraveyard ? t('common.yes', 'Yes') : t('common.no', 'No')}
                    </li>
                  </ul>
                ) : (
                  <p className='text-[11px]'>{nft.name}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SummaryBadgeProps {
  label: string;
  value: string;
}

function SummaryBadge({ label, value }: SummaryBadgeProps) {
  return (
    <span className='rounded-full border border-purple-500/30 px-3 py-1 text-xs text-purple-100'>
      {label}: <span className='font-semibold text-purple-200'>{value}</span>
    </span>
  );
}

interface FeedbackProps {
  message: string;
}

function LoadingState({ message }: FeedbackProps) {
  return (
    <div className='flex justify-center py-12 text-slate-200'>
      <Loader2 className='h-5 w-5 animate-spin' />
      <span className='ml-2 text-sm'>{message}</span>
    </div>
  );
}

function EmptyState({ message }: FeedbackProps) {
  return <p className='py-10 text-center text-sm text-slate-400'>{message}</p>;
}

function genderLabel(value?: number) {
  if (value === 1) return '♂';
  if (value === 2) return '♀';
  return '?';
}

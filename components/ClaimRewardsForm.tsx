'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useNetwork } from '@/hooks/use-network';
import { useTranslation } from 'react-i18next';
import { useCrazyOctagonGame, type BurnRecord } from '@/hooks/useCrazyOctagonGame';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export function ClaimRewardsForm() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState('');
  const [burnRecord, setBurnRecord] = useState<BurnRecord | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isMonadChain, requireMonadChain } = useNetwork();
  const { t } = useTranslation();

  const {
    getBurnRecord,
    claimBurnRewards,
    isWritePending,
    isTxLoading,
  } = useCrazyOctagonGame();

  useEffect(() => {
    let cancelled = false;
    const fetchRecord = async () => {
      if (!tokenId) {
        setBurnRecord(null);
        setLoadError(null);
        return;
      }
      setIsLoadingRecord(true);
      setLoadError(null);
      try {
        const record = await getBurnRecord(tokenId);
        if (!cancelled) {
          setBurnRecord(record);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError((err as Error).message);
          setBurnRecord(null);
        }
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };
    void fetchRecord();
    return () => {
      cancelled = true;
    };
  }, [tokenId, getBurnRecord]);

  const handleClaim = requireMonadChain(async () => {
    if (!tokenId) return;
    await claimBurnRewards(tokenId);
  });

  if (!address) {
    return <p className='text-center text-slate-400'>{t('wallet.connectFirst', 'Connect wallet first')}</p>;
  }

  const claimed = burnRecord?.claimed ?? false;
  const claimTime = burnRecord?.claimAvailableTime
    ? new Date(burnRecord.claimAvailableTime * 1000).toLocaleString()
    : '—';

  return (
    <Card className='mx-auto mt-6 max-w-md bg-slate-900/60 border-cyan-500/20 backdrop-blur'>
      <CardHeader>
        <CardTitle className='text-cyan-200'>{t('sections.claim.title', 'Claim OCTA Rewards')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <InputField value={tokenId} onChange={setTokenId} label={t('sections.claim.tokenHint', 'Burned NFT ID')} />

        {isLoadingRecord ? (
          <div className='flex items-center justify-center text-cyan-200'>
            <Loader2 className='h-5 w-5 animate-spin' />
          </div>
        ) : loadError ? (
          <Alert variant='destructive'>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : burnRecord ? (
          <div className='space-y-2 text-sm text-slate-200'>
            <div className='flex justify-between'>
              <span>{t('sections.claim.amount', 'Locked amount')}</span>
              <span className='font-mono text-emerald-300'>{burnRecord.lockedAmount} OCTA</span>
            </div>
            <div className='flex justify-between'>
              <span>{t('sections.claim.waitPreset', 'Wait preset')}</span>
              <span>{burnRecord.waitPeriod} min</span>
            </div>
            <div className='flex justify-between'>
              <span>{t('sections.claim.claimTime', 'Claim available')}</span>
              <span>{claimTime}</span>
            </div>
            <div className='flex justify-between'>
              <span>{t('sections.claim.status', 'Status')}</span>
              <span className={claimed ? 'text-emerald-300' : 'text-amber-300'}>
                {claimed ? t('status.claimed', 'Claimed') : t('status.notClaimed', 'Not claimed')}
              </span>
            </div>
          </div>
        ) : tokenId ? (
          <Alert>
            <AlertDescription>{t('sections.claim.noRecord', 'No burn record found for this token')}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          disabled={!isMonadChain || !tokenId || isWritePending || isTxLoading || claimed}
          onClick={handleClaim}
          className='w-full bg-cyan-600 hover:bg-cyan-700'
        >
          {isWritePending || isTxLoading
            ? t('status.confirming', 'Confirming...')
            : t('sections.claim.button', 'Claim rewards')}
        </Button>
      </CardContent>
    </Card>
  );
}

interface InputFieldProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
}

function InputField({ value, onChange, label }: InputFieldProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-slate-300'>{label}</Label>
      <input
        type='number'
        min={0}
        value={value}
        onChange={event => onChange(event.target.value)}
        className='w-full rounded border border-cyan-500/30 bg-slate-900/70 px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400/60'
        placeholder='1042'
      />
    </div>
  );
}

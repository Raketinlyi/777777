'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Code2,
  Hash,
  Layers,
  Sparkles,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { apeChain } from '@/config/chains';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props {
  nftCount?: number;
  craaTotal?: string;
}

const explorerUrl = 'https://apescan.io/address/'; // fallback explorer url

export function ContractInfo({ nftCount, craaTotal }: Props) {
  const { t } = useTranslation();
  // addresses from chain config for single source of truth
  const GAME_ADDRESS = apeChain.contracts.gameProxy.address;
  const NFT_ADDRESS = apeChain.contracts.crazyCubeNFT.address;
  const CRAA_ADDRESS = apeChain.contracts.crazyToken.address;

  // helper to copy address
  const copyAddress = (addr: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(addr);
    }
  };

  const ContractCard = ({
    label,
    address,
    icon: Icon,
    gradientColors,
    delay,
  }: {
    label: string;
    address: string;
    icon: React.ElementType;
    gradientColors: string;
    delay: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className='group'
    >
      <Card
        className={`relative overflow-hidden border-2 bg-gradient-to-r ${gradientColors} p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
      >
        <div className='relative z-10'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center'>
              <Icon className='w-6 h-6 mr-3 text-white' />
              <span className='font-bold text-white text-lg'>{label}</span>
            </div>
            <div className='flex items-center space-x-2'>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => copyAddress(address)}
                className='p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors'
                title='Copy address'
              >
                <Copy className='w-4 h-4 text-white' />
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href={`${explorerUrl}${address}`}
                target='_blank'
                rel='noopener noreferrer'
                className='p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors'
                title='View on explorer'
              >
                <ExternalLink className='w-4 h-4 text-white' />
              </motion.a>
            </div>
          </div>

          <div className='bg-black/30 rounded-lg p-3 backdrop-blur-sm'>
            <code className='text-white/90 font-mono text-sm break-all leading-relaxed'>
              {address}
            </code>
          </div>
        </div>

        {/* Decorative glow effect */}
        <div className='absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
      </Card>
    </motion.div>
  );

  return (
    <div className='w-full max-w-6xl mx-auto'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        <ContractCard
          label={t('info.tabs.contract', 'Game Contract')}
          address={GAME_ADDRESS}
          icon={Code2}
          gradientColors='from-cyan-500 to-blue-600 border-cyan-300/50'
          delay={0.1}
        />

        <ContractCard
          label={t('info.nftCollection', 'NFT Collection')}
          address={NFT_ADDRESS}
          icon={Hash}
          gradientColors='from-pink-500 to-rose-600 border-pink-300/50'
          delay={0.2}
        />

        <ContractCard
          label={t('info.tabs.craaToken', 'CRAA Token')}
          address={CRAA_ADDRESS}
          icon={Sparkles}
          gradientColors='from-amber-500 to-orange-600 border-amber-300/50'
          delay={0.3}
        />
      </div>

      {/* Additional stats */}
      {(nftCount !== undefined || craaTotal) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className='grid grid-cols-1 md:grid-cols-2 gap-4'
        >
          {nftCount !== undefined && (
            <Card className='bg-gradient-to-r from-emerald-500/20 to-green-600/20 border-emerald-300/30 p-4'>
              <div className='flex items-center'>
                <Layers className='w-6 h-6 mr-3 text-emerald-400' />
                <div>
                  <div className='text-slate-300 text-sm'>
                    {t('info.totalNfts', 'Total NFTs')}
                  </div>
                  <div className='text-white font-bold text-xl'>
                    {nftCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {craaTotal && (
            <Card className='bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border-yellow-300/30 p-4'>
              <div className='flex items-center'>
                <Sparkles className='w-6 h-6 mr-3 text-yellow-400' />
                <div>
                  <div className='text-slate-300 text-sm'>
                    {t('info.craaSupply', 'CRAA Supply')}
                  </div>
                  <div className='text-white font-bold text-xl'>
                    {craaTotal} CRAA
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Heart,
  Flame,
  Skull,
  Timer,
  Star,
  Coins,
  Shield,
  TrendingUp,
  Lock,
  Unlock,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function GameGuide() {
  const { t } = useTranslation();
  const gameFeatures = [
    {
      icon: <Coins className='h-6 w-6 text-amber-400' />,
      title: "Accumulated coins don't burn",
      description:
        'Your CRAA tokens are locked and accumulated, not burned forever!',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: <Shield className='h-6 w-6 text-blue-400' />,
      title: 'Decentralized future',
      description:
        'After debugging (1-2 months) the team will disable admin rights and transfer control to an autonomous agent',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Lock className='h-6 w-6 text-green-400' />,
      title: 'Full autonomy',
      description:
        'NFT collection will transfer to fully decentralized management market',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const gameActions = [
    {
      icon: <Flame className='h-8 w-8 text-red-400' />,
      title: 'NFT Burning',
      time: '12/24/48 hours',
      description: 'Burn NFT and lock CRAA tokens to receive rewards',
      color: 'border-red-500/30 bg-red-900/10',
    },
    {
      icon: <Skull className='h-8 w-8 text-purple-400' />,
      title: 'Graveyard',
      description: 'Burned NFTs go to graveyard with 48 hour cooldown',
      time: '48 hours cooldown',
      color: 'border-purple-500/30 bg-purple-900/10',
    },
    {
      icon: <Heart className='h-8 w-8 text-pink-400' />,
      title: 'Breeding',
      description: 'Create new NFTs from graveyard',
      time: '48 hours cooldown',
      color: 'border-pink-500/30 bg-pink-900/10',
      note: 'After breeding NFTs cannot participate in actions',
    },
    {
      icon: <Zap className='h-8 w-8 text-yellow-400' />,
      title: 'Ping',
      description: 'Activate NFT to receive rewards',
      time: '7 days interval',
      color: 'border-yellow-500/30 bg-yellow-900/10',
      note: 'NFTs accumulate and do not burn!',
    },
    {
      icon: <Coins className='h-8 w-8 text-green-400' />,
      title: 'Pool rewards',
      description: 'Receive CRAA tokens from reward pool',
      time: '30 days interval',
      color: 'border-green-500/30 bg-green-900/10',
    },
    {
      icon: <Clock className='h-8 w-8 text-blue-400' />,
      title: 'Other actions',
      description: 'Various game mechanics',
      time: '24 hours cooldown',
      color: 'border-blue-500/30 bg-blue-900/10',
    },
  ];

  return (
    <div className='space-y-8 mt-8'>
      {/* Game Title */}
      <Card className='p-6 bg-gradient-to-r from-violet-900/50 to-purple-900/50 border-violet-500/30'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-white mb-2'>
            🎮 How to play CRAAzyCube
          </h2>
          <p className='text-violet-300 text-lg'>
            Full guide to game mechanics
          </p>
        </div>
      </Card>

      {/* Unique Features */}
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
          <Star className='h-6 w-6 mr-2 text-yellow-400' />
          Unique game features
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {gameFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg bg-gradient-to-br ${feature.color}/10 border border-slate-600/30`}
            >
              <div className='flex items-center mb-3'>
                {feature.icon}
                <h4 className='text-lg font-bold text-white ml-3'>
                  {feature.title}
                </h4>
              </div>
              <p className='text-slate-300 text-sm'>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Game Example */}
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
          <TrendingUp className='h-6 w-6 mr-2 text-green-400' />
          Game example with 3 NFTs
        </h3>

        <div className='bg-slate-900/50 p-6 rounded-lg border border-slate-600/30'>
          <div className='space-y-4'>
            <div className='flex items-center'>
              <Badge className='bg-blue-600 mr-3'>NFT #1</Badge>
              <span className='text-white'>Active, can ping every 7 days</span>
            </div>
            <div className='flex items-center'>
              <Badge className='bg-red-600 mr-3'>NFT #2</Badge>
              <span className='text-white'>
                Burned for 24 hours, CRAA tokens are locked and accumulated
              </span>
            </div>
            <div className='flex items-center'>
              <Badge className='bg-purple-600 mr-3'>NFT #3</Badge>
              <span className='text-white'>
                In graveyard, ready to breed through 48 hours
              </span>
            </div>
          </div>

          <div className='mt-6 p-4 bg-green-900/20 rounded-lg border border-green-500/30'>
            <p className='text-green-300 font-semibold'>
              💡 Result: Constant stream of CRAA tokens without losses!
            </p>
          </div>
        </div>
      </Card>

      {/* Game Actions */}
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
          <Timer className='h-6 w-6 mr-2 text-cyan-400' />
          Game actions and timers
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {gameActions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-xl ${action.color} border-2 hover:scale-105 transition-transform duration-300`}
            >
              <div className='flex items-center mb-3'>
                {action.icon}
                <h4 className='text-lg font-bold text-white ml-3'>
                  {action.title}
                </h4>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400 text-sm'>Time:</span>
                  <Badge variant='outline' className='text-xs'>
                    {action.time}
                  </Badge>
                </div>

                <p className='text-slate-300 text-sm'>{action.description}</p>

                {action.note && (
                  <div className='mt-3 p-2 bg-yellow-900/20 rounded border border-yellow-500/30'>
                    <p className='text-yellow-300 text-xs'>⚠️ {action.note}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Decentralization Roadmap */}
      <Card className='p-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30'>
        <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
          <Unlock className='h-6 w-6 mr-2 text-indigo-400' />
          {t('info.roadmap.title', 'Road to decentralization')}
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='bg-yellow-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>⚙️</span>
            </div>
            <h4 className='text-lg font-bold text-white mb-2'>
              {t('info.roadmap.phase1.title', 'Phase 1: Debugging')}
            </h4>
            <p className='text-slate-300 text-sm'>
              {t(
                'info.roadmap.phase1.desc',
                '1-2 months of testing and optimizing all game mechanics'
              )}
            </p>
          </div>

          <div className='text-center'>
            <div className='bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>🤖</span>
            </div>
            <h4 className='text-lg font-bold text-white mb-2'>
              {t('info.roadmap.phase2.title', 'Phase 2: Autonomy')}
            </h4>
            <p className='text-slate-300 text-sm'>
              {t(
                'info.roadmap.phase2.desc',
                'Connect autonomous agent and remove admin rights'
              )}
            </p>
          </div>

          <div className='text-center'>
            <div className='bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>🌐</span>
            </div>
            <h4 className='text-lg font-bold text-white mb-2'>
              {t('info.roadmap.phase3.title', 'Phase 3: Freedom')}
            </h4>
            <p className='text-slate-300 text-sm'>
              {t(
                'info.roadmap.phase3.desc',
                'Fully decentralized management only by market'
              )}
            </p>
          </div>
        </div>

        <div className='mt-6 p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/30'>
          <p className='text-indigo-300 text-center font-semibold'>
            {t(
              'info.roadmap.tagline',
              '🚀 CRAAzyCube - first NFT collection with full decentralization plan!'
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}

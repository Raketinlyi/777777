'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { X, Send, Heart, UserPlus, Repeat, Users } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

const NewCubeIntro = dynamic(
  () => import('@/components/NewCubeIntro').then(m => m.NewCubeIntro),
  { ssr: false }
);

interface Props {
  tweetId: string;
  onClose: () => void;
}

export function SocialPromptModal({ tweetId, onClose }: Props) {
  const isMobile = useMobile();
  const { t } = useTranslation();

  const twitterFollowUrl = `https://twitter.com/intent/follow?screen_name=crazy_octagon`;
  const twitterLikeUrl = `https://twitter.com/intent/like?tweet_id=${tweetId}`;
  const twitterRtUrl = `https://twitter.com/intent/retweet?tweet_id=${tweetId}`;
  const tweetUrl = `https://x.com/crazy_octagon/status/${tweetId}`;
  const telegramUrl = `https://t.me/+gEnPkDekDKgzZmYx`;
  const discordUrl = `https://discord.gg/a8tufdh65m`;

  // Blinking animation for attention
  const blinkAnimation = {
    animate: {
      opacity: [1, 0.3, 1],
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='absolute inset-0 bg-black/80 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 50 }}
        className={`relative bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-md border-2 border-yellow-400/60 rounded-3xl shadow-2xl shadow-yellow-400/30 ${
          isMobile ? 'mx-4 max-w-sm' : 'max-w-md'
        } w-full p-4 overflow-hidden max-h-[90vh] overflow-y-auto`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-300 hover:text-white transition-colors z-20'
        >
          <X className='w-6 h-6' />
        </button>

        {/* Animated cubes background (new intro) */}
        <div className='absolute inset-0 pointer-events-none opacity-30'>
          <NewCubeIntro height={320} />
        </div>

        {/* Glowing border effect */}
        <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20 blur-xl animate-pulse'></div>

        {/* Content */}
        <div className='relative z-10 text-center space-y-6'>
          {/* Blinking Title */}
          <motion.div {...blinkAnimation}>
            <h2 className='text-3xl font-extrabold text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text mb-2'>
              🎉 {t('social.megaGiveaway', 'MEGA GIVEAWAY!')} 🎉
            </h2>
            <motion.p
              className='text-yellow-200 text-base font-bold'
              animate={{
                textShadow: [
                  '0 0 5px #fbbf24',
                  '0 0 20px #fbbf24',
                  '0 0 5px #fbbf24',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {t(
                'social.supportAndWin',
                'Support us and WIN NFT + CRA tokens!'
              )}{' '}
              💎
            </motion.p>
          </motion.div>

          {/* Prize announcement */}
          <motion.div
            className='bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 rounded-2xl p-3'
            animate={{
              boxShadow: [
                '0 0 20px rgba(251, 191, 36, 0.3)',
                '0 0 40px rgba(251, 191, 36, 0.6)',
                '0 0 20px rgba(251, 191, 36, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className='text-white font-bold text-base mb-2'>
              🏆 {t('social.prizePool', 'PRIZE POOL:')}
            </p>
            <div className='text-yellow-200 font-semibold'>
              <div>🎁 {t('social.exclusiveNFTs', 'Exclusive NFTs')}</div>
              <div>
                💰 {t('social.craTokens', 'CRA tokens (various amounts)')}
              </div>
              <div>⭐ {t('social.discordRoles', 'Special Discord roles')}</div>
              <div>
                🔥 {t('social.bonusSurprises', 'Bonuses and surprises')}
              </div>
            </div>
          </motion.div>

          {/* Social buttons */}
          <div className='space-y-3'>
            {/* Telegram */}
            <motion.a
              href={telegramUrl}
              target='_blank'
              rel='noopener noreferrer'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className='block w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-5 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/40 text-base'
            >
              <Send className='inline w-6 h-6 mr-3' />
              📱 {t('social.joinTelegram', 'Join Telegram')}
            </motion.a>

            {/* Discord */}
            <motion.a
              href={discordUrl}
              target='_blank'
              rel='noopener noreferrer'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className='block w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-5 rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/40 text-base'
            >
              <Users className='inline w-6 h-6 mr-3' />
              🎮 {t('social.joinDiscord', 'Join Discord')}
            </motion.a>

            {/* Twitter actions */}
            <div className='space-y-3'>
              {' '}
              <motion.p
                className='text-pink-200 text-base font-bold'
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⚡ {t('social.twitterActions', 'Twitter actions:')}
              </motion.p>
              <div className='grid grid-cols-1 gap-3'>
                {/* Follow button */}
                <motion.a
                  href={twitterFollowUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/40 text-sm'
                >
                  <UserPlus className='w-5 h-5 mr-2' />
                  🐦 {t('social.followTwitter', 'Follow @crazy_octagon (x.com/crazy_octagon)')}
                </motion.a>

                {/* Tweet view button */}
                <motion.a
                  href={tweetUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='flex items-center justify-center bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/40 text-sm'
                >
                  📰 {t('social.viewPost', 'View post')}
                </motion.a>

                {/* Like and Retweet buttons */}
                <div className='grid grid-cols-2 gap-3'>
                  <motion.a
                    href={twitterLikeUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='flex items-center justify-center bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-2.5 px-2 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/40 text-sm'
                  >
                    <Heart className='w-4 h-4 mr-1' />
                    ❤️ {t('social.like', 'Like')}
                  </motion.a>

                  <motion.a
                    href={twitterRtUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2.5 px-2 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/40 text-sm'
                  >
                    <Repeat className='w-4 h-4 mr-1' />
                    🔄 {t('social.retweet', 'Retweet')}
                  </motion.a>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className='flex gap-3 pt-3'>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-green-500/40 text-base'
            >
              ✅ {t('social.allDone', 'I DID EVERYTHING!')}
            </motion.button>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-gray-500/40 text-base'
            >
              ⏰ {t('social.later', 'Later')}
            </motion.button>
          </div>

          {/* Footer note with blinking */}
          <motion.div
            animate={{
              opacity: [1, 0.6, 1],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className='bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-3 mt-4'
          >
            <p className='text-yellow-200 font-bold text-base'>
              🔥 {t('social.participateNow', 'PARTICIPATE NOW!')} 🔥
            </p>
            <p className='text-yellow-300 text-xs mt-1'>
              {t(
                'social.weeklyGiveaway',
                'Giveaway every week among active participants!'
              )}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

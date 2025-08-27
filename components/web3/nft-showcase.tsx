'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Crown, Shield, Sword } from 'lucide-react';

interface NFTData {
  id: number;
  name: string;
  image: string;
  price: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  element: string;
  stats: {
    attack: number;
    defense: number;
    speed: number;
    magic: number;
  };
}

const nftData: NFTData[] = [
  {
    id: 1,
    name: 'Cyber Cube Alpha',
    image: '/images/cube1.png',
    price: '0.5 APE',
    rarity: 'Legendary',
    element: 'Tech',
    stats: { attack: 95, defense: 88, speed: 92, magic: 87 },
  },
  {
    id: 2,
    name: 'Frost Guardian',
    image: '/images/cube2.png',
    price: '0.3 APE',
    rarity: 'Epic',
    element: 'Ice',
    stats: { attack: 78, defense: 95, speed: 65, magic: 88 },
  },
  {
    id: 3,
    name: 'Thunder Beast',
    image: '/images/cube3.png',
    price: '0.4 APE',
    rarity: 'Epic',
    element: 'Electric',
    stats: { attack: 90, defense: 70, speed: 95, magic: 85 },
  },
  {
    id: 4,
    name: 'Earth Titan',
    image: '/images/cube4.png',
    price: '0.2 APE',
    rarity: 'Rare',
    element: 'Earth',
    stats: { attack: 82, defense: 90, speed: 60, magic: 75 },
  },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'Legendary':
      return 'from-purple-500 to-pink-500';
    case 'Epic':
      return 'from-orange-500 to-red-500';
    case 'Rare':
      return 'from-blue-500 to-cyan-500';
    default:
      return 'from-green-500 to-emerald-500';
  }
};

const StatBar = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) => (
  <div className='flex items-center gap-2'>
    <Icon className='w-4 h-4 text-cyan-400' />
    <span className='text-sm text-slate-300 min-w-[60px]'>{label}</span>
    <div className='flex-1 bg-slate-700 rounded-full h-2 overflow-hidden'>
      <motion.div
        className='h-full bg-gradient-to-r from-cyan-500 to-purple-500'
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </div>
    <span className='text-white font-bold text-sm min-w-[30px]'>{value}</span>
  </div>
);

export default function NFTShowcase() {
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate featured NFT
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % nftData.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentNFT = nftData[currentIndex];

  if (!currentNFT) {
    return null;
  }

  return (
    <div className='w-full max-w-6xl mx-auto p-6 space-y-12'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <h2 className='text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400'>
          🎮 NFT MARKETPLACE 🎮
        </h2>
        <p className='text-xl text-cyan-200 max-w-2xl mx-auto'>
          Trade unique NFT cubes, collect rare artifacts, and dominate the
          metaverse!
        </p>
      </motion.div>

      {/* Featured NFT Carousel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='relative'
      >
        <Card className='bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-cyan-500/50 backdrop-blur-sm overflow-hidden'>
          <CardContent className='p-8'>
            <div className='grid md:grid-cols-2 gap-8 items-center'>
              {/* NFT Image */}
              <div className='relative'>
                <motion.div
                  key={currentNFT.id}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className='relative'
                >
                  <div className='relative w-80 h-80 mx-auto'>
                    <Image
                      src={currentNFT.image}
                      alt={currentNFT.name}
                      width={320}
                      height={320}
                      className='rounded-2xl shadow-2xl'
                    />

                    {/* Holographic overlay */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(currentNFT.rarity)} opacity-20 rounded-2xl`}
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />

                    {/* Floating particles */}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className='absolute w-2 h-2 bg-cyan-400 rounded-full'
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${30 + (i % 3) * 20}%`,
                        }}
                        animate={{
                          y: [-10, -30, -10],
                          opacity: [0.5, 1, 0.5],
                          scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* NFT Details */}
              <div className='space-y-6'>
                <div>
                  <Badge
                    className={`mb-3 bg-gradient-to-r ${getRarityColor(currentNFT.rarity)}`}
                  >
                    <Sparkles className='w-4 h-4 mr-2' />
                    {currentNFT.rarity}
                  </Badge>

                  <h3 className='text-3xl font-bold text-white mb-2'>
                    {currentNFT.name}
                  </h3>

                  <div className='flex items-center gap-4 mb-4'>
                    <Badge
                      variant='outline'
                      className='border-cyan-500 text-cyan-300'
                    >
                      {currentNFT.element}
                    </Badge>
                    <span className='text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400'>
                      {currentNFT.price}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className='space-y-3'>
                  <h4 className='text-lg font-semibold text-cyan-300 mb-3'>
                    Attributes:
                  </h4>
                  <StatBar
                    label='Attack'
                    value={currentNFT.stats.attack}
                    icon={Sword}
                  />
                  <StatBar
                    label='Defense'
                    value={currentNFT.stats.defense}
                    icon={Shield}
                  />
                  <StatBar
                    label='Speed'
                    value={currentNFT.stats.speed}
                    icon={Zap}
                  />
                  <StatBar
                    label='Magic'
                    value={currentNFT.stats.magic}
                    icon={Sparkles}
                  />
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3 pt-4'>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className='bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400'
                      onClick={() => setSelectedNFT(currentNFT)}
                    >
                      <Crown className='w-4 h-4 mr-2' />
                      Details
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant='outline'
                      className='border-cyan-500 text-cyan-300 hover:bg-cyan-500/20'
                    >
                      🛒 Buy
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation dots */}
        <div className='flex justify-center gap-2 mt-6'>
          {nftData.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-cyan-400' : 'bg-slate-600'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Quick Grid Preview */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {nftData.map((nft, index) => (
          <motion.div
            key={nft.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{
              y: -5,
              scale: 1.02,
            }}
            onClick={() => setSelectedNFT(nft)}
            className='cursor-pointer'
          >
            <Card className='bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors'>
              <CardContent className='p-4 text-center'>
                <Image
                  src={nft.image}
                  alt={nft.name}
                  width={80}
                  height={80}
                  className='rounded-lg mx-auto mb-2'
                />
                <h4 className='font-semibold text-white text-sm'>{nft.name}</h4>
                <p className='text-cyan-400 text-xs'>{nft.price}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Coming Soon Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className='text-center'
      >
        <Badge className='bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-lg px-6 py-3'>
          🚀 Marketplace launches alongside the game!
        </Badge>
      </motion.div>

      {/* Detailed NFT Modal */}
      <AnimatePresence>
        {selectedNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => setSelectedNFT(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className='bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/50 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              <div className='text-center space-y-6'>
                <motion.div
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className='w-48 h-48 mx-auto'
                >
                  <Image
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    width={192}
                    height={192}
                    className='rounded-xl shadow-2xl'
                  />
                </motion.div>

                <div>
                  <Badge
                    className={`mb-3 bg-gradient-to-r ${getRarityColor(selectedNFT.rarity)}`}
                  >
                    {selectedNFT.rarity}
                  </Badge>
                  <h2 className='text-3xl font-bold text-white mb-2'>
                    {selectedNFT.name}
                  </h2>
                  <p className='text-xl text-yellow-400 font-bold'>
                    {selectedNFT.price}
                  </p>
                </div>

                <div className='space-y-3 text-left'>
                  <StatBar
                    label='Attack'
                    value={selectedNFT.stats.attack}
                    icon={Sword}
                  />
                  <StatBar
                    label='Defense'
                    value={selectedNFT.stats.defense}
                    icon={Shield}
                  />
                  <StatBar
                    label='Speed'
                    value={selectedNFT.stats.speed}
                    icon={Zap}
                  />
                  <StatBar
                    label='Magic'
                    value={selectedNFT.stats.magic}
                    icon={Sparkles}
                  />
                </div>

                <Button
                  onClick={() => setSelectedNFT(null)}
                  className='w-full bg-gradient-to-r from-cyan-500 to-purple-500'
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

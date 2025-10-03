'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Zap } from 'lucide-react';

interface CubeInfo {
  id: string;
  name: string;
  image: string;
  rarity: number;
  power: number;
  element: string;
  description: string;
  color: string;
}

const cubesData: CubeInfo[] = [
  {
    id: '1',
    name: 'Fire Destroyer',
    image: '/images/cube1.png',
    rarity: 6,
    power: 95,
    element: 'Fire',
    description: 'Legendary fire cube capable of incinerating enemies',
    color: 'from-red-500 to-orange-500',
  },
  {
    id: '2',
    name: 'Ice Guardian',
    image: '/images/cube2.png',
    rarity: 5,
    power: 88,
    element: 'Ice',
    description: 'Ice defender with impenetrable armor',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: '3',
    name: 'Thunder Striker',
    image: '/images/cube3.png',
    rarity: 6,
    power: 92,
    element: 'Electric',
    description: 'Lightning striker with electric power',
    color: 'from-yellow-500 to-purple-500',
  },
  {
    id: '4',
    name: 'Earth Shaker',
    image: '/images/cube4.png',
    rarity: 4,
    power: 78,
    element: 'Earth',
    description: 'Mighty earth cube creating earthquakes',
    color: 'from-green-500 to-brown-500',
  },
  {
    id: '5',
    name: 'Wind Walker',
    image: '/images/cube5.png',
    rarity: 3,
    power: 65,
    element: 'Air',
    description: 'Fast air cube with wind agility',
    color: 'from-gray-500 to-blue-300',
  },
  {
    id: '6',
    name: 'Shadow Phantom',
    image: '/images/cube6.png',
    rarity: 5,
    power: 85,
    element: 'Dark',
    description: 'Mysterious shadow cube from parallel world',
    color: 'from-purple-900 to-black',
  },
  {
    id: '7',
    name: 'Light Bringer',
    image: '/images/cube7.png',
    rarity: 6,
    power: 98,
    element: 'Light',
    description: 'Holy light cube banishing darkness',
    color: 'from-yellow-300 to-white',
  },
  {
    id: '8',
    name: 'Cosmic Voyager',
    image: '/images/cube8.png',
    rarity: 6,
    power: 100,
    element: 'Cosmic',
    description: 'Legendary cosmic cube from distant galaxies',
    color: 'from-purple-500 to-pink-500',
  },
];

const getRarityColor = (rarity: number) => {
  switch (rarity) {
    case 6:
      return 'text-purple-400 border-purple-400';
    case 5:
      return 'text-orange-400 border-orange-400';
    case 4:
      return 'text-blue-400 border-blue-400';
    case 3:
      return 'text-green-400 border-green-400';
    default:
      return 'text-gray-400 border-gray-400';
  }
};

const getRarityName = (rarity: number) => {
  switch (rarity) {
    case 6:
      return 'LEGENDARY';
    case 5:
      return 'EPIC';
    case 4:
      return 'RARE';
    case 3:
      return 'COMMON';
    default:
      return 'BASIC';
  }
};

export default function CubeGallery() {
  const [selectedCube, setSelectedCube] = useState<CubeInfo | null>(null);
  const [hoveredCube, setHoveredCube] = useState<string | null>(null);

  return (
    <div className='w-full max-w-7xl mx-auto p-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center mb-12'
      >
        <h2 className='text-4xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400'>
          ⚡ CUBE COLLECTION ⚡
        </h2>
        <p className='text-xl text-cyan-200 max-w-2xl mx-auto'>
          Discover unique NFT cubes with various powers and abilities
        </p>
      </motion.div>

      {/* Cube Grid */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-12'>
        {cubesData.map((cube, index) => (
          <motion.div
            key={cube.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{
              y: -10,
              rotateY: 5,
              rotateX: 5,
              scale: 1.05,
            }}
            onHoverStart={() => setHoveredCube(cube.id)}
            onHoverEnd={() => setHoveredCube(null)}
            onClick={() => setSelectedCube(cube)}
            className='cursor-pointer'
          >
            <Card className='bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-cyan-500/30 backdrop-blur-sm overflow-hidden relative group'>
              <CardContent className='p-6'>
                {/* Rarity Badge */}
                <Badge
                  variant='outline'
                  className={`absolute top-2 right-2 z-10 ${getRarityColor(cube.rarity)}`}
                >
                  {getRarityName(cube.rarity)}
                </Badge>

                {/* Cube Image */}
                <div className='relative mb-4'>
                  <motion.div
                    animate={
                      hoveredCube === cube.id
                        ? {
                            rotateY: [0, 360],
                            scale: [1, 1.1, 1],
                          }
                        : {}
                    }
                    transition={{
                      duration: 2,
                      repeat: hoveredCube === cube.id ? Infinity : 0,
                    }}
                    className='relative w-full h-32 mx-auto'
                  >
                    <Image
                      src={cube.image}
                      alt={cube.name}
                      width={128}
                      height={128}
                      className='rounded-lg shadow-2xl mx-auto'
                    />

                    {/* Glow Effect */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${cube.color} rounded-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                      animate={
                        hoveredCube === cube.id
                          ? {
                              opacity: [0.2, 0.5, 0.2],
                            }
                          : {}
                      }
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Power Ring */}
                  <motion.div
                    className='absolute -bottom-2 left-1/2 transform -translate-x-1/2'
                    whileHover={{ scale: 1.2 }}
                  >
                    <div className='bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full p-2 shadow-lg shadow-cyan-500/50'>
                      <span className='text-white font-bold text-sm'>
                        {cube.power}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Cube Info */}
                <div className='text-center space-y-2'>
                  <h3 className='font-bold text-lg text-white group-hover:text-cyan-300 transition-colors'>
                    {cube.name}
                  </h3>

                  <div className='flex justify-center items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      {cube.element}
                    </Badge>

                    <div className='flex items-center text-yellow-400'>
                      {Array.from({ length: cube.rarity }).map((_, i) => (
                        <Star key={i} className='w-3 h-3 fill-current' />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hover Effects */}
                <motion.div
                  className='absolute inset-0 pointer-events-none'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredCube === cube.id ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Particle effects */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className='absolute w-1 h-1 bg-cyan-400 rounded-full'
                      style={{
                        left: `${20 + i * 10}%`,
                        top: `${30 + (i % 3) * 20}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        y: [0, -20, -40],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Selected Cube Modal */}
      <AnimatePresence>
        {selectedCube && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => setSelectedCube(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className='bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/50 rounded-2xl p-8 max-w-md w-full'
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className='text-center mb-6'>
                <Badge
                  variant='outline'
                  className={`mb-4 ${getRarityColor(selectedCube.rarity)}`}
                >
                  {getRarityName(selectedCube.rarity)}
                </Badge>

                <motion.div
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className='w-32 h-32 mx-auto mb-4'
                >
                  <Image
                    src={selectedCube.image}
                    alt={selectedCube.name}
                    width={128}
                    height={128}
                    className='rounded-xl shadow-2xl'
                  />
                </motion.div>

                <h2 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2'>
                  {selectedCube.name}
                </h2>
              </div>

              {/* Stats */}
              <div className='space-y-4 mb-6'>
                <div className='flex justify-between items-center'>
                  <span className='text-slate-300'>Element:</span>
                  <Badge className={`bg-gradient-to-r ${selectedCube.color}`}>
                    {selectedCube.element}
                  </Badge>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-slate-300'>Power:</span>
                  <div className='flex items-center gap-2'>
                    <Zap className='w-4 h-4 text-yellow-400' />
                    <span className='font-bold text-white'>
                      {selectedCube.power}
                    </span>
                  </div>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-slate-300'>Rarity:</span>
                  <div className='flex items-center gap-1'>
                    {Array.from({ length: selectedCube.rarity }).map((_, i) => (
                      <Star
                        key={i}
                        className='w-4 h-4 text-yellow-400 fill-current'
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className='mb-6'>
                <p className='text-slate-300 text-center italic'>
                  &quot;{selectedCube.description}&quot;
                </p>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCube(null)}
                className='w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl'
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

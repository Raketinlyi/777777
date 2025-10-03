'use client';

import { motion } from 'framer-motion';
import { Hammer, Wrench, HardHat, Construction } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';

export function UnderConstruction() {
  const isMobile = useMobile();

  // Select a random cube for display
  const cubeImages = [
    '/images/cube1.png', // Blue sad cube with pizza
    '/images/cube2.png', // Purple cowboy cube
    '/images/cube3.png', // Green cool cube
  ];

  const randomCubeImage =
    cubeImages[Math.floor(Math.random() * cubeImages.length)];

  // Fun phrases from the cube
  const phrases = [
    "I'm working here! Don't disturb!",
    "Everything will be ready soon, but for now I'm wearing a hard hat!",
    'Renovation is in full swing!',
    'Cube is at the construction site, come back later!',
    'It will be beautiful here, I promise!',
    "Oh, you're early! We haven't finished yet!",
    'Cube builds, cube paints, cube is tired...',
  ];

  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

  return (
    <div className='min-h-[80vh] flex flex-col items-center justify-center p-4'>
      <div className='mb-6 w-20 h-20 relative'>
        <Image
          src='/images/cra-token.png'
          alt='CrazyCube Logo'
          width={80}
          height={80}
          className='object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
        />
      </div>

      <div className='relative'>
        {/* Animated tools around the cube */}
        <motion.div
          className='absolute -top-8 -right-8'
          animate={{ rotate: [0, 20, 0, -20, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <Hammer className='h-8 w-8 text-yellow-400' />
        </motion.div>

        <motion.div
          className='absolute -bottom-8 -left-8'
          animate={{ rotate: [0, -20, 0, 20, 0] }}
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
        >
          <Wrench className='h-8 w-8 text-blue-400' />
        </motion.div>

        {/* Cube with construction hat */}
        <motion.div
          className='relative'
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          {/* Construction hat */}
          <motion.div
            className='absolute -top-10 left-1/2 transform -translate-x-1/2 z-10'
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            <HardHat className='h-12 w-12 text-yellow-500' />
          </motion.div>

          {/* Cube */}
          <div className={`${isMobile ? 'w-40 h-40' : 'w-64 h-64'} relative`}>
            <Image
              src={randomCubeImage || '/placeholder.svg'}
              alt='Construction Cube'
              width={300}
              height={300}
              className='object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]'
            />
          </div>
        </motion.div>
      </div>

      {/* "Under Construction" sign */}
      <motion.div
        className='mt-8 bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4 max-w-md relative overflow-hidden'
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
      >
        {/* Striped ribbon */}
        <div className='absolute -right-16 -top-16 w-32 h-32 bg-yellow-500 rotate-45 z-0' />
        <div className='absolute -left-16 -bottom-16 w-32 h-32 bg-yellow-500 rotate-45 z-0' />

        <div className='relative z-10'>
          <div className='flex items-center justify-center mb-2'>
            <Construction className='h-6 w-6 text-yellow-500 mr-2' />
            <h2 className='text-2xl font-bold text-yellow-300'>
              UNDER CONSTRUCTION
            </h2>
            <Construction className='h-6 w-6 text-yellow-500 ml-2' />
          </div>

          <p className='text-center text-white mb-4'>
            This section is currently under development. There will be a lot of
            interesting content here soon!
          </p>

          <motion.div
            className='bg-black/30 p-3 rounded-lg mb-4 text-center'
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <p className='text-yellow-300 font-medium'>
              &quot;{randomPhrase}&quot;
            </p>
          </motion.div>
        </div>
      </motion.div>

      <Link href='/' className='mt-8'>
        <Button className='bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'>
          Home
        </Button>
      </Link>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Zap, Dna, Microscope, Atom, FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BreedingEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function BreedingEffect({ isActive, onComplete }: BreedingEffectProps) {
  // Scientific synthesis sequence: /images/d1.png … /images/d5.png
  const stages = [
    '/images/d1.png',
    '/images/d2.png', 
    '/images/d3.png',
    '/images/d4.png',
    '/images/d5.png',
  ];
  const [stageIdx, setStageIdx] = useState(0);

  // Start synthesis sequence when effect is activated
  useEffect(() => {
    if (!isActive) return;
    setStageIdx(0);
    const id = setInterval(() => {
      setStageIdx(i => {
        if (i >= stages.length - 1) {
          clearInterval(id);
          if (onComplete) setTimeout(onComplete, 500); // analysis complete pause
          return i;
        }
        return i + 1;
      });
    }, 500); // genetic mutation phases ≈2.5s total
    return () => clearInterval(id);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/95 backdrop-blur-sm'
    >
      {/* Scientific grid overlay */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute inset-0' style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className='relative flex flex-col items-center justify-center space-y-6'>
        {/* Central genetic synthesis chamber */}
        <div className='relative'>
          {/* Containment field */}
          <div className='absolute -inset-8 border-2 border-cyan-400/50 rounded-full animate-pulse' />
          <div className='absolute -inset-12 border border-dashed border-blue-400/30 rounded-full animate-spin' style={{
            animation: 'spin 8s linear infinite'
          }} />
          
          {/* Specimen evolution display */}
          <motion.img
            key={stageIdx}
            src={stages[stageIdx]}
            alt='Genetic Synthesis in Progress'
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            className='w-48 h-48 object-contain rounded-lg shadow-lg border-2 border-cyan-400/60 bg-slate-900/80 backdrop-blur-sm'
            style={{
              filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))'
            }}
          />
          
          {/* Energy core behind specimen */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1, 1.4, 0] }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
            className='absolute inset-0 w-48 h-48 bg-gradient-radial from-cyan-500/70 via-blue-600/50 to-transparent rounded-full'
          />
        </div>

        {/* DNA strands and genetic particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 200],
              y: [0, -100 - Math.random() * 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
              repeat: 2,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
          >
            <Dna
              className={`w-6 h-6 text-cyan-400`}
              style={{
                filter: `hue-rotate(${Math.random() * 60}deg) drop-shadow(0 0 6px currentColor)`,
              }}
            />
          </motion.div>
        ))}

        {/* Energy discharges and electrical effects */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`energy-${i}`}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 300],
              y: [0, -150 - Math.random() * 150],
              opacity: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              delay: Math.random() * 1,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
          >
            <Zap className='w-4 h-4 text-yellow-400' style={{
              filter: 'drop-shadow(0 0 4px currentColor)'
            }} />
          </motion.div>
        ))}

        {/* Atomic particles and molecular structures */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`atom-${i}`}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 250],
              y: [0, -120 - Math.random() * 120],
              opacity: [0, 1, 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.8,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
          >
            <Atom className='w-3 h-3 text-green-300' style={{
              filter: 'drop-shadow(0 0 3px currentColor)'
            }} />
          </motion.div>
        ))}

        {/* Scientific analysis readout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
          transition={{ duration: 3, times: [0, 0.3, 0.7, 1] }}
          className='text-center'
        >
          <h3 className='text-2xl font-bold text-cyan-400 mb-2 flex items-center justify-center gap-3'>
            <FlaskConical className='w-8 h-8' />
            ⚡ GENETIC SYNTHESIS IN PROGRESS ⚡
            <Microscope className='w-8 h-8' />
          </h3>
          <p className='text-cyan-200 font-mono text-lg'>
            Combining DNA sequences... Generating new specimen!
          </p>
          <div className='flex items-center justify-center gap-2 mt-2 text-sm text-cyan-300'>
            <div className='w-2 h-2 bg-cyan-400 rounded-full animate-ping' />
            <span>Synthesis Progress: {Math.min(100, (stageIdx + 1) * 20)}%</span>
            <div className='w-2 h-2 bg-cyan-400 rounded-full animate-ping' />
          </div>
        </motion.div>
      </div>

      {/* Scientific background energy fields */}
      <div className='absolute inset-0 pointer-events-none'>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`energy-field-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0, 2, 4],
            }}
            transition={{
              duration: 4,
              delay: Math.random() * 2,
              ease: 'easeOut',
            }}
            className='absolute rounded-full w-64 h-64'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${[
                'rgba(6, 182, 212, 0.3)',
                'rgba(16, 185, 129, 0.3)', 
                'rgba(59, 130, 246, 0.3)',
                'rgba(139, 92, 246, 0.3)'
              ][i % 4]}, transparent)`
            }}
          />
        ))}
      </div>

      {/* Floating scientific elements background */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`floating-science-${i}`}
          initial={{
            opacity: 0,
            y: '100vh',
            x: `${Math.random() * 100}vw`,
          }}
          animate={{
            opacity: [0, 0.7, 0],
            y: '-10vh',
            x: `${Math.random() * 100}vw`,
          }}
          transition={{
            duration: 6,
            delay: Math.random() * 3,
            ease: 'linear',
          }}
          className='absolute pointer-events-none'
        >
          {[Dna, Atom, FlaskConical, Microscope][i % 4] === Dna && <Dna className='w-8 h-8 text-cyan-300/50' />}
          {[Dna, Atom, FlaskConical, Microscope][i % 4] === Atom && <Atom className='w-8 h-8 text-green-300/50' />}
          {[Dna, Atom, FlaskConical, Microscope][i % 4] === FlaskConical && <FlaskConical className='w-8 h-8 text-blue-300/50' />}
          {[Dna, Atom, FlaskConical, Microscope][i % 4] === Microscope && <Microscope className='w-8 h-8 text-purple-300/50' />}
        </motion.div>
      ))}
    </motion.div>
  );
}

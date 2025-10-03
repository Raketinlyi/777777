'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, LineChart, Activity } from 'lucide-react';

interface StatsAnimationProps {
  className?: string;
}

export function StatsAnimation({ className = '' }: StatsAnimationProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine if we're on mobile for responsive adjustments
  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  if (!isClient) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    >
      {/* Floating chart icons - reduced quantity */}
      {Array.from({ length: isMobile ? 10 : 15 }).map((_, i) => (
        <motion.div
          key={i}
          className='absolute'
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            color: `hsl(${240 + Math.random() * 60}, 70%, 60%)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            scale: [0, 1, 0],
            y: [0, -50],
            rotate: [0, Math.random() * 360],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 10,
            repeatDelay: Math.random() * 5,
          }}
        >
          {i % 4 === 0 ? (
            <BarChart3 size={20 + Math.random() * 20} />
          ) : i % 4 === 1 ? (
            <PieChart size={20 + Math.random() * 20} />
          ) : i % 4 === 2 ? (
            <LineChart size={20 + Math.random() * 20} />
          ) : (
            <Activity size={20 + Math.random() * 20} />
          )}
        </motion.div>
      ))}

      {/* Floating numbers - reduced quantity */}
      {Array.from({ length: isMobile ? 15 : 20 }).map((_, i) => (
        <motion.div
          key={`num-${i}`}
          className='absolute font-mono text-xs font-bold'
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            color: `hsl(${240 + Math.random() * 60}, 70%, 60%)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.9, 0],
            scale: [0, 1, 0],
            y: [0, -30],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 10,
            repeatDelay: Math.random() * 3,
          }}
        >
          {Math.floor(Math.random() * 1000)}
        </motion.div>
      ))}

      {/* Bar chart animation - simplified */}
      <motion.div
        className='absolute left-[10%] bottom-[20%] flex items-end gap-1'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {Array.from({ length: isMobile ? 5 : 8 }).map((_, i) => (
          <motion.div
            key={`bar-${i}`}
            className='w-3 bg-indigo-500 rounded-t'
            initial={{ height: 0 }}
            animate={{ height: [0, 20 + Math.random() * 40, 0] }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.2,
              repeatDelay: 1,
            }}
          />
        ))}
      </motion.div>

      {/* Line chart animation - simplified */}
      <motion.div
        className='absolute right-[10%] bottom-[30%]'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <svg width='100' height='50' viewBox='0 0 100 50'>
          <motion.path
            d='M0,25 Q25,50 50,25 T100,25'
            stroke='rgba(129, 140, 248, 0.8)'
            strokeWidth='3'
            fill='none'
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'loop',
              repeatDelay: 1,
            }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

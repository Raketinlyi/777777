'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface PurpleBackgroundProps {
  className?: string;
}

export function PurpleBackground({ className = '' }: PurpleBackgroundProps) {
  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`} style={{ zIndex: -1 }}>
      {/* Основной фиолетовый градиент */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900" />
      
      {/* Динамические фиолетовые орбы */}
      {Array.from({ length: 6 }, (_, i) => {
        const size = 200 + Math.random() * 400;
        const delay = Math.random() * 10;
        const duration = 15 + Math.random() * 10;
        
        return (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full opacity-30 mix-blend-soft-light"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background: `radial-gradient(circle, 
                rgba(147, 51, 234, 0.4) 0%, 
                rgba(124, 58, 237, 0.3) 30%, 
                rgba(139, 92, 246, 0.2) 60%, 
                transparent 100%)`,
              filter: 'blur(40px)',
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight
              ],
              scale: [1, 1.2, 0.8, 1],
              opacity: [0.3, 0.6, 0.4, 0.3],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
      
      {/* Фиолетовые звездочки */}
      {Array.from({ length: 30 }, (_, i) => {
        const delay = Math.random() * 5;
        const duration = 3 + Math.random() * 4;
        
        return (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: 'rgba(196, 181, 253, 0.8)',
              boxShadow: '0 0 6px rgba(196, 181, 253, 0.8)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
      
      {/* Волнообразные фиолетовые линии */}
      {Array.from({ length: 4 }, (_, i) => {
        const delay = i * 2;
        
        return (
          <motion.div
            key={`wave-${i}`}
            className="absolute left-0 right-0 h-px opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.6), transparent)',
              top: `${20 + i * 20}%`,
            }}
            animate={{
              x: ['-100%', '100%'],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 8,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
      })}
      
      {/* Пульсирующее свечение по краям */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at top left, rgba(124, 58, 237, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.3) 0%, transparent 50%)
          `,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Тонкая фиолетовая сетка */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Центральное мягкое свечение */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export default PurpleBackground;
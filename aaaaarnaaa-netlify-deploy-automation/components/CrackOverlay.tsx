'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';

interface CrackOverlayProps {
  show: boolean;
}

type CSSDimension = number | string;

interface CrackConfig {
  width: CSSDimension;
  height: CSSDimension;
  left?: CSSDimension;
  right?: CSSDimension;
  top?: CSSDimension;
  bottom?: CSSDimension;
  rotate: number;
  opacity: number;
  delay: number;
  duration: number;
  gradient: string;
  isHorizontal?: boolean;
  translateX?: number;
  originTop?: boolean;
}

const toCssDimension = (value?: CSSDimension) => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

// Оптимизированный компонент трещин с мемоизацией
const CrackOverlay = memo(({ show }: CrackOverlayProps) => {
  if (!show) return null;

  // Конфигурация трещин (вынесена из рендера)
  const cracks: CrackConfig[] = [
    // Главные вертикальные трещины
    { width: 2, height: '100%', left: '50%', bottom: 0, rotate: 0, opacity: 0.8, delay: 0, duration: 1.5, gradient: 'to top' },
    { width: 1, height: '90%', left: '50%', bottom: 0, rotate: 0, opacity: 0.7, delay: 0.2, duration: 1.7, gradient: 'to top', translateX: 4 },
    { width: 2, height: '80%', right: '33%', bottom: 0, rotate: 0, opacity: 0.6, delay: 0.4, duration: 1.8, gradient: 'to top' },
    
    // Диагональные трещины
    { width: 3, height: '85%', left: '25%', bottom: 0, rotate: 25, opacity: 0.6, delay: 0.3, duration: 1.8, gradient: '25deg' },
    { width: 1.5, height: '70%', left: '20%', bottom: 0, rotate: 35, opacity: 0.5, delay: 0.5, duration: 1.6, gradient: '35deg' },
    { width: 2.5, height: '75%', right: '25%', bottom: 0, rotate: -25, opacity: 0.6, delay: 0.6, duration: 2, gradient: '-25deg' },
    { width: 1, height: '65%', right: '20%', bottom: 0, rotate: -40, opacity: 0.4, delay: 0.8, duration: 1.8, gradient: '-40deg' },
    
    // Горизонтальные трещины
    { height: 2, width: '45%', left: 0, bottom: '33%', rotate: 0, opacity: 0.5, delay: 0.9, duration: 1.2, gradient: 'to right', isHorizontal: true },
    { height: 1.5, width: '35%', left: 0, bottom: '40%', rotate: 0, opacity: 0.4, delay: 1.0, duration: 1.4, gradient: 'to right', isHorizontal: true },
    { height: 2.5, width: '35%', right: 0, bottom: '25%', rotate: 0, opacity: 0.5, delay: 1.1, duration: 1.4, gradient: 'to left', isHorizontal: true },
    { height: 1, width: '25%', right: 0, bottom: '20%', rotate: 0, opacity: 0.3, delay: 1.3, duration: 1.2, gradient: 'to left', isHorizontal: true },
    
    // Ответвления
    { width: 2, height: '25%', left: '50%', bottom: '66%', rotate: -35, opacity: 0.4, delay: 1.2, duration: 1, gradient: '-35deg' },
    { width: 1.5, height: '20%', left: '50%', bottom: '50%', rotate: 40, opacity: 0.35, delay: 1.3, duration: 0.8, gradient: '40deg' },
    { width: 1, height: '15%', left: '50%', bottom: '75%', rotate: -50, opacity: 0.3, delay: 1.4, duration: 0.6, gradient: '-50deg' },
    
    // Угловые трещины
    { width: 2.5, height: '40%', left: 0, bottom: 0, rotate: 15, opacity: 0.45, delay: 1.5, duration: 1.6, gradient: '15deg' },
    { width: 1.5, height: '30%', left: 2, bottom: 0, rotate: 25, opacity: 0.35, delay: 1.6, duration: 1.3, gradient: '25deg' },
    { width: 2, height: '35%', right: 0, bottom: 0, rotate: -20, opacity: 0.4, delay: 1.7, duration: 1.4, gradient: '-20deg' },
    
    // Дополнительные детали
    { width: 1, height: '15%', left: '40%', bottom: '66%', rotate: -60, opacity: 0.3, delay: 1.7, duration: 0.6, gradient: '-60deg' },
    { width: 4, height: '95%', left: '40%', bottom: 0, rotate: 0, opacity: 0.7, delay: 0.1, duration: 2.2, gradient: 'to top' },
    { height: 3, width: '60%', left: '25%', bottom: '50%', rotate: 0, opacity: 0.4, delay: 1.8, duration: 1.3, gradient: 'to right', isHorizontal: true },
    { height: 2.5, width: '40%', left: 0, bottom: '60%', rotate: 0, opacity: 0.45, delay: 1.9, duration: 1.5, gradient: 'to right', isHorizontal: true },
    { width: 1.5, height: '30%', left: 0, top: '25%', rotate: 45, opacity: 0.35, delay: 2.0, duration: 1.2, gradient: '45deg', originTop: true },
    { width: 1, height: '12%', left: '75%', bottom: '16%', rotate: -30, opacity: 0.25, delay: 2.1, duration: 0.5, gradient: '-30deg' },
    { width: 1, height: '18%', right: '16%', bottom: '33%', rotate: 60, opacity: 0.28, delay: 2.2, duration: 0.7, gradient: '60deg' },
  ];

  return (
    <div className='fixed inset-0 pointer-events-none z-0 overflow-hidden'>
      {cracks.map((crack, index) => (
        <motion.div
          key={`crack-${index}`}
          className={`absolute ${crack.originTop ? 'origin-top' : 'origin-bottom'}`}
          style={{
            width: toCssDimension(crack.width),
            height: toCssDimension(crack.height),
            left: toCssDimension(crack.left),
            right: toCssDimension(crack.right),
            bottom: toCssDimension(crack.bottom),
            top: toCssDimension(crack.top),
            background: `linear-gradient(${crack.gradient}, rgba(255,255,255,${crack.opacity * 0.6}) 0%, rgba(255,255,255,${crack.opacity * 0.15}) 100%)`,
            boxShadow: `0 0 ${typeof crack.width === 'number' ? crack.width * 3 : 6}px rgba(255,255,255,${crack.opacity * 0.4})`,
            mixBlendMode: 'overlay',
            filter: 'blur(0.5px)',
            transform: crack.translateX ? `translateX(${crack.translateX}px)` : undefined,
            willChange: 'height, width, opacity', // GPU acceleration
          }}
          initial={{ 
            [crack.isHorizontal ? 'width' : 'height']: 0, 
            opacity: 0,
            rotate: crack.rotate 
          }}
          animate={{ 
            [crack.isHorizontal ? 'width' : 'height']: crack.isHorizontal ? crack.width : crack.height,
            opacity: crack.opacity 
          }}
          transition={{ 
            duration: crack.duration, 
            delay: crack.delay,
            ease: [0.34, 1.56, 0.64, 1] // Custom easing
          }}
        />
      ))}
    </div>
  );
});

CrackOverlay.displayName = 'CrackOverlay';

export default CrackOverlay;

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Variants, TargetAndTransition } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Russo_One } from 'next/font/google';

const russo = Russo_One({ subsets: ['latin', 'cyrillic'], weight: '400' });

interface NewCubeIntroProps {
  height?: number;
  leftSrcs?: string[];
  rightSrcs?: string[];
  oldSrcs?: string[];
};

// Теперь 6 кубов для большего разнообразия
const monSet = ['/images/mon1.png', '/images/mon2.png', '/images/mon3.png', '/images/mon4.png', '/images/mon5.png', '/images/mon6.png'];
const cubeSet = ['/images/cube2.png', '/images/cube3.png', '/images/cube4.png', '/images/cube5.png', '/images/cube6.png', '/images/cube7.png', '/images/cube8.png', '/images/cube1.png'];
const defaultLeft = monSet;
const defaultRight = monSet;
const defaultOld = cubeSet;

// Добавляем новые наборы изображений для более объемного эффекта
const enhancedCubeSet = [
  '/images/cube1.png', 
  '/images/cube2.png', 
  '/images/cube3.png', 
  '/images/cube4.png', 
  '/images/cube5.png', 
  '/images/cube6.png', 
  '/images/cube7.png', 
  '/images/cube8.png'
];

export function NewCubeIntro({
  height = 560,
  leftSrcs = defaultLeft,
  rightSrcs = defaultRight,
  oldSrcs = defaultOld,
}: NewCubeIntroProps) {
  const [phase, setPhase] = React.useState<'intro' | 'confrontation' | 'takeover' | 'settled' | 'dance'>('intro');
  const [musicOn, setMusicOn] = React.useState(false);
  const [titlePulse, setTitlePulse] = React.useState(true);
  const [shelfTilt, setShelfTilt] = React.useState(0); // Локальное состояние для перекоса
  const { t } = useTranslation();
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const beatTimerRef = React.useRef<number | null>(null);
  
  // Отслеживаем изменения shelfTilt из window
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__shelfTilt !== undefined) {
        setShelfTilt((window as any).__shelfTilt);
      }
    }, 100); // Проверяем каждые 100мс
    
    return () => clearInterval(interval);
  }, []);

  // Определяем мобильный режим по высоте
  const isMobile = height < 300; // Увеличили порог для квадратной версии
  
  // Адаптивные размеры для мобильных устройств (значения используем напрямую в классах)

  // Note: This is a simple procedural beat generator. Creating a full techno-pop remix
  // is a creative task beyond the current capabilities and would require dedicated music production tools.
  const startMusic = React.useCallback(() => {
    try {
      if (audioCtxRef.current) return;
      const AC = (
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      );
      if (!AC) return;
      const ctx = new AC();
      audioCtxRef.current = ctx;

      const scheduleKick = () => {
        if (!audioCtxRef.current) return;
        const t = audioCtxRef.current.currentTime + 0.02;
        const o = audioCtxRef.current.createOscillator();
        const g = audioCtxRef.current.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        g.gain.setValueAtTime(0.6, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.connect(g).connect(audioCtxRef.current.destination);
        o.start(t);
        o.stop(t + 0.18);
      };

      const scheduleHat = () => {
        if (!audioCtxRef.current) return;
        const t = audioCtxRef.current.currentTime + 0.02;
        const o = audioCtxRef.current.createOscillator();
        const g = audioCtxRef.current.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(8000, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        o.connect(g).connect(audioCtxRef.current.destination);
        o.start(t);
        o.stop(t + 0.06);
      };

      beatTimerRef.current = window.setInterval(() => {
        scheduleKick();
        setTimeout(scheduleHat, 250);
      }, 500);
    } catch {} // Added missing closing brace for try block
  }, []);

  const stopMusic = React.useCallback(() => {
    if (beatTimerRef.current) {
      clearInterval(beatTimerRef.current);
      beatTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (musicOn) startMusic(); else stopMusic();
    return () => stopMusic();
  }, [musicOn, startMusic, stopMusic]);

  // Когда переходим к новым кубам (settled/dance), даём заголовку 5 секунд «постоять» до пульсации
  React.useEffect(() => {
    let id: number | undefined;
    if (phase === 'settled' || phase === 'dance') {
      setTitlePulse(false);
      id = window.setTimeout(() => setTitlePulse(true), 5000);
    } else {
      setTitlePulse(true);
    }
    return () => { if (id) clearTimeout(id); };
  }, [phase]);

  const sceneRef = React.useRef<HTMLDivElement | null>(null);
  const [sceneSize, setSceneSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('confrontation'), 2500),
      setTimeout(() => setPhase('takeover'), 4500),
      setTimeout(() => {
        setPhase('settled');
  // Notify header to switch brand after new cubes settle
  try { 
    window.dispatchEvent(new Event('crazycube:brand-switch')); 
    // Also dispatch event for cracks after 2 seconds
    setTimeout(() => {
      window.dispatchEvent(new Event('crazyoctagon:appeared'));
    }, 2000);
  } catch {}
      }, 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  React.useEffect(() => {
    const el = sceneRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSceneSize({ w: cr.width, h: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Улучшенная анимация диалогов для паники
  const dialogContainerVariants: Variants = {
    hidden: { opacity: 0, y: -5, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        delay: 0.25 + (i % 4) * 0.08,
      },
    }),
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.8,
      transition: { duration: 0.15 },
    },
  };

  // Более выраженная "дрожь" для паники
  const dialogTextVariants: Variants = {
    shake: {
      x: [0, -3, 3, -2.5, 2.5, -1.5, 1.5, 0],
      rotate: [0, 2.5, -2.5, 3.5, -3.5, 2, -2, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.8 },
    },
    calm: {
      x: 0, 
      rotate: 0,
      // Добавляем пульсацию для текста
      scale: [1, 1.05, 1],
      transition: { 
        scale: { duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } 
      },
    },
  };

  const buildSources = (sources: string[], count: number): string[] =>
    Array.from({ length: count }, (_, i) => {
      const s = sources && sources.length > 0 ? sources[i % sources.length] : '/images/mon1.png';
      return s ?? '/images/mon1.png';
    });

  // Адаптивное количество кубиков - на мобиле ровно 4 старых и 4 новых
  const leftCount = isMobile ? 2 : 6;
  const rightCount = isMobile ? 2 : 5;
  const leftImages = buildSources(leftSrcs, leftCount);
  const rightImages = buildSources(rightSrcs, rightCount);
  const oldCubeImages = oldSrcs && oldSrcs.length ? oldSrcs : defaultOld;
  // Для мобильных ещё больше уменьшаем количество старых кубов
  const displayedOldCubeImages = isMobile 
    ? oldCubeImages.slice(0, 4)  // только 4 куба на мобильных
    : (oldCubeImages.length > 2 ? oldCubeImages.slice(1, -1) : oldCubeImages);

  const oldDialog: string[] = [
    t('cubeAnimation.oldDialog.0'),
    t('cubeAnimation.oldDialog.1'),
    t('cubeAnimation.oldDialog.2'),
    t('cubeAnimation.oldDialog.3'),
    t('cubeAnimation.oldDialog.4')
  ];

  // Реплики новых кубов для пузырей
  // Заглушка реплик удалена: теперь используем фиксированные фразы у краёв

  const newcomerCount = leftCount + rightCount;
  // Адаптивные размеры для мобильных
  const finalScaleHint = isMobile ? 0.8 : 2.0;
  const minEdgePad = isMobile ? 20 : 80 * finalScaleHint;
  const maxSpread = Math.max(0, sceneSize.w - 2 * minEdgePad);
  const lineSpacing = newcomerCount > 1
    ? Math.min(isMobile ? 20 : 36, Math.max(isMobile ? 12 : 26, maxSpread / (newcomerCount - 1)))
    : 0;
  const lineOffsets = Array.from({ length: newcomerCount }, (_, i) => (i - (newcomerCount - 1) / 2) * lineSpacing);

  // Функция для создания объемного эффекта куба
  const Cube3DEffect = ({ children, isActive = false }: { children: React.ReactNode; isActive?: boolean }) => (
    <div className={`relative ${isActive ? 'transform-gpu' : ''}`}>
      {/* Тень для объемного эффекта */}
      <div className="absolute inset-0 rounded-lg bg-black/20 blur-sm transform translate-x-1 translate-y-1 -z-10"></div>
      
      {/* Градиентный блик для объема */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-white/10 rounded-full blur-[2px]"></div>
      
      {/* Внутренняя тень для глубины */}
      <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]"></div>
      
      {children}
    </div>
  );

  return (
    <motion.div 
      ref={sceneRef}
      className="relative w-full overflow-hidden" 
      style={{ height, perspective: '1200px', transformStyle: 'preserve-3d' }}
    >
      {/* Большой анимированный заголовок: CrazyCube -> Monad Testnet */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 select-none pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {(() => {
          const isMonad = (phase === 'settled' || phase === 'dance');
          const titleText = isMonad ? 'Monad Testnet' : 'CrazyCube';
          const letters = titleText.split('');
          return (
            <motion.div
              key={titleText}
              className={`flex gap-[0.05em] items-center justify-center tracking-tight ${russo.className}`}
              style={{ perspective: '800px' }}
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { delayChildren: 0.2, staggerChildren: 0.08 }
                }
              }}
            >
              {letters.map((ch, idx) => {
                // Каждая буква перекашивается по-своему, как полки в шкафу
                const baseAlt = (idx % 2 === 0) ? -2.5 : 2.5; // базовый наклон для видимости
                const letterTilt = baseAlt + shelfTilt * (1.2 + Math.sin(idx * 0.7) * 0.6);
                const letterSkew = ((idx % 3) - 1) * 4 + shelfTilt * (0.8 + Math.cos(idx * 0.5) * 0.4);
                
                return (
                  <motion.span
                    key={`${ch}-${idx}`}
                    variants={{
                      hidden: { opacity: 0, rotateX: -90, y: -20, filter: 'blur(8px)' },
                      show: {
                        opacity: 1,
                        rotateX: 0,
                        y: 0,
                        filter: 'blur(0px)',
                        transition: { duration: 0.75, type: 'spring', stiffness: 260, damping: 18 }
                      }
                    }}
                    className="font-black inline-block"
                    style={{
                      fontSize: isMobile ? '23px' : 'clamp(47px, 8.8vw, 120px)',
                      lineHeight: 1,
                      background: isMonad ? 'linear-gradient(90deg, #f472b6, #a855f7, #06b6d4, #22d3ee, #ec4899, #f472b6)' : 'linear-gradient(90deg, #06b6d4, #22d3ee, #3b82f6, #1e90ff, #06b6d4)',
                      backgroundSize: '320% auto',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      textShadow: isMonad
                        ? isMobile 
                          ? '0 0 8px rgba(168,85,247,0.7), 0 0 16px rgba(139,92,246,0.5)'
                          : '0 0 18px rgba(255,255,255,0.55), 0 0 35px rgba(236,72,153,0.7), 0 0 65px rgba(168,85,247,0.85), 0 0 90px rgba(6,182,212,0.6)'
                        : isMobile
                          ? '0 0 6px rgba(168,85,247,0.6), 0 0 12px rgba(139,92,246,0.4)'
                          : '0 0 12px rgba(236,72,153,0.5), 0 0 28px rgba(168,85,247,0.6), 0 0 46px rgba(6,182,212,0.5)'
                    }}
                    animate={titlePulse && musicOn ? {
                      y: [-2, 2, -2],
                      scale: [1, 1.06, 1],
                      rotate: letterTilt, // Буква на��лоняется!
                      skewY: letterSkew, // И перекашивается!
                      backgroundPosition: ['0% 50%', '300% 50%', '0% 50%'],
                      filter: ['hue-rotate(0deg)', 'hue-rotate(24deg)', 'hue-rotate(-24deg)', 'hue-rotate(0deg)'],
                    } : {
                      rotate: letterTilt, // Буква наклоняется даже без музыки!
                      skewY: letterSkew, // И перекашивается!
                      backgroundPosition: ['0% 50%', '300% 50%', '0% 50%'],
                    }}
                    transition={{
                      y: { duration: 1.15, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.06 },
                      scale: { duration: 1.15, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.06 },
                      rotate: { duration: 2.5, ease: [0.34, 1.56, 0.64, 1] },
                      skewY: { duration: 2.5, ease: [0.34, 1.56, 0.64, 1] },
                      backgroundPosition: { duration: 8, repeat: Infinity, ease: 'linear' },
                      filter: { duration: 3.2, repeat: Infinity, ease: 'linear' }
                    }}
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </motion.span>
                );
              })}
            </motion.div>
          );
        })()}
        <motion.div
          className="mx-auto mt-2 h-1 rounded-full"
          style={{ width: '68%', background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)' }}
          animate={{ opacity: titlePulse && musicOn ? [0.35, 0.75, 0.35] : [0.2, 0.4, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
        />
      </motion.div>
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(24,24,27,0.9) 0%, rgba(17,24,39,0.88) 60%, rgba(24,24,27,0.9) 100%)'
        }} />
        <div className="absolute inset-0" style={{
          backgroundSize: '40px 40px',
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255, 0.06) 1px, transparent 1px)
          `,
          transform: 'translateY(60%) rotateX(75deg) scale(1.5)'
        }}/>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(60% 50% at 50% 55%, rgba(148,163,184,0.18) 0%, rgba(148,163,184,0.10) 45%, rgba(0,0,0,0) 70%)'
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'
        }} />
      </div>
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 bottom-10 w-3/4 h-12 rounded-full"
        style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 70%)' }}
        animate={{ scale: [1, 1.02, 1], opacity: [1, 0.9, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.08) 55%, rgba(0,0,0,0) 70%)' }}
        initial={{ opacity: 0 }}
        animate={(phase === 'settled' || phase === 'dance') ? { opacity: [0.4, 0.55, 0.4] } : { opacity: 0 }}
        transition={{ duration: 6, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
      />

      {/* Усиленная вечеринка: профессиональная светомузыка и спецэффекты */}
      {phase === 'dance' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Основные лучи - больше и ярче */}
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={`beam-${i}`}
              className="absolute top-0 left-1/2 origin-top"
              style={{ 
                width: 1 + (i % 4) * 2, 
                height: '180%', 
                background: `linear-gradient(to bottom, transparent 0%, hsla(${120 + i * 15},95%,70%,0.8) 30%, hsla(${180 + i * 20},90%,60%,0.6) 70%, transparent 100%)`,
                boxShadow: `0 0 20px hsla(${120 + i * 15},95%,70%,0.4)`
              }}
              initial={{ rotate: -90 + i * 7.5, x: -500 + i * 42, opacity: 0 }}
              animate={{
                rotate: [ -75 + i * 7.5, -60 + i * 7.5, -75 + i * 7.5 ],
                opacity: [0.3, 0.9, 0.3],
                filter: ['hue-rotate(0deg)', 'hue-rotate(120deg)', 'hue-rotate(-120deg)', 'hue-rotate(0deg)'],
                scaleY: [1, 1.3, 1]
              }}
              transition={{
                duration: 1.2 + (i % 3) * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (i % 8) * 0.15
              }}
            />
          ))}
          
          {/* Строб эффекты */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`strobe-${i}`}
              className="absolute"
              style={{
                left: `${10 + (i % 4) * 25}%`,
                top: `${15 + Math.floor(i / 4) * 30}%`,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: `radial-gradient(circle, hsla(${i * 30},100%,80%,1) 0%, hsla(${i * 30},100%,60%,0.4) 40%, transparent 70%)`,
                boxShadow: `0 0 30px hsla(${i * 30},100%,70%,0.8), 0 0 60px hsla(${i * 30},100%,50%,0.4)`
              }}
              animate={{
                scale: [0, 3, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: (i * 0.1) + Math.random() * 2,
                ease: 'easeOut'
              }}
            />
          ))}
          
          {/* Лазерная сетка */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`laser-h-${i}`}
              className="absolute left-0 right-0"
              style={{
                top: `${10 + i * 12}%`,
                height: '1px',
                background: `linear-gradient(90deg, transparent, hsla(${180 + i * 45},100%,60%,0.8), transparent)`,
                boxShadow: `0 0 10px hsla(${180 + i * 45},100%,60%,0.6)`
              }}
              animate={{
                opacity: [0, 0.8, 0],
                scaleX: [0.2, 1, 0.2]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut'
              }}
            />
          ))}
          
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`laser-v-${i}`}
              className="absolute top-0 bottom-0"
              style={{
                left: `${15 + i * 15}%`,
                width: '1px',
                background: `linear-gradient(to bottom, transparent, hsla(${240 + i * 30},100%,60%,0.6), transparent)`,
                boxShadow: `0 0 8px hsla(${240 + i * 30},100%,60%,0.4)`
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scaleY: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut'
              }}
            />
          ))}
          
          {/* Диско-шары эффект */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`disco-${i}`}
              className="absolute"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 3) * 25}%`,
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `conic-gradient(from ${i * 60}deg, 
                  hsla(${i * 60},100%,70%,0.4) 0deg,
                  hsla(${i * 60 + 120},100%,70%,0.6) 120deg,
                  hsla(${i * 60 + 240},100%,70%,0.4) 240deg,
                  hsla(${i * 60},100%,70%,0.4) 360deg)`,
                filter: 'blur(20px)'
              }}
              animate={{
                rotate: [0, 360],
                scale: [0.5, 1.2, 0.5],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ))}
          
          {/* Усиленная пульсирующая аура */}
          <motion.div
            className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[95%] h-40"
            style={{ 
              background: 'radial-gradient(60% 100% at 50% 100%, rgba(34,211,238,0.4) 0%, rgba(139,69,19,0.3) 30%, rgba(255,20,147,0.2) 60%, rgba(0,0,0,0) 100%)',
              filter: 'blur(15px)'
            }}
            animate={{ 
              opacity: [0.4, 0.9, 0.4], 
              scaleY: [1, 1.4, 1],
              scaleX: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
          />
          
          {/* Энергетические волны */}
          {[...Array(6)].map((_, j) => (
            <motion.div
              key={`energy-wave-${j}`}
              className="absolute left-0 right-0"
              style={{
                bottom: `${j * 8}px`,
                height: '2px',
                background: `linear-gradient(90deg, 
                  transparent, 
                  hsla(${j * 60},90%,60%,0.6) 20%, 
                  hsla(${j * 60 + 120},90%,70%,0.8) 50%, 
                  hsla(${j * 60 + 240},90%,60%,0.6) 80%, 
                  transparent)`,
                boxShadow: `0 0 15px hsla(${j * 60},90%,60%,0.5)`
              }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scaleX: [0.5, 1.2, 0.5]
              }}
              transition={{ 
                duration: 1.5 + j * 0.3, 
                repeat: Infinity, 
                ease: [0.42, 0, 0.58, 1], 
                delay: j * 0.2 
              }}
            />
          ))}
          
          {/* Частицы света */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: `hsla(${Math.random() * 360},100%,80%,0.9)`,
                boxShadow: `0 0 10px hsla(${Math.random() * 360},100%,70%,0.6)`
              }}
              animate={{
                x: [0, (Math.random() - 0.5) * 200],
                y: [0, (Math.random() - 0.5) * 200],
                opacity: [0, 1, 0],
                scale: [0, 2, 0]
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'easeOut'
              }}
            />
          ))}
          
          {/* Голографический центральный эффект */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: `conic-gradient(from 0deg,
                hsla(0,100%,70%,0.3) 0deg,
                hsla(60,100%,70%,0.4) 60deg,
                hsla(120,100%,70%,0.3) 120deg,
                hsla(180,100%,70%,0.4) 180deg,
                hsla(240,100%,70%,0.3) 240deg,
                hsla(300,100%,70%,0.4) 300deg,
                hsla(0,100%,70%,0.3) 360deg)`,
              filter: 'blur(30px)'
            }}
            animate={{
              rotate: [0, 360],
              scale: [0.8, 1.3, 0.8],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>
      )}

      {/* Старые кубики: кучка по центру и разбег */}
      {(phase !== 'settled' && phase !== 'dance') && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {displayedOldCubeImages.map((src, i) => {
              const total = displayedOldCubeImages.length;
              // Адаптивные размеры для квадратной мобильной версии
              const cubeWidth = isMobile ? 48 : 80;
              const gap = isMobile ? 30 : 60;
              const itemWidth = cubeWidth + gap;
              
              // Определяем позиции кубиков
              let clusterX: number;
              let clusterY: number;
              
              // Для мобильных устройств размещаем кубы по углам
              if (isMobile && total === 4) {
                // Размещаем по углам: левый верх, правый верх, левый низ, правый низ
                const cornerPositions = [
                  { x: -105, y: -40 }, // левый верхний угол (сдвинут влево на 1.5см больше)
                  { x: 15, y: -40 },   // правый верхний угол (сдвинут влево на 1.5см больше)  
                  { x: -105, y: 40 },  // левый нижний угол (сдвинут влево на 1.5см больше)
                  { x: 15, y: 40 }     // правый нижний угол (сдвинут влево на 1.5см больше)
                ];
                const pos = cornerPositions[i % cornerPositions.length] as { x: number; y: number };
                clusterX = pos.x;
                clusterY = pos.y;
              } else if (isMobile && total > 2) {
                const row = Math.floor(i / 2);
                const col = i % 2;
                clusterX = (col - 0.5) * (cubeWidth + gap/2);
                clusterY = (row - 0.5) * (cubeWidth + gap/2) - 20;
              } else {
                // Оригинальное расположение в линию
                const totalWidth = total * itemWidth;
                const startX = -totalWidth / 2 + cubeWidth / 2;
                clusterX = startX + i * itemWidth;
                clusterY = isMobile ? -30 : -50;
              }

              const margin = 64;
              const halfW = Math.max(240, sceneSize.w / 2 - margin);
              const halfH = Math.max(120, sceneSize.h / 2 - margin);
              const isLeft = i % 2 === 0;
              const xTargetOff = isLeft ? -halfW - 220 : halfW + 220;
              const colSize = Math.ceil(total / 2);
              const rowIndex = isLeft ? Math.floor(i / 2) : Math.floor((i - 1) / 2);
              const ySpread = 44;
              const yTarget = Math.max(-halfH, Math.min(halfH, (rowIndex - (colSize - 1) / 2) * ySpread));
              const departDelay = 0.08 * i;
              const midX = (clusterX + xTargetOff/2) / 2 + (isLeft ? -30 : 30);
              const midY = clusterY - (80 + rowIndex * 6);

              const animateByPhase = () => {
                if (phase === 'intro') {
                  // Добавлено "дыхание" и вращение для живости
                  return {
                    x: clusterX, y: clusterY, scale: 1.2, opacity: 1,
                    transition: {
                      scale: { duration: 2.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                      rotate: { duration: 8, repeat: Infinity, ease: 'linear' }
                    }
                  };
                }
                if (phase === 'confrontation') {
                  // Более нервное состояние
                  return {
                    x: clusterX,
                    y: clusterY - 12,
                    scale: 1.28,
                    opacity: 1,
                    transition: { duration: 0.3, repeat: 4, repeatType: 'mirror', ease: 'easeInOut' },
                  };
                }
                if (phase === 'takeover') {
                  // Более драматичный разбег с уменьшением
                  return {
                    x: [clusterX, midX, xTargetOff],
                    y: [clusterY, midY, yTarget],
                    opacity: [1, 1, 0],
                    scale: [1.26, 0.6, 0],
                    rotate: [0, 20, -20, 0],
                    transition: { duration: 2.2, delay: departDelay, ease: 'easeIn' },
                  };
                }
                return { opacity: 0 };
              };

              const panicText = [
                t('cubeAnimation.panicText.0'),
                t('cubeAnimation.panicText.1'),
                t('cubeAnimation.panicText.2'),
                t('cubeAnimation.panicText.3'),
                t('cubeAnimation.panicText.4')
              ];
              const labelText = phase === 'takeover' ? panicText[i % panicText.length] : oldDialog[i % oldDialog.length];
              const showLabel = phase === 'intro' || phase === 'takeover';

              return (
                <motion.div
                  key={`old-${i}`}
                  className="absolute"
                  initial={{ x: clusterX, y: clusterY, opacity: 1 }}
                  animate={animateByPhase() as TargetAndTransition}
                  // Унифицированная тень/аура с новыми кубами
                  style={{ filter: 'drop-shadow(0 0 14px rgba(168,85,247,0.35))', zIndex: 100 + Math.round(200 + clusterY) }}
                >
                  <div className={`relative ${isMobile ? 'w-20 h-20' : 'w-20 h-20 md:w-24 md:h-24'}`}>
                    <Image src={src} alt={`old-cube-${i + 1}`} fill className="object-contain" />
                    <AnimatePresence>
                      {showLabel && (() => {
                        // Clamp bubble horizontally near edges so it stays inside the scene
                        const edgePad = 140;
                        const nearLeft = clusterX < -halfW + edgePad;
                        const nearRight = clusterX > halfW - edgePad;
                        const bubblePosClass = isMobile
                          ? (i % 2 === 0 ? 'left-full ml-6' : 'right-full mr-6')
                          : nearLeft
                            ? 'left-0 translate-x-0 ml-2'
                            : nearRight
                              ? 'right-0 translate-x-0 mr-2'
                              : 'left-1/2 -translate-x-1/2';
                        const arrowPosClass = isMobile
                          ? 'left-1/2 -translate-x-1/2'
                          : nearLeft
                            ? 'left-3 -translate-x-0'
                            : nearRight
                              ? 'right-3'
                              : 'left-1/2 -translate-x-1/2';
                        return (
                          <motion.div
                            custom={i}
                            variants={dialogContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            // Пузыри старых кубов тоже сделаны непрозрачными
                            className={`absolute ${i % 2 === 0 ? '-top-20' : '-bottom-20'} ${bubblePosClass} max-w-[200px] ${isMobile ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] md:text-xs px-2.5 py-1.5'} text-rose-100 bg-gray-950/95 backdrop-blur-sm rounded-lg border border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,.35)] z-50`}
                          >
                            <motion.span
                              variants={dialogTextVariants}
                              animate={phase === 'takeover' ? 'shake' : 'calm'}
                              style={{ display: 'inline-block' }}
                            >
                              {labelText}
                            </motion.span>
                            <span className={`absolute ${arrowPosClass} block w-2 h-2 rotate-45 bg-gray-950/95 border-l border-t border-rose-400/60 ${i % 2 === 0 ? '-bottom-1' : '-top-1'} ${isMobile ? 'hidden' : ''}`} />
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-end gap-2">
          {[...leftImages, ...rightImages].map((src, i) => {
            const fromTop = i % 2 === 0;
            // Позиционирование новых кубов
            let xFinal: number, settleY: number;
            
            if (isMobile && newcomerCount === 4) {
              // На мобиле с 4 кубами располагаем по углам как старые
              const cornerPositions = [
                { x: -60, y: -40 }, // левый верхний угол
                { x: 60, y: -40 },  // правый верхний угол  
                { x: -60, y: 40 },  // левый нижний угол
                { x: 60, y: 40 }    // правый нижний угол
              ];
              const pos = cornerPositions[i % cornerPositions.length] as { x: number; y: number };
              xFinal = pos.x;
              settleY = pos.y;
            } else {
              // Оригинальная логика для десктопа
              const targetX = lineOffsets[i] ?? 0;
              const arcAmplitude = Math.min(120, Math.max(45, sceneSize.h * 0.18));
              const marginX = 92 * finalScaleHint;
              const safeX = targetX * (sceneSize.w > 0 ? Math.min(1, (sceneSize.w/2 - marginX) / (sceneSize.w/2)) : 1);
              const centerIndex = (newcomerCount - 1) / 2;
              const edgeT = newcomerCount > 1 ? Math.abs(i - centerIndex) / centerIndex : 0;
              const compress = 1 - 0.28 * Math.pow(edgeT, 0.9);
              const xBase = safeX * compress;
              const sign = xBase >= 0 ? -1 : 1;
              const xAdjust = sign * (18 + 14 * edgeT);
              xFinal = xBase + xAdjust;
              settleY = 96 + Math.round(Math.sin((i / Math.max(1, newcomerCount - 1)) * Math.PI) * arcAmplitude) - arcAmplitude / 2;
            }
            
            const scaleFinal = 1.55; // новые кубы на 55% больше когда встали (25% increase from 1.3)
            const offY = isMobile ? Math.max(80, sceneSize.h * 0.3) : Math.max(140, sceneSize.h * 0.35);
            const initialY = fromTop ? -offY : offY;
            const arriveDelay = 0.05 * i;
            const danceDuration = 2.2 + ((i % 4) * 0.15);

            const getInnerAnimation = () => {
              if (phase === 'dance') {
                // Очень медленный танец - в 4 раза медленнее оригинала
                const baseDelay = (i % 8) * 0.1;
                return {
                  x: [0, 4, 0, -4, 0, 3, 0, -3, 0],
                  y: [0, -11, 2, -8, 0, -10, 1, -6, 0],
                  rotateY: [0, -8, 0, 8, 0, -6, 0, 6, 0],
                  rotateX: [0, 6, 0, -6, 0, 5, 0, -5, 0],
                  rotateZ: [0, -4, 0, 4, 0, -3, 0, 3, 0],
                  scale: [1, 1.08, 0.98, 1.06, 1, 1.04, 0.99, 1.02, 1],
                  filter: [
                    'hue-rotate(0deg) saturate(1) brightness(1)',
                    `hue-rotate(${(i * 45) % 360}deg) saturate(1.2) brightness(1.1)`,
                    'hue-rotate(0deg) saturate(1) brightness(1)',
                    `hue-rotate(${(i * 90) % 360}deg) saturate(1.1) brightness(1.05)`,
                    'hue-rotate(0deg) saturate(1) brightness(1)'
                  ]
                };
              }
              if (phase === 'settled') {
                return {
                  y: [0, -10, 0],
                  rotateY: [0, 5, -5, 0]
                };
              }
              return { y: 0, rotateY: 0, rotateX: 0, scale: 1 };
            };

            return (
              <motion.div
                  key={`new-${i}`}
                  className={`relative ${isMobile ? 'w-20 h-20' : 'w-20 h-20 md:w-24 md:h-24'}`}
                  initial={{ opacity: 0, x: xFinal, y: initialY, scale: 0.5 }}
                  animate={
                    (phase === 'intro')
                      ? { opacity: 0, scale: 0.5 }
                      // Прибегают маленькие и растут до финального размера по пути
                      : {
                          opacity: 1,
                          x: xFinal - 10, // Shifted 3mm to the left
                          y: [initialY, (initialY + settleY) / 2, settleY],
                          scale: [0.5, 1.2, scaleFinal], // Более динамичный рост
                          transition: { duration: 1.7, delay: arriveDelay, times: [0, 0.7, 1] }
                        }
                  }
                  style={{ filter: 'drop-shadow(0 0 14px rgba(168,85,247,0.35))', zIndex: 200 + Math.round(200 + settleY) }}
                >
                  <motion.div
                    animate={getInnerAnimation()}
                    transition={{ 
                      duration: phase === 'dance' ? 6.0 + ((i % 4) * 0.8) : danceDuration, 
                      repeat: Infinity, 
                      ease: phase === 'dance' ? 'easeInOut' : [0.42, 0, 0.58, 1],
                      delay: phase === 'dance' ? (i % 8) * 0.4 : 0
                    }}
                    className="relative w-full h-full"
                     style={{
                       filter: phase === 'dance' ? 
                         `drop-shadow(0 0 12px hsla(${(i * 60) % 360},60%,50%,0.4)) drop-shadow(0 0 24px hsla(${(i * 120) % 360},50%,40%,0.2))` : 
                         'none'
                     }}
                   >
                     <Image src={src} alt={`new-cube-${i + 1}`} fill className="object-contain" />
                  
                  {/* Речевые пузыри у новых — перераспределены к краям */}
                  {(() => {
                    // Индексы и распределение реплик по краям
                    // Отдаем реплики крайним кубам вместо центральных
                    const leftEdgeIdx = 0; // Самый левый
                    const rightEdgeIdx = newcomerCount - 1; // Самый правый
                    const leftSecondIdx = 1; // Второй слева
                    const rightSecondIdx = newcomerCount - 2; // Второй справа
                    const leftThirdIdx = 2; // Третий слева
                    const rightThirdIdx = newcomerCount - 3; // Третий справа

                    let labelText = '';
                    let shouldShow = false;

                    // Распределяем реплики только крайним кубам
                    if (i === leftEdgeIdx) {
                      labelText = t('cubeAnimation.newCubePhrases.turnOnMusic');
                      shouldShow = true;
                    } else if (i === rightEdgeIdx) {
                      labelText = t('cubeAnimation.newCubePhrases.wantToParty');
                      shouldShow = true;
                    } else if (i === leftSecondIdx && newcomerCount > 4) {
                      labelText = t('cubeAnimation.newCubePhrases.settingUpTestnet');
                      shouldShow = true;
                    } else if (i === rightSecondIdx && newcomerCount > 4) {
                      labelText = t('cubeAnimation.newCubePhrases.testnetLikeDraft');
                      shouldShow = true;
                    } else if (i === leftThirdIdx && newcomerCount > 6) {
                      labelText = t('cubeAnimation.newCubePhrases.settingUpWithLove');
                      shouldShow = true;
                    } else if (i === rightThirdIdx && newcomerCount > 6) {
                      labelText = t('cubeAnimation.newCubePhrases.testnetBugsFeatures');
                      shouldShow = true;
                    }

                    // Показываем только если это фаза takeover или settled И куб имеет реплику
                    const show = (phase === 'takeover' || phase === 'settled') && shouldShow;
                    // Clamp bubble horizontally near edges so it stays inside the scene
                    const edgePad = 140; // px threshold from scene edge
                    const effX = xFinal;
                    const nearLeft = effX < -sceneSize.w / 2 + edgePad;
                    const nearRight = effX > sceneSize.w / 2 - edgePad;
                    const bubblePosClass = isMobile
                      ? (i % 2 === 0 ? 'left-full ml-6' : 'right-full mr-6')
                      : nearLeft
                        ? 'left-0 translate-x-0 ml-2'
                        : nearRight
                          ? 'right-0 translate-x-0 mr-2'
                          : 'left-1/2 -translate-x-1/2';
                    const arrowPosClass = isMobile
                      ? 'left-1/2 -translate-x-1/2'
                      : nearLeft
                        ? 'left-3 -translate-x-0'
                        : nearRight
                          ? 'right-3'
                          : 'left-1/2 -translate-x-1/2';
                    return show ? (
                      <AnimatePresence>
                        <motion.div
                          custom={i}
                          variants={dialogContainerVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className={`absolute ${i % 2 === 0 ? '-top-20' : '-bottom-20'} ${bubblePosClass} max-w-[200px] ${isMobile ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] md:text-xs px-2.5 py-1.5'} text-rose-100 bg-gray-950/95 backdrop-blur-sm rounded-lg border border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,.35)] z-50`}
                        >
                          <motion.span
                            variants={dialogTextVariants}
                            animate={'calm'}
                            style={{ display: 'inline-block' }}
                          >
                            {labelText}
                          </motion.span>
                          {!isMobile && <span className={`absolute ${arrowPosClass} block w-2 h-2 rotate-45 bg-gray-950/95 border-l border-t border-rose-400/60 ${i % 2 === 0 ? '-bottom-1' : '-top-1'}`} />}
                        </motion.div>
                      </AnimatePresence>
                    ) : null;
                  })()}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {(phase === 'settled' || phase === 'dance') && (
        <motion.div
          className={`absolute ${isMobile ? 'bottom-1' : 'bottom-6'} left-1/2 -translate-x-1/2 z-30`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.5 } }}
        >
          <Button
            onClick={() => { setMusicOn(v => !v); setPhase(p => (p === 'settled' && !musicOn) ? 'dance' : 'settled'); }}
            className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2'} rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,.25)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,.5)] hover:scale-105`}
          >
            {musicOn ? `⏸ ${t('cubeAnimation.musicOn', 'Пауза')}` : `▶ ${t('cubeAnimation.musicOff', 'Включить музыку')}`}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default NewCubeIntro;

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { TabNavigation } from '@/components/tab-navigation';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useMobile } from '@/hooks/use-mobile';
// import { usePerformanceContext } from '@/hooks/use-performance-context';
import dynamic from 'next/dynamic';

const BridgeAnimation = dynamic(() => import('@/components/bridge-animation'), {
  ssr: false,
});
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
// Removed unused select components
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { ArrowRightLeft, Zap, Shield, Clock, CheckCircle, AlertTriangle, Loader2, Coins, Globe, Lock, Unlock } from 'lucide-react';
import { ethers } from 'ethers';
import Image from 'next/image';

// --- Runtime ENV (must be defined as NEXT_PUBLIC_* in deployment) ---
const APE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_APE_CHAIN_ID || 33139);
const MONAD_CHAIN_ID = Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || 10143);
const APE_ADAPTER = process.env.NEXT_PUBLIC_APE_ADAPTER || '0x5375423481F78eD616DeC656381AC496CA129E25';
const MONAD_MIRROR = process.env.NEXT_PUBLIC_MONAD_MIRROR || '0x7D7F4BDd43292f9E7Aae44707a7EEEB5655ca465';
// NOTE: removed extra /http suffix in default RPC
const APE_RPC = process.env.NEXT_PUBLIC_APE_RPC || process.env.NEXT_PUBLIC_APE_RPC_HTTP || 'https://rpc.apechain.com';
const MONAD_RPC = process.env.NEXT_PUBLIC_MONAD_RPC || process.env.NEXT_PUBLIC_MONAD_RPC_HTTP || 'https://testnet-rpc.monad.xyz';
const APE_EXPLORER = process.env.NEXT_PUBLIC_APE_EXPLORER || 'https://explorer.apecoin.network';
const MONAD_EXPLORER = process.env.NEXT_PUBLIC_MONAD_EXPLORER || 'https://testnet.monadexplorer.com';

// Minimal ABIs (adapter & mirror) – extended for limits & user usage
const ADAPTER_ABI = [
  'function lockOnly(uint256 amountIn,uint256 minOutLD,address to) payable',
  'function getBridgeState() view returns(uint256 locked,uint256 min,uint16 bps,uint256 maxTx,uint256 maxDay,uint256 dailyUsed,bool paused,bool rateEnabled,bool perUserEnabled,bool slip,bool circuit)',
  'function getUnlockRateLimitState() view returns (bool enabled,uint256 maxDay,uint256 usedToday,uint256 dayIndex)',
  'function userDailyUsed(address) view returns(uint256)',
  'function userUnlockDailyUsed(address) view returns(uint256)',
  'function maxUserUnlockPerDay() view returns(uint256)',
  'function quoteLock(uint256) view returns(uint256)',
  'event LockCRAA(address indexed from,address indexed to,uint256 amountLD,bytes32 guid,uint64 nonce)'
];
const MIRROR_ABI = [
  'function burnToApe(uint256 amountLD,address to)',
  'function getMirrorState() view returns(uint256 total,uint256 capacity,bool paused,uint256 maxBurnPerDay,uint256 burnDailyUsed,uint256 maxUserBurnPerDay)',
  'function userBurnDailyUsed(address) view returns(uint256)',
  'event BurnCRAA(address indexed from,address indexed to,uint256 amountLD,bytes32 guid,uint64 nonce)'
];

// Unified network definitions (Ape ↔ Monad only)
const NETWORKS = {
  ape: { name: 'ApeChain', symbol: 'APE', color: 'from-blue-500 to-cyan-500', icon: '🦍', adapter: APE_ADAPTER },
  monad: { name: 'Monad', symbol: 'MON', color: 'from-purple-500 to-pink-500', icon: '🜍', mirror: MONAD_MIRROR }
} as const;

// Bridge status types
type BridgeStatus =
  | 'idle'
  | 'preparing'
  | 'processing'
  | 'confirming'
  | 'success'
  | 'error';
type NetworkDirection = 'ape-to-monad' | 'monad-to-ape';

// Bridge Status Component
const BridgeStatusIndicator = ({ status }: { status: BridgeStatus }) => {
  const statusConfig = {
    idle: {
      text: 'Ready to Bridge',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      icon: <Unlock className='w-4 h-4' />,
    },
    preparing: {
      text: 'Preparing Transaction',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      icon: <Loader2 className='w-4 h-4 animate-spin' />,
    },
    processing: {
      text: 'Processing Bridge',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      icon: <Loader2 className='w-4 h-4 animate-spin' />,
    },
    confirming: {
      text: 'Confirming on Destination',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      icon: <Loader2 className='w-4 h-4 animate-spin' />,
    },
    success: {
      text: 'Bridge Complete',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle className='w-4 h-4' />,
    },
    error: {
      text: 'Bridge Failed',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      icon: <AlertTriangle className='w-4 h-4' />,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${config.bgColor}`}
    >
      {config.icon}
      <span className={`font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
};

// Simple progress steps visualization
const ProgressSteps = ({ status }: { status: BridgeStatus }) => {
  const order: BridgeStatus[] = ['preparing','processing','confirming','success'];
  const activeIndex = order.indexOf(status as BridgeStatus);
  return (
    <div className='flex items-center justify-between w-full gap-2 select-none'>
      {order.map((s, i)=>{
        const reached = activeIndex >= i;
        const isActive = activeIndex === i;
        return (
          <div key={s} className='flex-1 flex flex-col items-center'>
            <motion.div layout className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold border ${reached? 'border-purple-400 bg-purple-500/30 text-white':'border-gray-600 text-gray-400'} ${isActive? 'shadow-[0_0_12px_-2px_#c084fc]' : ''}`}
              animate={isActive? { scale:[1,1.15,1], boxShadow:['0 0 0px #000','0 0 16px #c084fc','0 0 0px #000'] } : {}}
              transition={{ duration:1.6, repeat: isActive? Infinity:0 }}
            >{i+1}</motion.div>
            <span className='mt-1 text-[10px] uppercase tracking-wide text-center text-gray-400'>{s.replace('processing','proc').replace('confirming','conf')}</span>
          </div>
        );
      })}
    </div>
  );
};



// Confetti on success (light version)
const ConfettiBurst = ({ show }: { show: boolean }) => {
  if (!show) return null;
  const pieces = Array.from({ length: 18 });
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden z-20'>
      {pieces.map((_,i)=>{
        const delay = Math.random()*0.2;
        const duration = 1.2 + Math.random()*0.6;
        const xStart = (Math.random()*100);
        const xEnd = xStart + (Math.random()*20 - 10);
        const size = 6 + Math.random()*6;
        const colors = ['#f472b6','#c084fc','#818cf8','#22d3ee','#4ade80'];
        const color = colors[i % colors.length];
        return (
          <motion.span key={i}
            initial={{ opacity:0, y:0, x: xStart+'%' }}
            animate={{ opacity:[0,1,1,0], y: [0, -40 - Math.random()*40], x: xEnd+'%', rotate: 90+Math.random()*180 }}
            transition={{ duration, delay, ease:'easeOut' }}
            className='absolute rounded-sm'
            style={{ width: size, height: size, background: color }}
          />
        );
      })}
    </div>
  );
};

// Cinematic bridge animation (inline to avoid extra files)
const BridgeCinematic = ({ direction, status, className = '' }: { direction: NetworkDirection; status: BridgeStatus; className?: string }) => {
  const CUBE_IMAGES = {
    ape: ['/images/cube1.png','/images/cube2.png','/images/cube3.png','/images/cube4.png','/images/cube5.png','/images/cube6.png','/images/cube7.png','/images/cube8.png'],
    monad: ['/images/mon1.png','/images/mon2.png','/images/mon3.png','/images/mon4.png','/images/mon5.png','/images/mon6.png']
  } as const;
  const BANTER = {
    ape: [
      '🦍 Ape: Hand over the coins nicely!',
      '🦍 Ape: It won\'t hurt, I promise',
      '🦍 Ape: Our bridge is faster than your doubts',
      '🦍 Ape: Where would you go without us, buddy',
      '🦍 Ape: Minions, prepare the portals!',
      '🦍 Ape: Slippage is normal, rate is fair',
    ],
    monad: [
      '🜍 Monad: Hey, be careful!',
      '🜍 Monad: Those are my shiny tokens',
      '🜍 Monad: Transactions fly like lightning',
      '🜍 Monad: Have to admit, the bridge is not bad',
      '🜍 Monad: Minions, protect the treasury!',
      '🜍 Monad: Limits are normal, everything by the rules',
    ],
  } as const;
  const SUCCESS_LINES = [
    'Mission accomplished! Coin delivered.',
    'Bridge complete: CRAA arrived.',
    'Cube courier delivered cargo without losses!',
    'All good. Relayer nods approvingly.'
  ];
  const ERROR_LINES = [
    'Oops. Portal is complaining…',
    'Error! Network is acting up.',
    'Minions scattered, but we\'ll gather them.',
    'Something went wrong. Try again.'
  ];
  const VARIANTS = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    particles: 12 + (i % 6) * 3,
    coinSpin: 360 + (i % 5) * 120,
    portalStyle: i % 3,
    flareColor: ['#22d3ee', '#a78bfa', '#f472b6'][i % 3],
    glowColor: ['#22d3ee30', '#a78bfa30', '#f472b630'][i % 3],
  }));
  const [seed] = useState(()=>Math.random());
  const variant = useMemo(()=> VARIANTS[Math.floor(seed * VARIANTS.length)] || VARIANTS[0], [seed]);
  const [banterIndex, setBanterIndex] = useState(0);
  // Change banter interval to 10 seconds as requested and fix animation issues
  useEffect(()=>{ 
    if (status==='preparing' || status==='processing'){
      const id = setInterval(()=> setBanterIndex(i=>(i+1)%6), 10000); 
      return ()=>clearInterval(id);
    }
    return undefined;
  }, [status]);
  const leftToRight = direction==='ape-to-monad';
  const leftLabel = leftToRight? 'ApeChain':'Monad';
  const rightLabel = leftToRight? 'Monad':'ApeChain';
  const leftSet = leftToRight ? CUBE_IMAGES.ape : CUBE_IMAGES.monad;
  const rightSet = leftToRight ? CUBE_IMAGES.monad : CUBE_IMAGES.ape;
  const pick = (arr: readonly string[], offset = 0) => arr[((variant?.id || 0) + offset) % arr.length];
  const leftImg = pick(leftSet, 1);
  const rightImg = pick(rightSet, 2);
  const leftBanter = leftToRight? BANTER.ape : BANTER.monad;
  const rightBanter = leftToRight? BANTER.monad : BANTER.ape;
  const Ambient = ({ color = '#22d3ee', count = 8 }: { color?: string; count?: number }) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span key={i} className='absolute rounded-full' style={{ width: 2 + (i % 2), height: 2 + (i % 2), background: color, left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, opacity: 0.25 }} animate={{ x:[0,(Math.random()-0.5)*28], y:[0,(Math.random()-0.5)*28], opacity:[0.15,0.4,0.15] }} transition={{ duration: 5+Math.random()*5, repeat: Infinity, ease:'easeInOut' }} />
      ))}
    </>
  );
  const Minions = ({ count, around }: { count: number; around: 'left'|'right' }) => {
    const set = around==='left' ? leftSet : rightSet;
    const centerX = around==='left'? 14 : 86;
    const centerY = 50;
    const radius = 6; // small circle around portal
    return (
      <>
        {Array.from({ length: count }).map((_, i) => {
          const angle = (i / count) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * (radius * 0.6);
          return (
            <motion.div
              key={i}
              className='absolute'
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ scale: 0, rotate: 0, opacity: 0 }}
              animate={{ scale: [0.95, 1.05, 1.0], rotate: [0, 10, -10, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
            >
              <div className='relative w-6 h-6'>
                <Image src={set[i % set.length] || (around === 'left' ? '/images/cube1.png' : '/images/mon1.png')} alt='minion' fill sizes='24px' className='object-contain' />
              </div>
            </motion.div>
          );
        })}
      </>
    );
  };
  const Portal = ({ side, label, img, styleIndex, glowColor }: { side:'left'|'right'; label:string; img:string; styleIndex:number; glowColor:string }) => {
    // Shift left "planet" (portal) 1cm to the left as requested
    const xPos = side==='left'? 'calc(10% - 1cm)':'90%';
    const align = side==='left'? '-translate-x-1/2':'translate-x-1/2';
    return (
      <div className='absolute top-1/2 -translate-y-1/2' style={{ left: xPos }}>
        <div className={`relative ${side==='left'? '-ml-8':'ml-8'}`}>
          <motion.div className='absolute -inset-3 rounded-full' style={{ boxShadow: `0 0 20px ${glowColor}` }} animate={{ scale:[1,1.03,1], opacity:[0.5,0.75,0.5] }} transition={{ duration: 1.8, repeat: Infinity, ease:'easeInOut' }} />
          <motion.div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full ${styleIndex===0? 'bg-gradient-to-br from-purple-500/40 to-pink-500/40' : styleIndex===1? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30' : 'bg-gradient-to-br from-amber-400/30 to-orange-500/30'} border border-white/10 backdrop-blur-sm`} animate={{ rotate:[0,5,-5,0] }} transition={{ duration:4.2, repeat: Infinity, ease:'easeInOut' }}>
            <div className={`absolute ${side==='left'? 'right-1/2':'left-1/2'} ${align} top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10`}>
              <Image src={img} alt={`${label} Cube`} fill sizes='64px' className='object-contain' />
            </div>
          </motion.div>
          <div className='mt-2 text-[10px] md:text-xs text-center text-white/80 select-none'>{label}</div>
        </div>
      </div>
    );
  };
  const Courier = () => {
    // Determine which cube image to use based on direction and animation progress
    const getSourceCube = () => {
      if (leftToRight) {
        // Ape to Monad - use Ape cube images
        return pick(CUBE_IMAGES.ape, 3) || '/images/cube1.png';
      } else {
        // Monad to Ape - use Monad cube images
        return pick(CUBE_IMAGES.monad, 3) || '/images/mon1.png';
      }
    };
    
    // Animation variants for cube transformation with smoother movement and proper fade-out
    const cubeVariants = {
      start: { 
        x: leftToRight ? '24%' : '-24%', 
        y: 0, 
        rotate: 0,
        scale: 1,
        opacity: 1
      },
      midpoint: { 
        x: '0%', 
        y: -24, 
        rotate: 180,
        scale: 1.12,  // slightly increases in the center
        opacity: 1
      },
      end: { 
        x: leftToRight ? '-32%' : '32%', 
        y: 0, 
        rotate: 360,
        scale: 0.82,  // slightly smaller when entering the portal
        opacity: 0  // Fade out as it enters the portal
      }
    };

    return (
      <motion.div className='absolute inset-0 pointer-events-none' initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration: 0.3 }}>
        <motion.div 
          initial="start"
          animate={['start', 'midpoint', 'end']}
          variants={cubeVariants}
          transition={{ 
            duration: 4.2, 
            times: [0, 0.5, 1], // Define timing for keyframes
            repeat: Infinity, 
            repeatType: 'reverse', 
            ease: 'easeInOut' 
          }} 
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3'
        >
          <motion.div 
            className='relative w-8 h-8 md:w-10 md:h-10 rounded-full shadow' 
            style={{ background:'radial-gradient(circle at 30% 30%, #fde68a, #f59e0b)', boxShadow:'0 0 8px rgba(245, 158, 11, 0.4)' }} 
            animate={{ rotate:[0, variant?.coinSpin || 360] }} 
            transition={{ duration:3, repeat: Infinity, ease:'linear' }}
          >
            <span className='absolute inset-0 grid place-items-center text-[8px] font-bold text-black/80'>CRAA</span>
          </motion.div>
          <motion.div className='relative w-10 h-10 md:w-12 md:h-12'>
            <Image 
              src={getSourceCube()} 
              alt='Courier Cube' 
              fill 
              sizes='48px' 
              className='object-contain drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
            />
          </motion.div>
        </motion.div>
      </motion.div>
    );
  };
  const Fireworks = ({ color = '#22d3ee', count = 6 }: { color?: string; count?: number }) => (
    <div className='absolute inset-0 pointer-events-none'>
      {Array.from({ length: count }).map((_,i)=> (
        <motion.span key={i} className='absolute rounded-full' style={{ width:4, height:4, background: color, left:'50%', top:'50%' }} initial={{ x:0, y:0, opacity:1 }} animate={{ x:(Math.random()-0.5)*180, y:(Math.random()-0.5)*100, opacity:[1,0] }} transition={{ duration: 0.9+Math.random()*0.3, ease:'easeOut' }} />
      ))}
    </div>
  );

  // New rolling coin animation left to right/right to left
  const RollingCoin = ({ leftToRight }: { leftToRight: boolean }) => {
    const startX = leftToRight ? '14%' : '86%';
    const endX = leftToRight ? '86%' : '14%';
    return (
      <motion.div className='absolute inset-0 pointer-events-none z-10'>
        {/* Track (light dashed line) */}
        <div className='absolute left-[12%] right-[12%] top-1/2 -translate-y-1/2 h-px border-t border-dashed border-white/10' />
        {/* The coin itself */}
        <motion.div
          key={leftToRight ? 'ltr' : 'rtl'}
          initial={{ left: startX, y: 0, rotate: 0, scale: 1 }}
          animate={{
            left: endX,
            // light bouncing during movement
            y: [0, -2, 0, 2, 0],
            rotate: leftToRight ? [0, 360, 720] : [0, -360, -720],
            scale: [1, 1.02, 1]
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className='absolute top-1/2 -translate-y-1/2'
        >
          <div className='relative w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_6px_8px_rgba(245,158,11,0.3)]'>
            <Image src={'/images/coin-gold.png'} alt='CRAA coin' fill sizes='40px' className='object-contain' />
            {/* Glare */}
            <div className='absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent mix-blend-screen' />
            {/* Light glow */}
            <div className='absolute -inset-1 rounded-full' style={{ boxShadow: '0 0 14px rgba(245,158,11,0.35)' }} />
          </div>
          {/* Spark trail */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span
              key={i}
              className='absolute rounded-full'
              style={{ width: 3, height: 3, background: ['#f59e0b','#fde68a','#fb7185'][i%3], left: -6 - i * 6, top: 12 - (i%2)*3, opacity: 0.6 }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: [1, 0.6], opacity: [0.6, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2 + i*0.05 }}
            />
          ))}
        </motion.div>
      </motion.div>
    );
  };
  return (
    <div className={`relative w-full h-[22vh] md:h-[26vh] rounded-xl overflow-hidden ${className}`}>
      <div className='absolute inset-0'>
        <Ambient color={variant?.flareColor || '#22d3ee'} count={variant?.particles || 24} />
        <motion.div className='absolute inset-0' animate={{ background:[
          'radial-gradient(circle at 25% 60%, rgba(167,139,250,.15), transparent 60%)',
          'radial-gradient(circle at 75% 40%, rgba(244,114,182,.15), transparent 60%)',
          'radial-gradient(circle at 25% 60%, rgba(34,211,238,.15), transparent 60%)'
        ] }} transition={{ duration:10, repeat: Infinity, ease:'linear' }} />
      </div>
      <Portal side='left' label={leftLabel} img={leftImg || '/images/cube1.png'} styleIndex={variant?.portalStyle || 0} glowColor={variant?.glowColor || '#22d3ee40'} />
      <Portal side='right' label={rightLabel} img={rightImg || '/images/mon1.png'} styleIndex={(variant?.portalStyle || 0 + 1)%3} glowColor={variant?.glowColor || '#22d3ee40'} />
      <AnimatePresence>
        {(status==='preparing' || status==='processing') && (
          <>
            <motion.div key='left-banter' className='absolute' style={{ left:'14%', top:'28%' }} initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration: 0.5 }}>
              <div className='relative'>
                <div className='absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/90' />
                <div className='bg-white/90 text-black px-3 py-1.5 rounded-xl shadow-md text-xs font-medium whitespace-pre-line max-w-[220px] text-center'>
                  {leftBanter[banterIndex % leftBanter.length]}
                </div>
              </div>
            </motion.div>
            <motion.div key='right-banter' className='absolute' style={{ right:'14%', top:'62%' }} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }} transition={{ duration: 0.5 }}>
              <div className='relative'>
                <div className='absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/90' />
                <div className='bg-white/90 text-black px-3 py-1.5 rounded-xl shadow-md text-xs font-medium whitespace-pre-line max-w-[220px] text-center'>
                  {rightBanter[(banterIndex+1) % rightBanter.length]}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {status==='preparing' && (<motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration: 0.5 }}><Minions count={4} around='left' /><Minions count={4} around='right' /></motion.div>)}
        {status==='processing' && (<motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration: 0.5 }}><Minions count={3} around='left' /><Minions count={3} around='right' /></motion.div>)}
      </AnimatePresence>
      <AnimatePresence>
        {(status==='processing' || status==='confirming') && (
          <>
            {/* Rolling coin - main animation element */}
            <RollingCoin leftToRight={leftToRight} />
            {/* Courier remains, but in the background (less intrusive) */}
            <div className='absolute inset-0 opacity-60'>
              <Courier />
            </div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {status==='success' && (
          <motion.div className='absolute inset-0' initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration: 0.5 }}>
            {Array.from({ length: 5 }).map((_,i)=> (<Fireworks key={i} color={['#34d399','#60a5fa','#f472b6','#a78bfa','#f59e0b'][i%5] || '#34d399'} count={12+(i%3)*6} />))}
            <motion.div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500/20 border border-green-400/40 text-green-200 px-3 py-1.5 rounded-full text-xs shadow'>
              {SUCCESS_LINES[Math.floor(Math.random()*SUCCESS_LINES.length)]}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {status==='error' && (
          <motion.div className='absolute inset-0' initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration: 0.5 }}>
            {Array.from({ length:3 }).map((_,i)=> (<motion.div key={i} className='absolute left-1/2 top-10 w-0.5 bg-white' animate={{ height:[0,80+i*10,0], opacity:[0,1,0] }} transition={{ duration:0.5, delay:i*0.15 }} />))}
            {Array.from({ length:60 }).map((_,i)=> (<motion.span key={i} className='absolute w-px h-6 bg-white/30' style={{ left:`${Math.random()*100}%`, top:`${Math.random()*100}%` }} animate={{ y:[0,40], opacity:[0.6,0] }} transition={{ duration:0.8, repeat: Infinity, delay: Math.random()*0.8 }} />))}
            <motion.div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/20 border border-red-400/40 text-red-200 px-3 py-1.5 rounded-full text-xs shadow'>
              {ERROR_LINES[Math.floor(Math.random()*ERROR_LINES.length)]}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Network Card Component
const NetworkCard = ({ network, isSource, balance, className }: { network: keyof typeof NETWORKS; isSource: boolean; balance?: string; className?: string; }) => {
  const networkData = NETWORKS[network];
  const tokenSymbol = 'CRAA';

  return (
    <Card className={cn('bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700/50 backdrop-blur-sm mobile-safe-button', className)}>
      <CardContent className='p-4 md:p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${networkData.color} flex items-center justify-center text-xl md:text-2xl`}
            >
              {networkData.icon}
            </div>
            <div>
              <h3 className='text-base md:text-lg font-semibold text-white'>
                {networkData.name}
              </h3>
              <p className='text-xs md:text-sm text-gray-400'>
                {networkData.symbol} Network
              </p>
            </div>
          </div>
          <Badge
            variant={isSource ? 'default' : 'secondary'}
            className='text-xs'
          >
            {isSource ? 'FROM' : 'TO'}
          </Badge>
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between items-center'><span className='text-xs md:text-sm text-gray-400'>Token:</span><span className='text-xs md:text-sm font-medium text-white'>{tokenSymbol}</span></div>
          <div className='flex justify-between items-center'><span className='text-xs md:text-sm text-gray-400'>Balance:</span><span className='text-xs md:text-sm font-medium text-green-400'>{balance ?? '—'}</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

// Coming Soon Banner
// Removed Solana banner – now live bridge Ape ↔ Monad

export default function BridgePage() {
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const { data: walletClient } = useWalletClient();
  const [mounted, setMounted] = useState(false);

  // Bridge state
  const [direction, setDirection] = useState<NetworkDirection>('ape-to-monad');

  // Network parameters description for adding to wallet
  // Removed auto-adding networks: now only switching

  // Auto-switch network when changing direction (after wallet connection)
  useEffect(() => {
    if (!isConnected) return;
    const target = direction === 'ape-to-monad' ? APE_CHAIN_ID : MONAD_CHAIN_ID;
    // wrap call to avoid adding ensureChain to dependencies
    (async()=>{ await ensureChain(target).catch(e=>console.debug('auto ensureChain fail', e)); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, isConnected]);

  const [amount, setAmount] = useState('');
  const [bridgeDisabledReason, setBridgeDisabledReason] = useState<string>('');
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>('idle');
  const estimatedTime = 45;
  const [txHash, setTxHash] = useState<string>('');
  type AdapterState = readonly [bigint,bigint,number,bigint,bigint,bigint,boolean,boolean,boolean,boolean,boolean];
  type MirrorState = readonly [bigint,bigint,boolean,bigint,bigint,bigint];
  const [adapterState, setAdapterState] = useState<AdapterState | null>(null);
  const [mirrorState, setMirrorState] = useState<MirrorState | null>(null);
  const [apeBalance, setApeBalance] = useState<string>('');
  const [monadBalance, setMonadBalance] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [adapterLimits, setAdapterLimits] = useState<{ maxDay?: bigint; dailyUsed?: bigint; userUsed?: bigint; unlockUsed?: bigint; unlockMaxDay?: bigint; userUnlockUsed?: bigint; maxUserUnlock?: bigint; } | null>(null);
  const [mirrorLimits, setMirrorLimits] = useState<{ maxBurnDay?: bigint; burnUsed?: bigint; userBurnUsed?: bigint; maxUserBurn?: bigint; } | null>(null);
  const [relayerHealth, setRelayerHealth] = useState<{ lastActivityMs?: number; apeLast?: number; monadLast?: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);

  const playSound = useCallback((kind: 'start'|'success'|'error') => {
    if (!soundEnabled) return;
    try {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AC = w.AudioContext || w.webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      // ensure resumed (some browsers require after gesture — the bridge button click is a gesture)
      ctx.resume?.();
      const now = ctx.currentTime;
      type Step = { f: number; t: number; w?: OscillatorType };
      let pattern: Step[] = [];
      if (kind === 'start') pattern = [ { f: 440, t:0 }, { f: 660, t:0.08 }, { f: 330, t:0.16 } ];
      if (kind === 'success') pattern = [ { f: 523, t:0, w:'square' }, { f: 659, t:0.07, w:'square' }, { f: 784, t:0.14, w:'square' }, { f: 1047, t:0.24, w:'square' } ];
      if (kind === 'error') pattern = [ { f: 220, t:0, w:'sawtooth' }, { f: 180, t:0.09, w:'sawtooth' }, { f: 140, t:0.18, w:'sawtooth' } ];
      pattern.forEach((p, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = p.w || 'square';
        o.frequency.value = p.f;
        const startAt = now + p.t;
        const duration = 0.18 - idx*0.01; // slightly shorter each
        g.gain.setValueAtTime(0.0001, startAt);
        g.gain.exponentialRampToValueAtTime(0.4, startAt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        o.connect(g); g.connect(ctx.destination);
        o.start(startAt); o.stop(startAt + duration + 0.02);
      });
    } catch { /* ignore */ }
  }, [soundEnabled]);

  // Usage bar component (lightweight, animated width)
  const UsageBar = ({ used, max, gradient }: { used: bigint; max: bigint; gradient: string }) => {
    if (max === 0n) return null;
    const pct = Number(used * 10000n / max) / 100;
    return (
      <div className='h-2 w-full rounded bg-gray-700/40 overflow-hidden'>
        <div style={{ width: Math.min(100, pct) + '%' }} className={`h-full bg-gradient-to-r ${gradient} transition-all duration-700`} />
      </div>
    );
  };

  // Providers (readonly) – we don't rely on injected for reads
  const apeProvider = useMemo(()=> new ethers.JsonRpcProvider(APE_RPC), []);
  const monadProvider = useMemo(()=> new ethers.JsonRpcProvider(MONAD_RPC), []);

  // Poll on-chain state
  const refreshState = useCallback(async (user?: string) => {
    try {
      const adapter = new ethers.Contract(APE_ADAPTER, ADAPTER_ABI, apeProvider) as unknown as {
        getBridgeState: ()=>Promise<AdapterState>;
        getUnlockRateLimitState: ()=>Promise<[boolean,bigint,bigint,bigint]>;
        userDailyUsed:(a:string)=>Promise<bigint>;
        userUnlockDailyUsed:(a:string)=>Promise<bigint>;
        maxUserUnlockPerDay:()=>Promise<bigint>;
      };
      const mirror = new ethers.Contract(MONAD_MIRROR, MIRROR_ABI, monadProvider) as unknown as {
        getMirrorState: ()=>Promise<MirrorState>;
        userBurnDailyUsed:(a:string)=>Promise<bigint>;
      };
      
      const [aState, mState] = await Promise.all([
        adapter.getBridgeState(),
        mirror.getMirrorState()
      ]);
      
      setAdapterState(aState);
      setMirrorState(mState);
      
      if (user) {
        try {
          const erc20Abi = ['function balanceOf(address) view returns(uint256)'];
          // Use dedicated variable per network to avoid confusion
        const tokenAddr = process.env.NEXT_PUBLIC_APE_CRAA_TOKEN || process.env.NEXT_PUBLIC_CRAA_TOKEN || '0xBb526D657Cc1Ba772469A6EC96AcB2ed9D2A93e5';
          const token = new ethers.Contract(tokenAddr, erc20Abi, apeProvider) as unknown as { balanceOf:(a:string)=>Promise<bigint> };
          const tokenMirror = new ethers.Contract(MONAD_MIRROR, ['function balanceOf(address) view returns(uint256)'], monadProvider) as unknown as { balanceOf:(a:string)=>Promise<bigint> };
          
          // Use Promise.allSettled to handle potential failures gracefully
          const results = await Promise.allSettled([
            token.balanceOf(user),
            tokenMirror.balanceOf(user),
            adapter.getUnlockRateLimitState(),
            adapter.userDailyUsed(user),
            adapter.userUnlockDailyUsed(user),
            adapter.maxUserUnlockPerDay(),
            mirror.userBurnDailyUsed(user)
          ]);
          
          // Extract results with default values for failed promises
          const balA = results[0].status === 'fulfilled' ? results[0].value : 0n;
          const balM = results[1].status === 'fulfilled' ? results[1].value : 0n;
          const unlockState = results[2].status === 'fulfilled' ? results[2].value : [false, 0n, 0n, 0n] as [boolean, bigint, bigint, bigint];
          const userDayUsed = results[3].status === 'fulfilled' ? results[3].value : 0n;
          const userUnlockUsed = results[4].status === 'fulfilled' ? results[4].value : 0n;
          const maxUserUnlock = results[5].status === 'fulfilled' ? results[5].value : 0n;
          const userBurnUsed = results[6].status === 'fulfilled' ? results[6].value : 0n;
          
          setApeBalance(ethers.formatUnits(balA, 18));
          setMonadBalance(ethers.formatUnits(balM, 18));
          setAdapterLimits({
            maxDay: aState[4],
            dailyUsed: aState[5],
            userUsed: userDayUsed,
            unlockUsed: unlockState[2],
            unlockMaxDay: unlockState[1],
            userUnlockUsed: userUnlockUsed,
            maxUserUnlock: maxUserUnlock
          });
          setMirrorLimits({
            maxBurnDay: mState[3],
            burnUsed: mState[4],
            userBurnUsed: userBurnUsed,
            maxUserBurn: mState[5]
          });
        } catch (balanceError) {
          console.warn('Balance fetch failed:', balanceError);
          // Set balances to '0' on error to avoid showing '—'
          setApeBalance('0');
          setMonadBalance('0');
        }
      }
      
      if (!user) {
        // global only
        const unlockState = await adapter.getUnlockRateLimitState().catch(()=>[false,0n,0n,0n] as [boolean,bigint,bigint,bigint]);
        setAdapterLimits({ 
          maxDay: aState[4], 
          dailyUsed: aState[5], 
          unlockUsed: unlockState[2], 
          unlockMaxDay: unlockState[1] 
        });
        setMirrorLimits({ 
          maxBurnDay: mState[3], 
          burnUsed: mState[4], 
          maxUserBurn: mState[5] 
        });
      }
    } catch (e) {
      console.error('State refresh error:', e);
      // Don't show error to user, but log it for debugging
    }
  }, [apeProvider, monadProvider]);

  useEffect(()=>{
    const refreshWithHandling = async () => {
      try {
        const selected = (window as unknown as { ethereum?: { selectedAddress?: string }}).ethereum?.selectedAddress; 
        if (isConnected) {
          await refreshState(selected);
        } else {
          await refreshState();
        }
      } catch (e) {
        console.warn('State refresh cycle failed:', e);
        // Continue with next cycle even if one fails
      }
    };
    
    // Initial refresh
    refreshWithHandling();
    
    // Set up interval
    const id = setInterval(refreshWithHandling, 15000);
    return ()=>clearInterval(id);
  }, [isConnected, refreshState]);

  // Track wallet chainId
  useEffect(()=>{
    const eth = (window as unknown as { ethereum?: { chainId?: string; request?: (a:{method:string})=>Promise<unknown>; on?: (e:string,cb:(...args:unknown[])=>void)=>void; removeListener?: (e:string,cb:(...args:unknown[])=>void)=>void } }).ethereum;
    if (!eth) return;
    const parse = (hex?: string) => { if (!hex) return null; try { return Number.parseInt(hex, 16); } catch { return null; } };
    setWalletChainId(parse(eth.chainId));
    const handler = (...args: unknown[]) => {
      const cid = typeof args[0] === 'string' ? args[0] : undefined;
      setWalletChainId(parse(cid));
    };
    eth.on?.('chainChanged', handler as (...a:unknown[])=>void);
    return ()=> eth.removeListener?.('chainChanged', handler as (...a:unknown[])=>void);
  }, [isConnected]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Relayer health polling (moved before early return to respect hook order)
  useEffect(()=>{
    let url = process.env.NEXT_PUBLIC_RELAYER_HEALTH_URL || '/healthz';
    // Locally sometimes incorrectly set https for localhost -> change to http to avoid ERR_SSL_PROTOCOL_ERROR
    if (url.startsWith('https://localhost')) {
      url = url.replace('https://localhost', 'http://localhost');
    }
    // Also if url is absolute and localhost, ensure it's http
    if (url.startsWith('https://localhost:3000')) {
      url = url.replace('https://localhost:3000', 'http://localhost:3000');
    }
    let alive = true;
    const poll = async()=>{
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error('health '+r.status);
        const j = await r.json();
        if (alive) setRelayerHealth({ lastActivityMs: j?.progress?.lastActivityMs, apeLast: j?.progress?.apeLast, monadLast: j?.progress?.monadLast });
      } catch {}
    };
    poll();
    const id = setInterval(poll, 20000);
    return ()=>{ alive=false; clearInterval(id); };
  }, []);

  // Derived limits / hints on available amount (moved above early return)
  const maxLockUser = useMemo(()=>{
    if (!adapterLimits) return undefined;
    if (adapterLimits.maxDay === undefined) return undefined;
    const globalRemain = (adapterLimits.maxDay! - (adapterLimits.dailyUsed||0n));
    const userRemain = adapterLimits.userUsed!==undefined ? (adapterLimits.maxDay! - adapterLimits.userUsed) : adapterLimits.maxDay!;
    return globalRemain < userRemain ? (globalRemain < 0n ? 0n : globalRemain) : (userRemain < 0n?0n:userRemain);
  }, [adapterLimits]);
  const maxBurnUser = useMemo(()=>{
    if (!mirrorLimits) return undefined;
    if (mirrorLimits.maxUserBurn !== undefined && mirrorLimits.userBurnUsed !== undefined) {
      const userRemain = mirrorLimits.maxUserBurn - mirrorLimits.userBurnUsed;
      return userRemain < 0n ? 0n : userRemain;
    }
    return undefined;
  }, [mirrorLimits]);

  useEffect(()=>{
    let reason = '';
    if (direction === 'ape-to-monad') {
      // Check limits only if they are enabled (not equal to 0)
      if (adapterLimits && maxLockUser !== undefined && adapterLimits.maxDay !== 0n && maxLockUser === 0n) 
        reason = 'Daily lock limit exhausted';
    } else {
      // Check limits only if they are enabled (not equal to 0)
      if (mirrorLimits && maxBurnUser !== undefined && mirrorLimits.maxUserBurn !== 0n && maxBurnUser === 0n) 
        reason = 'Daily burn limit exhausted';
    }
    // Network check
    const expected = direction === 'ape-to-monad' ? APE_CHAIN_ID : MONAD_CHAIN_ID;
    if (!reason && walletChainId && walletChainId !== expected) {
      reason = 'Wrong network in wallet';
    }
    // Checks for entered amount
    if (!reason && amount) {
      try {
        const amt = ethers.parseUnits(amount, 18);
        if (direction === 'ape-to-monad') {
          if (adapterState) {
            const min = adapterState[1];
            const maxTx = adapterState[3];
            if (amt < min) reason = 'Minimum ' + ethers.formatUnits(min,18);
            else if (amt > maxTx) reason = 'Max per transaction ' + ethers.formatUnits(maxTx,18);
            else if (maxLockUser !== undefined && amt > maxLockUser) reason = 'Exceeds available balance';
          }
        } else {
          if (mirrorState) {
            // Check daily limit only if it's enabled (not equal to 0)
            const dailyRemain = mirrorLimits && mirrorLimits.maxBurnDay !== undefined && mirrorLimits.burnUsed !== undefined && mirrorLimits.maxBurnDay !== 0n 
              ? (mirrorLimits.maxBurnDay - mirrorLimits.burnUsed) : undefined;
            if (maxBurnUser !== undefined && mirrorLimits?.maxUserBurn !== 0n && amt > maxBurnUser) 
              reason = 'Exceeds your burn limit';
            else if (dailyRemain !== undefined && dailyRemain >= 0n && amt > dailyRemain) 
              reason = 'Exceeds daily burn limit';
            else if (amt <= 0n) 
              reason = 'Amount must be > 0';
          }
        }
      } catch { reason = 'Invalid number format'; }
    }
    setBridgeDisabledReason(reason);
  }, [direction, maxLockUser, maxBurnUser, adapterLimits, mirrorLimits, walletChainId, amount, adapterState, mirrorState]);

  // Avoid hydration mismatch before mount
  if (!mounted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center'>
        <div className='text-white'>{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  // Get source and destination networks
  const [sourceNetwork, destNetwork] = direction === 'ape-to-monad' ? (['ape','monad'] as const) : (['monad','ape'] as const);
  const expectedChainId = direction === 'ape-to-monad' ? APE_CHAIN_ID : MONAD_CHAIN_ID;

  const handleConnectWallet = () => {
    // Use Web3Modal (globally set via initWeb3Modal)
    const g = (window as unknown as { openWeb3Modal?: () => void });
    if (g.openWeb3Modal) return g.openWeb3Modal();
    // fallback to old method
    const injectedConnector = connectors.find(c => c.type === 'injected');
    if (injectedConnector) connect({ connector: injectedConnector });
  };

  // Provider acquisition helper to support injected and WalletConnect
  const getEip1193 = async (): Promise<{ request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }> => {
    const injected = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (injected?.request) return injected;
    if (walletClient && (walletClient as unknown as { transport?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).transport?.request) {
      return { request: (walletClient as unknown as { transport: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).transport.request };
    }
    throw new Error('No wallet provider available');
  };

  // Simulate bridge process
  const handleBridge = async () => {
    setErrorMsg('');
    if (!amount) { setErrorMsg('Enter amount'); return; }
    if (!isConnected) { setErrorMsg('Wallet not connected'); return; }
    if (bridgeDisabledReason) { setErrorMsg(bridgeDisabledReason); return; }
    
    try {
      setBridgeStatus('preparing');
      playSound('start');
      const amt = ethers.parseUnits(amount, 18);
      const eip1193 = await getEip1193().catch(()=>null);
      if (!eip1193) { 
        setErrorMsg('No wallet provider'); 
        setBridgeStatus('idle'); 
        return; 
      }
      const wEth = new ethers.BrowserProvider(eip1193);
      const signer = await wEth.getSigner();
      const userAddr = await signer.getAddress();
      
      if (direction === 'ape-to-monad') {
        // ensure on Ape
        const net = await wEth.getNetwork();
        if (Number(net.chainId) !== APE_CHAIN_ID) {
          const switched = await ensureChain(APE_CHAIN_ID);
          if (!switched) { 
            setErrorMsg('Switch to ApeChain network'); 
            setBridgeStatus('idle'); 
            return; 
          }
        }
        
        // Approve tokens before lockOnly (check allowance first)
        // Prefer explicit ApeChain CRAA token address to avoid accidentally using Monad CRAA
        const tokenAddr = process.env.NEXT_PUBLIC_APE_CRAA_TOKEN || process.env.NEXT_PUBLIC_CRAA_TOKEN || '0xBb526D657Cc1Ba772469A6EC96AcB2ed9D2A93e5';
        const erc20Abi = ['function allowance(address owner,address spender) view returns (uint256)','function approve(address,uint256) returns (bool)'];
        const token = new ethers.Contract(tokenAddr, erc20Abi, signer) as unknown as { allowance:(o:string,s:string)=>Promise<bigint>; approve:(spender:string,amount:bigint)=>Promise<{ wait:()=>Promise<unknown> }>} ;
        const adapterAddr = APE_ADAPTER;
        let allowance: bigint = 0n;
        try { 
          allowance = await token.allowance(userAddr, adapterAddr); 
        } catch (allowanceError) {
          console.warn('Allowance check failed:', allowanceError);
        }
        
        if (allowance < amt) {
          try {
            setBridgeStatus('preparing');
            const approveTx = await token.approve(adapterAddr, amt);
            await approveTx.wait();
          } catch (approveError: any) {
            console.error('Approval failed:', approveError);
            // Handle user rejection
            if (approveError?.code === 4001 || (approveError?.message && approveError.message.includes('user denied'))) {
              setErrorMsg('Transaction cancelled by user');
              setBridgeStatus('idle'); // Reset status to idle when user cancels
              return;
            } else {
              setErrorMsg('Token approval failed. Please try again.');
              setBridgeStatus('idle'); // Reset status to idle on approval failure
              return;
            }
          }
        }
        
        // minOut using quote
        try {
          const adapter = new ethers.Contract(APE_ADAPTER, ADAPTER_ABI, signer) as unknown as { lockOnly: (a: bigint,b: bigint,c: string)=> Promise<{ hash: string; wait: ()=>Promise<unknown>}>; quoteLock: (amount: bigint) => Promise<bigint> };
          const quoted = await adapter.quoteLock(amt);
          // Using 97% slippage (3% max slippage)
          const minOut = quoted * 9700n / 10000n;
          setBridgeStatus('processing');
          const tx = await adapter.lockOnly(amt, minOut, userAddr);
          setTxHash(tx.hash);
          await tx.wait();
          setBridgeStatus('confirming');
          // wait a bit then mark success
          await new Promise(r=>setTimeout(r, 4000));
          setBridgeStatus('success');
          playSound('success');
        } catch (lockError: any) {
          console.error('Lock operation failed:', lockError);
          // Handle user rejection and ensure button returns to initial state
          if (lockError?.code === 4001 || (lockError?.message && lockError.message.includes('user denied'))) {
            setErrorMsg('Transaction cancelled by user');
            setBridgeStatus('idle'); // Reset status to idle when user cancels
            return;
          }
          
          const err = lockError as { reason?: string; message?: string };
          const raw = err?.reason || err?.message || 'Lock operation failed';
          setErrorMsg(mapError(raw));
          setBridgeStatus('error');
          playSound('error');
          return;
        }
      } else {
        // monad -> ape burn
        const net = await wEth.getNetwork();
        if (Number(net.chainId) !== MONAD_CHAIN_ID) {
          const switched = await ensureChain(MONAD_CHAIN_ID);
          if (!switched) { 
            setErrorMsg('Switch to Monad network'); 
            setBridgeStatus('idle'); 
            return; 
          }
        }
        
        // Conditional approve (if token is separate from mirror)
        try {
          const tokenAddr = (process.env.NEXT_PUBLIC_MONAD_CRAA_TOKEN || process.env.NEXT_PUBLIC_CRAA_TOKEN || '').trim();
          const needSeparateToken = tokenAddr && tokenAddr.toLowerCase() !== MONAD_MIRROR.toLowerCase();
          console.debug('[Bridge][monad->ape] start', { tokenAddr, mirror: MONAD_MIRROR, needSeparateToken });
          if (needSeparateToken) {
            try {
              const erc20Abi = [
                'function allowance(address owner,address spender) view returns (uint256)',
                'function approve(address,uint256) returns (bool)'
              ];
              const token = new ethers.Contract(tokenAddr, erc20Abi, signer) as unknown as { allowance:(o:string,s:string)=>Promise<bigint>; approve:(s:string,a:bigint)=>Promise<{ wait:()=>Promise<unknown> }> };
              let allowance: bigint = 0n;
              try { 
                allowance = await token.allowance(userAddr, MONAD_MIRROR); 
              } catch (allowanceError) {
                console.warn('Allowance check failed:', allowanceError);
              }
              if (allowance < amt) {
                setBridgeStatus('preparing');
                const apTx = await token.approve(MONAD_MIRROR, amt);
                await apTx.wait();
              }
            } catch (apErr: any) {
              console.warn('[Bridge][monad->ape] approve phase failed', apErr);
              // Handle user rejection and ensure button returns to initial state
              if (apErr?.code === 4001 || (apErr?.message && apErr.message.includes('user denied'))) {
                setErrorMsg('Transaction cancelled by user');
                setBridgeStatus('idle'); // Reset status to idle when user cancels
                return;
              }
              setErrorMsg('Token approval failed. Please try again.');
              setBridgeStatus('error');
              playSound('error');
              return;
            }
          }
          setBridgeStatus('processing');
          const mirror = new ethers.Contract(MONAD_MIRROR, MIRROR_ABI, signer) as unknown as { burnToApe: (a: bigint,c: string)=> Promise<{ hash: string; wait: ()=>Promise<unknown>}> };
          const tx = await mirror.burnToApe(amt, userAddr);
          setTxHash(tx.hash);
          await tx.wait();
          setBridgeStatus('confirming');
          await new Promise(r=>setTimeout(r, 4000));
          setBridgeStatus('success');
          playSound('success');
        } catch (burnError: any) {
          console.error('Burn operation failed:', burnError);
          // Handle user rejection and ensure button returns to initial state
          if (burnError?.code === 4001 || (burnError?.message && burnError.message.includes('user denied'))) {
            setErrorMsg('Transaction cancelled by user');
            setBridgeStatus('idle'); // Reset status to idle when user cancels
            return;
          }
          
          const be = burnError as { reason?: string; message?: string } | undefined;
          const burnErrorMsg = be?.reason || be?.message || String(burnError);
          const burnLower = burnErrorMsg.toLowerCase();
          
          // Error handling
          if (burnLower.includes('blocked suspicious transaction') || burnLower.includes('only zero-value calls')) {
            setBridgeStatus('error');
            setErrorMsg('Wallet blocks transaction. Try using MetaMask or another wallet.');
            playSound('error');
          } else if (burnLower.includes('insufficient balance')) {
            setBridgeStatus('error');
            setErrorMsg('Insufficient Mirror token balance.');
            playSound('error');
          } else if (burnLower.includes('insufficient allowance')) {
            setBridgeStatus('error');
            setErrorMsg('Token approval required first.');
            playSound('error');
          } else {
            setBridgeStatus('error');
            setErrorMsg(`Error: ${burnErrorMsg}`);
            playSound('error');
          }
          return;
        }
      }
      refreshState(userAddr);
    } catch (e: any) {
      console.error('Bridge operation failed:', e);
      // Handle user rejection and ensure button returns to initial state
      if (e?.code === 4001 || (e?.message && e.message.includes('user denied'))) {
        setErrorMsg('Transaction cancelled by user');
        setBridgeStatus('idle'); // Reset status to idle when user cancels
        return;
      }
      
      // Reset status to idle on unexpected errors to prevent hanging UI
      setBridgeStatus('idle');
      const err = e as { reason?: string; message?: string };
      const raw = err?.reason || err?.message || 'Bridge operation failed';
      const lower = raw.toLowerCase();
      // soft-fallback: wallet flagged, but transaction often actually went through
      if (lower.includes('blocked suspicious transaction') || lower.includes('only zero-value calls')) {
        setBridgeStatus('confirming');
        setErrorMsg('Transaction likely sent (wallet flagged warning). Waiting for confirmation...');
        // after a few seconds try to update state and mark success
        setTimeout(async () => {
          try {
            const w = window as unknown as { ethereum?: { selectedAddress?: string } };
            await refreshState(w.ethereum?.selectedAddress);
          } catch {}
          setBridgeStatus(prev => prev === 'confirming' ? 'success' : 'idle');
          if (bridgeStatus !== 'success') playSound('success');
        }, 6000);
        return;
      }
      setErrorMsg(mapError(raw));
      setBridgeStatus('error');
      playSound('error');
    }
  };

  // Swap networks
  const swapNetworks = () => {
    setDirection(prev => prev === 'ape-to-monad' ? 'monad-to-ape' : 'ape-to-monad');
  };

  // Auto switch network helper
  // (Optional) automatic network switch could be re-added here if desired

  // Reset form
  const resetForm = () => {
  setBridgeStatus('idle'); setAmount(''); setTxHash(''); setErrorMsg('');
  };


  const mapError = (raw: string) => {
    const msg = raw.toLowerCase();
    if (msg.includes('cap per day')) return 'Daily limit exceeded.';
    if (msg.includes('user cap per day')) return 'Your daily lock limit exhausted.';
    if (msg.includes('burn day cap')) return 'Daily burn limit exceeded.';
    if (msg.includes('user burn day cap')) return 'Your daily burn limit exhausted.';
    if (msg.includes('unlock day cap')) return 'Daily unlock limit reached.';
    if (msg.includes('user unlock day cap')) return 'Your daily unlock limit.';
    if (msg.includes('too small')) return 'Below minimum.';
    if (msg.includes('circuit breaker')) return 'Circuit breaker activated.';
    if (msg.includes('paused')) return 'Contract paused.';
    if (msg.includes('insufficient capacity')) return 'Insufficient capacity.';
    if (msg.includes('insufficient balance')) return 'Insufficient balance.';
    if (msg.includes('blocked suspicious transaction') || msg.includes('only zero-value calls')) {
      return 'Wallet blocks transaction. Try using MetaMask or another wallet.';
    }
    return raw;
  };

  // Attempt proactive network switching / adding before tx send
  const ensureChain = async (target: number) => {
    const providerObj = await getEip1193();
    if (!providerObj) {
      setErrorMsg('No wallet provider available');
      return false;
    }
    
    try {
      await providerObj.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + target.toString(16) }] });
      return true;
    } catch (err) {
      const e = err as { code?: number; message?: string };
      console.warn('Switch chain error:', e);
      
      if (e?.code === 4902 || (e?.code === -32603 && /unrecognized chain id/i.test(e.message||''))) {
        // Automatically add network
        const chainParams = target === APE_CHAIN_ID
          ? { 
              chainId: '0x' + APE_CHAIN_ID.toString(16), 
              chainName: 'ApeChain', 
              nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 }, 
              rpcUrls: [APE_RPC], 
              blockExplorerUrls: ['https://explorer.apecoin.network'] 
            }
          : { 
              chainId: '0x' + MONAD_CHAIN_ID.toString(16), 
              chainName: 'Monad Testnet', 
              nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 }, 
              rpcUrls: [MONAD_RPC], 
              blockExplorerUrls: ['https://testnet.monadexplorer.com'] 
            };
            
        try {
          await providerObj.request({ method: 'wallet_addEthereumChain', params: [chainParams] });
          // After adding, try to switch again
          await providerObj.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + target.toString(16) }] });
          return true;
        } catch (addErr) {
          console.warn('Failed to add/switch chain', addErr);
          setErrorMsg('Failed to add/switch network. Add manually.');
          return false;
        }
      }
      
      if (e?.code === 4001) { // user rejected
        setErrorMsg('Network switch rejected by user.');
        return false;
      }
      
      console.warn('switch chain failed', e);
      setErrorMsg('Failed to switch network. Open wallet and select the required network.');
      return false;
    }
  };

  // Add networks manually (both at once)
  const addNetworks = async () => {
    type Eip1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
    const providerObj = (window as unknown as { ethereum?: Eip1193 }).ethereum;
    if (!providerObj) { setErrorMsg('No injected wallet'); return; }
    const chains = [
      { chainId: '0x' + APE_CHAIN_ID.toString(16), chainName: 'ApeChain', nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 }, rpcUrls: [APE_RPC], blockExplorerUrls: ['https://explorer.apecoin.network'] },
      { chainId: '0x' + MONAD_CHAIN_ID.toString(16), chainName: 'Monad Testnet', nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 }, rpcUrls: [MONAD_RPC], blockExplorerUrls: ['https://testnet.monadexplorer.com'] }
    ];
    for (const cfg of chains) {
      try { await providerObj.request({ method: 'wallet_addEthereumChain', params: [cfg] }); } catch {/* ignore */}
    }
  };

  // getChainParams no longer needed: use CHAIN_PARAMS + ensureChain


  // Input sanitization
  const onAmountChange = (val: string) => {
    // Replace comma with dot, remove extra spaces
    let v = val.replace(/,/g,'.').trim();
    // No more than 18 digits after decimal point
    if (v.includes('.')) {
      const [a,b=''] = v.split('.');
      v = a + '.' + b.slice(0,18);
    }
    // Only digits and one dot
    if (!/^\d*(?:\.\d*)?$/.test(v)) return; // ignore invalid
    setAmount(v);
  };

  const setMax = () => {
    try {
      // Use actual wallet balance instead of derived limits
      if (direction === 'ape-to-monad') {
        // Use actual APE balance
        if (apeBalance && apeBalance !== '—' && parseFloat(apeBalance) > 0) {
          // Ensure we don't exceed the maximum allowed by limits
          if (maxLockUser !== undefined && maxLockUser > 0n) {
            const maxAllowed = ethers.formatUnits(maxLockUser, 18);
            const actualBalance = parseFloat(apeBalance);
            const allowedBalance = parseFloat(maxAllowed);
            // Use the smaller of the two values
            const useBalance = Math.min(actualBalance, allowedBalance);
            // Format to proper decimal places without trailing zeros
            setAmount(useBalance.toString().includes('.') ? useBalance.toString().replace(/\.?0+$/, '') : useBalance.toString());
          } else {
            // Format to proper decimal places without trailing zeros
            setAmount(parseFloat(apeBalance).toString().includes('.') ? parseFloat(apeBalance).toString().replace(/\.?0+$/, '') : parseFloat(apeBalance).toString());
          }
        } else if (maxLockUser !== undefined && maxLockUser > 0n) {
          setAmount(ethers.formatUnits(maxLockUser, 18));
        }
      } else {
        // Use actual Monad balance
        if (monadBalance && monadBalance !== '—' && parseFloat(monadBalance) > 0) {
          // Ensure we don't exceed the maximum allowed by limits
          if (maxBurnUser !== undefined && maxBurnUser > 0n) {
            const maxAllowed = ethers.formatUnits(maxBurnUser, 18);
            const actualBalance = parseFloat(monadBalance);
            const allowedBalance = parseFloat(maxAllowed);
            // Use the smaller of the two values
            const useBalance = Math.min(actualBalance, allowedBalance);
            // Format to proper decimal places without trailing zeros
            setAmount(useBalance.toString().includes('.') ? useBalance.toString().replace(/\.?0+$/, '') : useBalance.toString());
          } else {
            // Format to proper decimal places without trailing zeros
            setAmount(parseFloat(monadBalance).toString().includes('.') ? parseFloat(monadBalance).toString().replace(/\.?0+$/, '') : parseFloat(monadBalance).toString());
          }
        } else if (maxBurnUser !== undefined && maxBurnUser > 0n) {
          setAmount(ethers.formatUnits(maxBurnUser, 18));
        }
      }
    } catch (error) {
      console.error('Set max error:', error);
      // Fallback to derived limits
      try {
        if (direction === 'ape-to-monad' && maxLockUser !== undefined && maxLockUser > 0n) {
          setAmount(ethers.formatUnits(maxLockUser, 18));
        } else if (direction === 'monad-to-ape' && maxBurnUser !== undefined && maxBurnUser > 0n) {
          setAmount(ethers.formatUnits(maxBurnUser, 18));
        }
      } catch (fallbackError) {
        console.error('Set max fallback error:', fallbackError);
      }
    }
  };

  return (
    <div
      className='min-h-screen mobile-content-wrapper bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4'
    >
      {/* Bridge animation background - always show */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        <BridgeAnimation
          intensity={bridgeStatus === 'processing' ? 4 : 2}
          theme='gradient'
          enabled={true}
          className='w-full h-full'
        />
      </div>

      <div className='container mx-auto relative z-10'>
        {/* Header */}
        <header className='mb-4 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-slate-400/50 bg-slate-800/60 text-slate-100 hover:bg-slate-700/70 mobile-safe-button backdrop-blur-sm'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('navigation.returnHome', 'Home')}
            </Button>
          </Link>
          {!isMobile && <TabNavigation />}
          {/* Unified wallet connection button like in Ping/Breed */}
          <WalletConnect />
        </header>

        <main>
          {/* Title */}
          <div className='mt-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 whitespace-nowrap'>
              {t('bridge.title', 'Cross-Chain Bridge 🌉')}
            </h1>
          </div>
          <p className='text-center text-purple-300 mt-1 mb-2 text-sm md:text-base px-4'>Bridge CRAA tokens between ApeChain ↔ Monad using the live lock / burn mechanism.</p>

          {/* Hero: cinematic scene with HUD and quick actions */}
          {/* Shift animation block slightly left (~1 cm ≈ 38px) for symmetry */}
          <div className='relative mb-4 -translate-x-[38px]'>
            <BridgeCinematic direction={direction} status={bridgeStatus} className='border border-purple-500/20 bg-black/30 rounded-2xl z-0' />
            {/* HUD top (simplified: only status and relayer, no duplicate balances/network) */}
            <div className='absolute top-3 inset-x-0 flex justify-center px-3 z-20'>
              <div className='flex flex-wrap items-center gap-2 bg-black/50 backdrop-blur-md border border-purple-500/30 rounded-full px-3 py-2'>
                <BridgeStatusIndicator status={bridgeStatus} />
                <span className='text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/20'>Relayer: {relayerHealth? ((Date.now() - (relayerHealth.lastActivityMs||0) < 60000)?'active': (Date.now() - (relayerHealth.lastActivityMs||0) < 300000)?'idle':'stalled'):'—'}</span>
              </div>
            </div>
            {/* Quick panel bottom */}
            <div className='absolute bottom-4 inset-x-0 flex justify-center px-3 z-20'>
              <div className='w-full max-w-3xl bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-2xl p-3 md:p-4 shadow-xl'>
                <div className='flex flex-col md:flex-row md:items-center gap-2'>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={swapNetworks}
                    className='self-center md:self-auto border-purple-500/40 text-purple-300 hover:bg-purple-500/10'
                    title='Swap direction'
                  >
                    <ArrowRightLeft className='w-4 h-4' />
                  </Button>
                  <div className='flex-1'>
                    <div className='text-[11px] text-purple-300 mb-1'>Amount (CRAA)</div>
                    <div className='relative'>
                      <Input value={amount} onChange={e=>onAmountChange(e.target.value)} inputMode='decimal' placeholder='0.00' className='bg-gray-900/60 border-purple-500/40 text-white pr-20' />
                      <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2'>
                        <button type='button' onClick={setMax} className='text-[10px] px-1.5 py-0.5 rounded bg-purple-600/40 hover:bg-purple-600/60 text-purple-100 border border-purple-400/40'>MAX</button>
                        <span className='text-xs text-purple-200'>CRAA</span>
                      </div>
                    </div>
                  </div>
                  <div className='w-full md:w-auto'>
                    <Button onClick={bridgeStatus === 'success' ? resetForm : handleBridge} disabled={bridgeStatus === 'preparing' || bridgeStatus === 'processing' || bridgeStatus === 'confirming' || !amount || !!bridgeDisabledReason} className='w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2'>
                      {bridgeStatus === 'success' ? (<><ArrowRightLeft className='w-4 h-4 mr-2' />Bridge Again</>) : bridgeStatus !== 'idle' ? (<><Loader2 className='w-4 h-4 mr-2 animate-spin' />{bridgeStatus === 'preparing' && 'Preparing...'}{bridgeStatus === 'processing' && 'Processing...'}{bridgeStatus === 'confirming' && 'Confirming...'} </>) : (<><Zap className='w-4 h-4 mr-2' />{direction === 'ape-to-monad' ? 'Lock & Bridge' : 'Burn & Bridge Back'}</>)}
                    </Button>
                    {bridgeDisabledReason === 'Wrong network in wallet' && (
                      <Button onClick={()=>ensureChain(direction==='ape-to-monad'?APE_CHAIN_ID:MONAD_CHAIN_ID)} variant='outline' className='w-full mt-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400'>
                        Switch network to {(direction==='ape-to-monad'?APE_CHAIN_ID:MONAD_CHAIN_ID) === APE_CHAIN_ID ? 'ApeChain' : 'Monad'}
                      </Button>
                    )}
                  </div>
                </div>
                {!errorMsg && bridgeDisabledReason && bridgeDisabledReason !== 'Wrong network in wallet' && (<div className='text-[11px] text-yellow-300 mt-2'>{bridgeDisabledReason}</div>)}
                {!!errorMsg && (<div className='text-[11px] text-red-300 mt-2'>{errorMsg}</div>)}
              </div>
            </div>
          </div>

          {/* Guide accordion */}
          <div className='flex justify-center my-2'>
            <Accordion type='single' collapsible className='w-full max-w-lg'>
              <AccordionItem
                value='guide'
                className='border-none mobile-safe-button'
              >
                <AccordionTrigger className='w-full bg-black/30 backdrop-blur-sm border border-purple-500/40 rounded-full px-4 py-2 text-center text-purple-200 text-sm md:text-base font-semibold hover:bg-black/50 focus:outline-none focus:ring-0 after:hidden mobile-safe-button'>
                  {t('bridge.guide.title', 'How to Bridge Assets')}
                </AccordionTrigger>
                <AccordionContent className='text-sm space-y-2 text-purple-200 mt-2 bg-black/90 p-4 rounded-lg border border-purple-500/20 mobile-safe-button'>
                  <p>
                    {t(
                      'bridge.guide.intro',
                      'Bridge your assets between ApeChain and Monad networks safely and efficiently.'
                    )}
                  </p>
                  <ol className='list-decimal list-inside pl-4 space-y-0.5'>
                    <li>
                      {t(
                        'bridge.guide.step1',
                        'Select the type of asset to bridge (CRAA tokens or NFTs)'
                      )}
                    </li>
                    <li>
                      {t(
                        'bridge.guide.step2',
                        'Choose source and destination networks'
                      )}
                    </li>
                    <li>
                      {t(
                        'bridge.guide.step3',
                        'Enter amount or select NFT to transfer'
                      )}
                    </li>
                    <li>
                      {t(
                        'bridge.guide.step4',
                        'Confirm transaction and wait for completion'
                      )}
                    </li>
                  </ol>
                  <p className='text-xs text-purple-300'>
                    {t(
                      'bridge.guide.note',
                      'Bridge process typically takes 30-60 seconds. Assets are secured by smart contracts during transfer.'
                    )}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* No banner; feature live */}

          {/* Wallet connection check */}
          {!isConnected ? (
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4'>
                <ArrowRightLeft
                  className={`h-8 w-8 ${mounted ? 'text-purple-500' : 'text-gray-500'}`}
                />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {t('bridge.connectWallet', 'Connect Your Wallet')}
              </h3>
              <p className='text-gray-300 mb-4 px-4'>
                {t(
                  'bridge.connectWalletDesc',
                  'Please connect your wallet to access the cross-chain bridge'
                )}
              </p>
              <Button
                onClick={handleConnectWallet}
                className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
              >
                {t('wallet.connect', 'Connect Wallet')}
              </Button>
            </div>
          ) : (
            /* Bridge Interface */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='space-y-4 md:space-y-6 max-w-4xl mx-auto'
            >
              {/* Direction toggle only (tokens) */}
              <Card className='bg-black/30 backdrop-blur-sm border-purple-500/30 mobile-safe-button'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center space-x-2 text-white text-base md:text-lg'><Zap className='w-4 h-4 md:w-5 md:h-5 text-purple-400' /><span>Bridge Direction</span></CardTitle>
                </CardHeader>
                <CardContent className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4'>
                  <Button onClick={()=>setDirection('ape-to-monad')} variant={direction==='ape-to-monad'?'default':'outline'} className={direction==='ape-to-monad'?'flex-1 bg-purple-600 hover:bg-purple-700 text-white':'flex-1 border-purple-500/50 text-purple-300 hover:bg-purple-500/10'}>Ape → Monad</Button>
                  <Button onClick={()=>setDirection('monad-to-ape')} variant={direction==='monad-to-ape'?'default':'outline'} className={direction==='monad-to-ape'?'flex-1 bg-purple-600 hover:bg-purple-700 text-white':'flex-1 border-purple-500/50 text-purple-300 hover:bg-purple-500/10'}>Monad → Ape</Button>
                </CardContent>
              </Card>

              {/* Network Selection */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-center'>
                {/* Source Network */}
                <NetworkCard network={sourceNetwork} isSource={true} balance={sourceNetwork==='ape'?apeBalance:monadBalance} className='ml-[-1cm]' />

                {/* Swap Button */}
                <div className='flex justify-center order-first md:order-none'>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={swapNetworks}
                    className='w-12 h-12 rounded-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 mobile-safe-button'
                  >
                    <ArrowRightLeft className='w-5 h-5' />
                  </Button>
                </div>

                {/* Destination Network */}
                <NetworkCard network={destNetwork} isSource={false} balance={destNetwork==='ape'?apeBalance:monadBalance} className='mr-[-1cm]' />
              </div>

              {/* Bridge Interface */}
              <Card className='bg-black/30 backdrop-blur-sm border-purple-500/30 mobile-safe-button'>
                <CardHeader className='pb-3 flex flex-row items-center justify-between'>
                  <CardTitle className='flex items-center space-x-2 text-white text-base md:text-lg'>
                    <Shield className='w-4 h-4 md:w-5 md:h-5 text-purple-400' />
                    <span>{t('bridge.interface.title', 'Bridge Interface')}</span>
                  </CardTitle>
                  <button
                    onClick={()=>setSoundEnabled(v=>!v)}
                    className='text-xs px-2 py-1 rounded-md bg-gray-800/40 border border-purple-500/30 hover:border-purple-400 text-purple-300 transition-colors'
                    title={soundEnabled? 'Sound on':'Sound off'}
                  >{soundEnabled? '🔊':'🔇'}</button>
                </CardHeader>
                <CardContent className='space-y-4 md:space-y-6 relative overflow-hidden'>
                                    <ConfettiBurst show={bridgeStatus==='success'} />

                  {/* Input Section */}
                  <div className='space-y-4'>
                    <Label htmlFor='amount' className='text-purple-300 text-sm font-medium'>Amount (CRAA)</Label>
                    <div className='relative flex'>
                      <Input id='amount' inputMode='decimal' placeholder='0.00' value={amount} onChange={e=>onAmountChange(e.target.value)} className='bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 pr-20 mobile-safe-button' />
                      <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2'>
                        <button type='button' onClick={setMax} className='text-[10px] px-1.5 py-0.5 rounded bg-purple-600/40 hover:bg-purple-600/60 text-purple-100 border border-purple-400/40'>MAX</button>
                        <span className='text-purple-300 text-sm font-medium'>CRAA</span>
                      </div>
                    </div>
                    <div className='flex justify-between text-xs text-gray-400'>
                      <span>Available Ape: {apeBalance || '—'}</span>
                      <span>Available Monad: {monadBalance || '—'}</span>
                    </div>
                  </div>

                  {/* Bridge Status */}
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-800/30 rounded-lg border border-purple-500/20 space-y-2 sm:space-y-0 mobile-safe-button'>
                    <BridgeStatusIndicator status={bridgeStatus} />
                    {bridgeStatus === 'processing' && (
                      <div className='text-purple-400 text-sm flex items-center space-x-2'>
                        <Clock className='w-4 h-4' />
                        <span>~{estimatedTime}s remaining</span>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {['preparing','processing','confirming'].includes(bridgeStatus) && (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }} className='p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 shadow-inner'>
                        <ProgressSteps status={bridgeStatus} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success Message */}
                  <AnimatePresence>
                    {bridgeStatus === 'success' && txHash && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className='bg-green-500/10 border border-green-500/30 rounded-lg p-4 mobile-safe-button'
                      >
                        <div className='flex items-center space-x-2 text-green-400 mb-2'>
                          <CheckCircle className='w-5 h-5' />
                          <span className='font-medium'>
                            Bridge Successful!
                          </span>
                        </div>
                        <p className='text-sm text-green-300 mb-2'>
                          {amount} CRAA bridged to {NETWORKS[destNetwork].name} (relayer will finalize mint/unlock shortly if not instantaneous).
                        </p>
                        <div className='text-xs text-green-400 font-mono break-all'>
                          Transaction: <a href={`${direction==='ape-to-monad'?APE_EXPLORER:MONAD_EXPLORER}/tx/${txHash}`} target='_blank' rel='noopener noreferrer' className='underline decoration-dotted hover:text-green-300'>{txHash}</a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bridge Button */}
                  <Button
                    onClick={
                      bridgeStatus === 'success' ? resetForm : handleBridge
                    }
                    disabled={bridgeStatus === 'preparing' || bridgeStatus === 'processing' || bridgeStatus === 'confirming' || !amount || !!bridgeDisabledReason}
                    className='w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {bridgeStatus === 'success' ? (
                      <>
                        <ArrowRightLeft className='w-4 h-4 mr-2' />
                        Bridge Again
                      </>
                    ) : bridgeStatus !== 'idle' ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        {bridgeStatus === 'preparing' && 'Preparing...'}
                        {bridgeStatus === 'processing' && 'Processing...'}
                        {bridgeStatus === 'confirming' && 'Confirming...'}
                      </>
                    ) : (
                      <>
                        <Zap className='w-4 h-4 mr-2' />
        {direction === 'ape-to-monad' ? 'Lock & Bridge' : 'Burn & Bridge Back'}
                      </>
                    )}
                  </Button>
                  {bridgeDisabledReason === 'Wrong network in wallet' && (
                    <Button
                      onClick={()=>ensureChain(expectedChainId)}
                      variant='outline'
                      className='w-full mt-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400'
                    >
                      Switch network to {expectedChainId === APE_CHAIN_ID ? 'ApeChain' : 'Monad'}
                    </Button>
                  )}
                  {/* Removed Add Networks to Wallet section by request */}
  {errorMsg && (
    <div className='text-xs text-red-400 mt-2 break-all'>
      {errorMsg}
      {errorMsg.includes('Wallet blocks transaction') && (
        <div className='mt-1'>
          <strong>Solution:</strong> Use MetaMask or add networks manually in wallet settings.
        </div>
      )}
    </div>
  )}
  {!errorMsg && bridgeDisabledReason && <div className='text-xs text-yellow-400 mt-2 break-all'>{bridgeDisabledReason}</div>}
                </CardContent>
              </Card>

              {/* Bridge Info (live state) */}
              <Card className='bg-black/20 backdrop-blur-sm border-purple-500/20 mobile-safe-button'>
                <CardContent className='p-4 md:p-6'>
                  <h3 className='text-white font-semibold mb-4 flex items-center space-x-2'>
                    <Globe className='w-4 h-4 md:w-5 md:h-5 text-purple-400' />
                    <span>Bridge State</span>
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-sm'>
                    {/* Adapter Global */}
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2 text-purple-300'><Lock className='w-4 h-4'/><span className='font-medium'>Adapter</span></div>
                      <p className='text-gray-400 break-all'>Locked: {adapterState? ethers.formatUnits(adapterState[0],18):'…'}
                        <br/>Defl.Bps: {adapterState? adapterState[2].toString(): '…'}
                        <br/>Daily Used: {adapterLimits? ethers.formatUnits(adapterLimits.dailyUsed||0n,18):'…'} / {adapterLimits? ethers.formatUnits(adapterLimits.maxDay||0n,18):'…'}
                      </p>
                      {adapterLimits?.dailyUsed!==undefined && adapterLimits?.maxDay ? <UsageBar used={adapterLimits.dailyUsed!} max={adapterLimits.maxDay!} gradient='from-purple-600 to-pink-600'/>:null}
                      {adapterLimits?.unlockUsed!==undefined && adapterLimits?.unlockMaxDay ? <div className='mt-2'>
                        <p className='text-xs text-purple-300 mb-1'>Unlock: {ethers.formatUnits(adapterLimits.unlockUsed||0n,18)} / {ethers.formatUnits(adapterLimits.unlockMaxDay||0n,18)}</p>
                        <UsageBar used={adapterLimits.unlockUsed!} max={adapterLimits.unlockMaxDay!} gradient='from-green-500 to-emerald-500'/>
                      </div>:null}
                    </div>
                    {/* Adapter User */}
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2 text-purple-300'><Unlock className='w-4 h-4'/><span className='font-medium'>Your Locks</span></div>
                      <p className='text-gray-400'>Used: {adapterLimits?.userUsed? ethers.formatUnits(adapterLimits.userUsed,18):'—'}
                        <br/>Remaining: {adapterLimits?.userUsed && adapterLimits.maxDay? ethers.formatUnits((adapterLimits.maxDay - adapterLimits.userUsed) < 0n ? 0n : adapterLimits.maxDay - adapterLimits.userUsed,18):'—'}
                        <br/>Unlock Used: {adapterLimits?.userUnlockUsed? ethers.formatUnits(adapterLimits.userUnlockUsed,18):'—'}
                      </p>
                      {adapterLimits?.userUsed!==undefined && adapterLimits?.maxDay ? <UsageBar used={adapterLimits.userUsed!} max={adapterLimits.maxDay!} gradient='from-indigo-500 to-purple-500'/>:null}
                      {adapterLimits?.userUnlockUsed!==undefined && adapterLimits?.maxUserUnlock ? <div className='mt-2'>
                        <p className='text-xs text-purple-300 mb-1'>Unlock User: {ethers.formatUnits(adapterLimits.userUnlockUsed||0n,18)} / {ethers.formatUnits(adapterLimits.maxUserUnlock||0n,18)}</p>
                        <UsageBar used={adapterLimits.userUnlockUsed!} max={adapterLimits.maxUserUnlock!} gradient='from-teal-500 to-cyan-500'/>
                      </div>:null}
                    </div>
                    {/* Mirror Global */}
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2 text-purple-300'><Clock className='w-4 h-4'/><span className='font-medium'>Mirror</span></div>
                      <p className='text-gray-400'>Capacity: {mirrorState? ethers.formatUnits(mirrorState[1],18):'…'}
                        <br/>Burn Used: {mirrorLimits? ethers.formatUnits(mirrorLimits.burnUsed||0n,18):'…'} / {mirrorLimits? ethers.formatUnits(mirrorLimits.maxBurnDay||0n,18):'…'}
                      </p>
                      {mirrorLimits?.burnUsed!==undefined && mirrorLimits?.maxBurnDay ? <UsageBar used={mirrorLimits.burnUsed!} max={mirrorLimits.maxBurnDay!} gradient='from-orange-500 to-amber-500'/>:null}
                    </div>
                    {/* Mirror User & Relayer */}
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2 text-purple-300'><Coins className='w-4 h-4'/><span className='font-medium'>You & Relayer</span></div>
                      <p className='text-gray-400'>Burn You: {mirrorLimits?.userBurnUsed? ethers.formatUnits(mirrorLimits.userBurnUsed,18):'—'} / {mirrorLimits?.maxUserBurn? ethers.formatUnits(mirrorLimits.maxUserBurn,18):'—'}
                        <br/>Relayer: {relayerHealth? ((Date.now() - (relayerHealth.lastActivityMs||0) < 60000)?'active': (Date.now() - (relayerHealth.lastActivityMs||0) < 300000)?'idle':'stalled'):'—'}
                      </p>
                      {mirrorLimits?.userBurnUsed!==undefined && mirrorLimits?.maxUserBurn ? <UsageBar used={mirrorLimits.userBurnUsed!} max={mirrorLimits.maxUserBurn!} gradient='from-fuchsia-500 to-rose-500'/>:null}
                      {relayerHealth && <div className='text-xs mt-2 text-purple-300'>Ape blk: {relayerHealth.apeLast ?? '—'} / Monad blk: {relayerHealth.monadLast ?? '—'}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Footer info removed (feature live) */}
            </motion.div>
          )}

          {/* Return to Home Button */}
          <div className='mt-8 text-center'>
            <Link href='/'>
              <Button className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'>
                {t('navigation.returnHome', 'Home')}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

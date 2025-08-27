'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMobile } from '@/hooks/use-mobile';

// Array of cube images
const cubeImages = [
  '/images/cube1.png',
  '/images/cube2.png',
  '/images/cube3.png',
  '/images/cube4.png',
  '/images/cube5.png',
  '/images/cube6.png',
  '/images/cube7.png',
  '/images/cube8.png',
  '/images/z1.png',
  '/images/z2.png',
  '/images/z3.png',
  '/images/z4.png',
  '/images/z5.png',
  '/images/z6.png',
  '/images/z7.png',
  '/images/z8.png',
  '/images/z9.png',
  '/images/zol1.png',
  '/images/zol2.png',
  '/images/zol3.png',
  '/images/zol4.png',
  '/images/zol5.png',
  '/images/zol6.png',
  '/images/zol7.png',
  '/images/d1.png',
  '/images/d2.png',
  '/images/d3.png',
  '/images/d4.png',
  '/images/d5.png',
];

// Component for star field with improved graphics
const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create stars of different types
    const stars: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      type: string;
      color: string;
    }> = [];
    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#0088ff', '#ff0088'];

    for (let i = 0; i < 400; i++) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]!;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3,
        speed: Math.random() * 0.5 + 0.1,
        type: Math.random() > 0.8 ? 'pulse' : 'normal',
        color: randomColor,
      });
    }

    // Meteors
    const meteors: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
    }> = [];

    // Animation
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach(star => {
        if (star.type === 'pulse') {
          // Pulsating stars
          const pulse = Math.sin(Date.now() * 0.001 * star.speed) * 0.5 + 0.5;
          ctx.fillStyle = star.color;
          ctx.shadowBlur = star.size * 10 * pulse;
          ctx.shadowColor = star.color;
          ctx.globalAlpha = pulse;
        } else {
          ctx.fillStyle = star.color;
          ctx.shadowBlur = star.size * 4;
          ctx.shadowColor = star.color;
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Movement
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
        }
      });

      // Add meteors randomly
      if (Math.random() < 0.02) {
        meteors.push({
          x: Math.random() * canvas.width,
          y: -50,
          length: Math.random() * 80 + 20,
          speed: Math.random() * 10 + 5,
        });
      }

      // Draw meteors
      ctx.globalAlpha = 1;
      meteors.forEach((meteor, index) => {
        const gradient = ctx.createLinearGradient(
          meteor.x,
          meteor.y,
          meteor.x - meteor.length * 0.5,
          meteor.y - meteor.length
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.length * 0.5, meteor.y - meteor.length);
        ctx.stroke();

        meteor.x -= meteor.speed * 0.5;
        meteor.y += meteor.speed;

        if (meteor.y > canvas.height) {
          meteors.splice(index, 1);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 z-0'
      style={{
        background:
          'radial-gradient(ellipse at center, #0a0e27 0%, #000000 100%)',
      }}
    />
  );
};

// Component for lightning
const LightningEffect = () => {
  const [lightning, setLightning] = useState<Array<{ id: number; x: number }>>(
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        setLightning(prev => [
          ...prev,
          {
            id: Date.now(),
            x: Math.random() * 100,
          },
        ]);

        setTimeout(() => {
          setLightning(prev => prev.filter(l => l.id !== Date.now()));
        }, 300);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {lightning.map(bolt => (
        <motion.div
          key={bolt.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.3 }}
          className='fixed top-0 h-full w-1 z-50'
          style={{
            left: `${bolt.x}%`,
            background:
              'linear-gradient(to bottom, transparent, #00ffff, #ffffff, #00ffff, transparent)',
            filter: 'blur(2px)',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
          }}
        />
      ))}
    </>
  );
};

// Component for particles around text
const ParticleField = ({ centerX = 50, centerY = 50 }) => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    angle: (i / 50) * Math.PI * 2,
    radius: Math.random() * 300 + 100,
    speed: Math.random() * 0.5 + 0.1,
    size: Math.random() * 4 + 1,
  }));

  return (
    <div className='fixed inset-0 pointer-events-none z-20'>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className='absolute rounded-full'
          style={{
            width: particle.size,
            height: particle.size,
            background: 'radial-gradient(circle, #fff, transparent)',
            boxShadow: `0 0 ${particle.size * 2}px #00ffff`,
          }}
          animate={{
            x:
              centerX +
              Math.cos(particle.angle + Date.now() * 0.0001 * particle.speed) *
                particle.radius,
            y:
              centerY +
              Math.sin(particle.angle + Date.now() * 0.0001 * particle.speed) *
                particle.radius,
          }}
          transition={{
            duration: 0,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

// Component for cube fragment
const CubeFragment = ({
  position,
  velocity,
  rotation,
  color,
}: {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  color: string;
}) => {
  const [pos, setPos] = useState(position);

  useEffect(() => {
    const interval = setInterval(() => {
      setPos(prev => ({
        x: prev.x + velocity.x,
        y: prev.y + velocity.y + 0.5, // gravity
        z: prev.z + velocity.z,
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [velocity]);

  return (
    <motion.div
      className='absolute w-8 h-8'
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 1, scale: 1 }}
      animate={{
        opacity: 0,
        scale: 0,
        rotateX: rotation.x + 720,
        rotateY: rotation.y + 720,
      }}
      transition={{ duration: 2, ease: 'easeOut' }}
    >
      <div
        className='w-full h-full border border-white/30 mobile-safe-button'
        style={{
          background: `linear-gradient(45deg, ${color}, transparent)`,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </motion.div>
  );
};

// Component for text cube with improved graphics
const TextCube = ({
  char,
  index,
  position,
}: {
  char: string;
  index: number;
  position: { x: number; y: number };
}) => {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [fragments, setFragments] = useState<
    Array<{
      id: number;
      position: { x: number; y: number; z: number };
      velocity: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      color: string;
    }>
  >([]);

  const handleClick = () => {
    if (isDestroyed) return;

    // Create fragments
    const newFragments = [];
    const fragmentCount = Math.floor(Math.random() * 4) + 2; // 2-5 fragments
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0088'];

    for (let i = 0; i < fragmentCount; i++) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]!;
      newFragments.push({
        id: Date.now() + i,
        position: { x: 0, y: 0, z: 0 },
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10 - 5,
          z: (Math.random() - 0.5) * 10,
        },
        rotation: {
          x: Math.random() * 360,
          y: Math.random() * 360,
          z: Math.random() * 360,
        },
        color: randomColor,
      });
    }

    setFragments(newFragments);
    setIsDestroyed(true);
  };

  useEffect(() => {
    // Delay for assembly effect
    const timer = setTimeout(() => {
      setMounted(true);
    }, index * 100);

    return () => clearTimeout(timer);
  }, [index]);

  // Random initial position
  const startX = (Math.random() - 0.5) * window.innerWidth * 2;
  const startY = (Math.random() - 0.5) * window.innerHeight * 2;
  const startRotate = Math.random() * 720 - 360;

  // Choose images for cube faces
  const faceImages = [
    cubeImages[(index * 6) % cubeImages.length],
    cubeImages[(index * 6 + 1) % cubeImages.length],
    cubeImages[(index * 6 + 2) % cubeImages.length],
    cubeImages[(index * 6 + 3) % cubeImages.length],
    cubeImages[(index * 6 + 4) % cubeImages.length],
    cubeImages[(index * 6 + 5) % cubeImages.length],
  ];

  if (isDestroyed) {
    return (
      <div
        className='absolute'
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {fragments.map(fragment => (
          <CubeFragment
            key={fragment.id}
            position={fragment.position}
            velocity={fragment.velocity}
            rotation={fragment.rotation}
            color={fragment.color}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        x: startX,
        y: startY,
        scale: 0,
        rotateX: startRotate,
        rotateY: startRotate,
        opacity: 0,
      }}
      animate={
        mounted
          ? {
              x: position.x,
              y: position.y,
              scale: 1,
              rotateX: isHovered ? 360 : 0,
              rotateY: isHovered ? 360 : [0, 10, -10, 0],
              opacity: 1,
            }
          : {}
      }
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 100,
        duration: 2,
        rotateY: {
          repeat: Infinity,
          duration: 4,
          ease: 'easeInOut',
        },
      }}
      whileHover={{
        scale: 1.3,
        z: 50,
        transition: { duration: 0.3 },
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className='absolute cursor-pointer'
      style={{
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center',
      }}
    >
      {/* Cube with 6 faces and holographic effect */}
      <div
        className='relative w-20 h-20 md:w-24 md:h-24'
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Cracks before destruction */}
        {isHovered && (
          <div className='absolute inset-0 pointer-events-none z-20'>
            <svg className='w-full h-full' viewBox='0 0 100 100'>
              <path
                d='M 30,30 L 50,50 L 30,70 M 50,50 L 70,30 M 50,50 L 70,70'
                stroke='rgba(255,255,255,0.3)'
                strokeWidth='1'
                fill='none'
                className='animate-pulse'
              />
            </svg>
          </div>
        )}

        {/* Holographic layer */}
        {isHovered && (
          <div
            className='absolute inset-0 rounded-lg animate-pulse'
            style={{
              background:
                'linear-gradient(45deg, transparent, rgba(0,255,255,0.3), transparent)',
              transform: 'scale(1.5)',
              filter: 'blur(10px)',
            }}
          />
        )}

        {/* Front face - keep with letter */}
        <div
          className='absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 border-2 border-white/30 flex items-center justify-center text-white font-black text-4xl md:text-5xl shadow-lg overflow-hidden mobile-safe-button'
          style={{
            transform: 'translateZ(40px)',
            textShadow:
              '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,255,255,0.6), 0 0 30px rgba(255,0,255,0.4)',
          }}
        >
          <span
            className='relative z-10'
            style={{
              fontFamily: 'Impact, Arial Black, sans-serif',
              letterSpacing: '-0.05em',
              WebkitTextStroke: '1px rgba(255,255,255,0.3)',
            }}
          >
            {char}
          </span>
          {/* Animated glare */}
          <motion.div
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
            animate={{
              x: [-200, 200],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'linear',
            }}
          />
        </div>

        {/* Back face - image */}
        <div
          className='absolute inset-0 border-2 border-white/30 mobile-safe-button'
          style={{
            transform: 'rotateY(180deg) translateZ(40px)',
            backgroundImage: `url(${faceImages[1]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='absolute inset-0 bg-black/20' />
        </div>

        {/* Top face - image */}
        <div
          className='absolute inset-0 border-2 border-white/30 mobile-safe-button'
          style={{
            transform: 'rotateX(90deg) translateZ(40px)',
            backgroundImage: `url(${faceImages[2]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='absolute inset-0 bg-gradient-to-b from-transparent to-black/30' />
        </div>

        {/* Bottom face - image */}
        <div
          className='absolute inset-0 border-2 border-white/30 mobile-safe-button'
          style={{
            transform: 'rotateX(-90deg) translateZ(40px)',
            backgroundImage: `url(${faceImages[3]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='absolute inset-0 bg-gradient-to-t from-transparent to-black/30' />
        </div>

        {/* Left face - image */}
        <div
          className='absolute inset-0 border-2 border-white/30 mobile-safe-button'
          style={{
            transform: 'rotateY(-90deg) translateZ(40px)',
            backgroundImage: `url(${faceImages[4]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='absolute inset-0 bg-gradient-to-r from-transparent to-black/30' />
        </div>

        {/* Right face - image */}
        <div
          className='absolute inset-0 border-2 border-white/30 mobile-safe-button'
          style={{
            transform: 'rotateY(90deg) translateZ(40px)',
            backgroundImage: `url(${faceImages[5]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='absolute inset-0 bg-gradient-to-l from-transparent to-black/30' />
        </div>

        {/* Energy particles around cube on hover */}
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className='absolute w-2 h-2 bg-cyan-400 rounded-full'
                style={{
                  boxShadow: '0 0 10px #00ffff',
                }}
                animate={{
                  x: Math.cos((i * Math.PI) / 3) * 50,
                  y: Math.sin((i * Math.PI) / 3) * 50,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
};

// Component for laser grid
const LaserGrid = () => {
  return (
    <div className='fixed inset-0 pointer-events-none z-5 opacity-30'>
      <svg width='100%' height='100%' className='absolute inset-0'>
        <defs>
          <pattern
            id='grid'
            width='50'
            height='50'
            patternUnits='userSpaceOnUse'
          >
            <path
              d='M 50 0 L 0 0 0 50'
              fill='none'
              stroke='url(#gridGradient)'
              strokeWidth='0.5'
            />
          </pattern>
          <linearGradient id='gridGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#6d28d9' stopOpacity='0' />
            <stop offset='50%' stopColor='#7dd3fc' stopOpacity='0.35' />
            <stop offset='100%' stopColor='#6d28d9' stopOpacity='0' />
          </linearGradient>
        </defs>
        <rect width='100%' height='100%' fill='url(#grid)' />
      </svg>

      {/* Scanning line */}
      <motion.div
        className='absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent'
        style={{ filter: 'blur(2px)' }}
        animate={{
          y: [-100, window.innerHeight + 100],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default function GamePage() {
  const { isMobile } = useMobile();
  const [text] = useState('CRAZYCUBE 3D GAME');
  const [subtitle] = useState('COMING SOON');
  const [spacing, setSpacing] = useState(100);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const updateSpacing = () => {
      const width = window.innerWidth;
      if (width < 768)
        setSpacing(50); // Smaller spacing for mobile
      else if (width < 1024)
        setSpacing(80); // Medium for tablets
      else setSpacing(100); // Large for desktop
    };

    updateSpacing();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateSpacing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateSpacing);
    };
  }, []);

  // Position calculations for letters
  const getLetterPositions = (text: string, lineY: number, spacing: number) => {
    const positions: Array<{ char: string; x: number; y: number }> = [];
    const totalWidth = text.length * spacing;
    const startX = -totalWidth / 2 + spacing / 2;

    text.split('').forEach((char, index) => {
      if (char !== ' ') {
        positions.push({
          char,
          x: startX + index * spacing,
          y: lineY,
        });
      }
    });

    return positions;
  };

  const mainTextPositions = getLetterPositions(text, -70, spacing);
  const subtitlePositions = getLetterPositions(subtitle, 80, spacing);

  return (
    <div className='relative min-h-screen overflow-hidden bg-black'>
      {/* Star field */}
      <Starfield />

      {/* Laser grid */}
      <LaserGrid />

      {/* Lightning */}
      <LightningEffect />

      {/* Particles around center */}
      <ParticleField
        centerX={window.innerWidth / 2}
        centerY={window.innerHeight / 2}
      />

      {/* 3D text */}
      <div className='relative z-10 min-h-screen flex items-center justify-center perspective-1000'>
        <motion.div
          className='relative'
          style={{
            transform: 'rotateX(15deg)',
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: [0, 5, -5, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Main text */}
          {mainTextPositions.map((pos, index) => (
            <TextCube
              key={`main-${index}`}
              char={pos.char}
              index={index}
              position={pos}
            />
          ))}

          {/* Subtitle */}
          {subtitlePositions.map((pos, index) => (
            <TextCube
              key={`sub-${index}`}
              char={pos.char}
              index={mainTextPositions.length + index}
              position={pos}
            />
          ))}

          {/* Central energy sphere */}
          <motion.div
            className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            animate={{
              scale: [1, 1.2, 1],
              rotate: 360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className='w-40 h-40 rounded-full relative'>
              <div className='absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-pulse opacity-30 blur-xl' />
              <div className='absolute inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse opacity-40 blur-lg' />
              <div className='absolute inset-4 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full animate-pulse opacity-50 blur-md' />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Additional glow effects */}
      <div className='fixed inset-0 pointer-events-none'>
        {/* Mouse-following glow */}
        <motion.div
          className='absolute w-96 h-96 -translate-x-1/2 -translate-y-1/2'
          style={{
            left: mousePos.x,
            top: mousePos.y,
            background:
              'radial-gradient(circle, rgba(0,255,255,0.1), transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Pulsating glow in center */}
        <motion.div
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px]'
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className='w-full h-full bg-gradient-radial from-cyan-500/20 via-purple-500/10 to-transparent blur-3xl' />
        </motion.div>

        {/* Rainbow highlights */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute w-64 h-64'
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 20}%`,
              background: `radial-gradient(circle, ${['#ff0080', '#00ff88', '#0080ff', '#ff00ff', '#ffff00'][i]}20, transparent)`,
              filter: 'blur(60px)',
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Bottom fog */}
      <div className='fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/50 via-purple-900/20 to-transparent pointer-events-none' />
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useThrottledCallback } from '@/hooks/use-throttled-callback';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: {
    x: number;
    y: number;
  };
  opacity: number;
  life: number;
  maxLife: number;
}

interface ParticleEffectProps {
  count?: number;
  colors?: string[];
  speed?: number;
  size?: number;
  className?: string;
  enabled?: boolean;
  /**
   * Where particles should spawn from.
   * "random" – current behaviour (edges/random on screen).
   * "center" – spawn from the centre of the canvas and fly outwards.
   */
  origin?: 'random' | 'center';
}

export function ParticleEffect({
  count = 30,
  colors = ['#22d3ee', '#0ea5e9', '#3b82f6', '#0284c7'],
  speed = 1,
  size = 6,
  className = '',
  enabled = true,
  origin = 'random',
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const frameCount = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Memoize resize handler so its identity stays stable across renders
  const handleResize = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  // Stable throttled resize handler (must be declared at top level, hooks cannot be inside useMemo)
  const throttledResize = useThrottledCallback(handleResize, 200);

  // Initialize on client side only
  useEffect(() => {
    setIsClient(true);
    throttledResize();
    window.addEventListener('resize', throttledResize);

    return () => {
      window.removeEventListener('resize', throttledResize);
    };
  }, [throttledResize]);

  // Optimized particle creation function with useCallback
  const createParticle = useCallback(
    (
      width: number,
      height: number,
      colors: string[],
      size: number
    ): Particle => {
      const maxVelocity = 1.5;
      const isMobileSize = width < 768; // Check if we're on a mobile-sized screen

      // Determine spawn position
      let x: number, y: number;

      if (origin === 'center') {
        // Spawn from a small circle around the centre to avoid overdraw at exact pixel
        const radius = Math.max(width, height) * 0.01; // 1% of the larger dimension
        const angleFromCenter = Math.random() * Math.PI * 2;
        x = width / 2 + Math.cos(angleFromCenter) * radius * Math.random();
        y = height / 2 + Math.sin(angleFromCenter) * radius * Math.random();
      } else {
        // Original behaviour – edges or anywhere
        const fromEdge = Math.random() > 0.3;
        if (fromEdge) {
          const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
          switch (edge) {
            case 0: // top
              x = Math.random() * width;
              y = -size;
              break;
            case 1: // right
              x = width + size;
              y = Math.random() * height;
              break;
            case 2: // bottom
              x = Math.random() * width;
              y = height + size;
              break;
            default: // left
              x = -size;
              y = Math.random() * height;
          }
        } else {
          x = Math.random() * width;
          y = Math.random() * height;
        }
      }

      // Random velocity - reduced for mobile
      const angle = Math.random() * Math.PI * 2;
      const speed =
        Math.random() * (isMobileSize ? maxVelocity * 0.7 : maxVelocity) + 0.5;

      // Ensure size is always positive
      const particleSize = Math.max(
        2,
        Math.random() * (isMobileSize ? size * 0.8 : size) + 2
      );

      return {
        id: Math.random(),
        x,
        y,
        size: particleSize,
        color: colors[Math.floor(Math.random() * colors.length)] || '#22d3ee',
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        opacity: Math.random() * 0.6 + 0.2,
        life: Math.random() * (isMobileSize ? 7 : 10) + 5, // 5-15 seconds, shorter on mobile
        maxLife: isMobileSize ? 12 : 15,
      };
    },
    [origin]
  );

  // Initialize particles - memoized to prevent unnecessary recalculations
  const initialParticles = useMemo(() => {
    if (!isClient || !enabled || prefersReduced || dimensions.width === 0)
      return [];

    // Reduce particle count for better performance
    const actualCount =
      dimensions.width < 768
        ? Math.floor(count * 0.5)
        : Math.floor(count * 0.7);
    return Array.from({ length: actualCount }, () =>
      createParticle(dimensions.width, dimensions.height, colors, size)
    );
  }, [isClient, dimensions, count, colors, size, enabled, createParticle]);

  // Set initial particles
  useEffect(() => {
    if (initialParticles.length > 0) {
      particlesRef.current = initialParticles;
    }
  }, [initialParticles]);

  // Animation loop - optimized with requestAnimationFrame
  useEffect(() => {
    if (!isClient || !enabled || prefersReduced || dimensions.width === 0)
      return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Skip frames on mobile for better performance
      const isMobileSize = canvas.width < 768;
      const shouldRender = !isMobileSize || frameCount.current % 3 === 0; // Increased frame skipping
      frameCount.current = (frameCount.current + 1) % 1000;

      if (shouldRender) {
        const updatedParticles = particlesRef.current.map(particle => {
          // Update position
          const newX =
            particle.x + particle.velocity.x * speed * (deltaTime / 16);
          const newY =
            particle.y + particle.velocity.y * speed * (deltaTime / 16);

          // Update life
          const newLife = particle.life - deltaTime / 1000;
          // Ensure life ratio is never negative
          const lifeRatio = Math.max(0, newLife / particle.maxLife);
          const newOpacity = lifeRatio * 0.8;

          // Only draw if opacity is positive
          if (newOpacity > 0) {
            // Draw particle
            ctx.beginPath();
            // Ensure radius is never negative
            const radius = Math.max(0.1, particle.size);
            ctx.arc(newX, newY, radius, 0, Math.PI * 2);
            ctx.fillStyle =
              particle.color +
              Math.floor(newOpacity * 255)
                .toString(16)
                .padStart(2, '0');
            ctx.fill();
          }

          // Reset particle if it's dead or out of bounds
          if (
            newLife <= 0 ||
            newX < -particle.size ||
            newX > canvas.width + particle.size ||
            newY < -particle.size ||
            newY > canvas.height + particle.size
          ) {
            return createParticle(canvas.width, canvas.height, colors, size);
          }

          // Return updated particle
          return {
            ...particle,
            x: newX,
            y: newY,
            life: newLife,
            opacity: newOpacity,
          };
        });

        particlesRef.current = updatedParticles;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isClient, dimensions, speed, colors, size, enabled, createParticle]);

  if (!isClient || !enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
    />
  );
}

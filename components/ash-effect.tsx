import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useThrottledCallback } from '@/hooks/use-throttled-callback';

interface AshParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  angle: number; // deg for rotation effect
  angularSpeed: number; // deg/s
  shape: 'rect' | 'circle' | 'triangle'; // particle shape
}

interface AshEffectProps {
  count?: number;
  colors?: string[];
  size?: number; // base size
  className?: string;
  enabled?: boolean;
  verticalOnly?: boolean;
}

export function AshEffect({
  count = 180,
  colors = ['#d1d5db', '#9ca3af', '#6b7280', '#4b5563'],
  size = 2.5,
  className = '',
  enabled = true,
  verticalOnly = false,
}: AshEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<AshParticle[]>([]);

  // Resize handler
  const handleResize = useThrottledCallback(() => {
    if (canvasRef.current) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      setDimensions({ width: w, height: h });
    }
  }, 150);

  useEffect(() => {
    setIsClient(true);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Create particle
  const createParticle = useCallback(
    (w: number, h: number): AshParticle => {
      // If verticalOnly: spawn along top edge; else also left edge for drift
      const fromTop = verticalOnly || Math.random() < 0.5;
      const x = fromTop ? Math.random() * w : -20;
      const y = fromTop ? -20 : Math.random() * h;

      // Slow drifting velocity (px per sec)
      const vx = verticalOnly
        ? (Math.random() - 0.5) * 10
        : 10 + Math.random() * 20; // slight sway if vertical only
      const vy = 40 + Math.random() * 60; // faster downward

      const particleSize = Math.random() * size * 2 + size; // vary size

      // Random particle shape
      const shapeRand = Math.random();
      const shape: AshParticle['shape'] =
        shapeRand < 0.33 ? 'circle' : shapeRand < 0.66 ? 'triangle' : 'rect';

      return {
        id: Math.random(),
        x,
        y,
        vx,
        vy,
        size: particleSize,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        opacity: 0.75 + Math.random() * 0.25,
        angle: Math.random() * 360,
        angularSpeed: (Math.random() - 0.5) * 60, // -30..30 deg/s
        shape,
      };
    },
    [colors, size, verticalOnly]
  );

  // Spawn a small seed set; rest will be emitted over time
  const initialParticles = useMemo(() => {
    if (!isClient || !enabled || dimensions.width === 0) return [];
    return Array.from({ length: count }, () =>
      createParticle(dimensions.width, dimensions.height)
    );
  }, [isClient, enabled, dimensions, count, createParticle]);

  useEffect(() => {
    if (initialParticles.length) particlesRef.current = initialParticles;
  }, [initialParticles]);

  // Animation loop
  useEffect(() => {
    if (!isClient || !enabled || dimensions.width === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000; // sec
      lastTimeRef.current = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update particles
      const margin = 40;
      particlesRef.current = particlesRef.current.map(p => {
        const newX = p.x + p.vx * dt;
        const newY = p.y + p.vy * dt;
        const newAngle = p.angle + p.angularSpeed * dt;

        // Draw particle (improved shapes)
        ctx.save();
        ctx.translate(newX, newY);
        ctx.rotate((newAngle * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 0.6;
        ctx.fillStyle = p.color;
        switch (p.shape) {
          case 'circle': {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'triangle': {
            ctx.beginPath();
            const s = p.size;
            ctx.moveTo(0, -s / 2);
            ctx.lineTo(s / 2, s / 2);
            ctx.lineTo(-s / 2, s / 2);
            ctx.closePath();
            ctx.fill();
            break;
          }
          default: {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          }
        }
        ctx.restore();

        // If out of screen + margin, respawn on top/left
        if (newX > w + margin || newY > h + margin) {
          return createParticle(w, h);
        }

        return { ...p, x: newX, y: newY, angle: newAngle };
      });

      // Ensure particle count
      while (particlesRef.current.length < count) {
        particlesRef.current.push(createParticle(w, h));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isClient, enabled, dimensions, createParticle]);

  if (!isClient || !enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
    />
  );
}

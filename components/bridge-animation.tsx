'use client';

import { useState, useEffect, useRef } from 'react';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';
import { useMobile } from '@/hooks/use-mobile';

interface BridgeAnimationProps {
  /** Animation intensity (1-5). Higher = more particles */
  intensity?: number;
  /** Animation theme */
  theme?: 'purple' | 'blue' | 'gradient';
  /** CSS class name */
  className?: string;
  /** Whether animation is enabled */
  enabled?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
  trail: { x: number; y: number; opacity: number }[];
}

export function BridgeAnimation({
  intensity = 2,
  theme = 'gradient',
  className = '',
  enabled = true,
}: BridgeAnimationProps) {
  const [isClient, setIsClient] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  const { getOptimalParticleCount, getOptimalIntensity } = usePerformanceMonitor();
  const { isMobile } = useMobile();

  const currentOptimalIntensity = getOptimalIntensity(intensity);
  const adjustedIntensity = isMobile ? Math.max(1, Math.floor(currentOptimalIntensity / 2)) : currentOptimalIntensity;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle resize
  useEffect(() => {
    if (!isClient) return;

    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isClient]);

  // Set canvas size
  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [dimensions]);

  // Color themes
  const getParticleColor = (theme: string, progress: number) => {
    switch (theme) {
      case 'purple':
        return `rgba(147, 51, 234, ${0.8 - progress * 0.3})`;
      case 'blue':
        return `rgba(59, 130, 246, ${0.8 - progress * 0.3})`;
      case 'gradient':
      default:
        // Gradient from purple to pink based on progress
        const r = Math.floor(147 + (236 - 147) * progress);
        const g = Math.floor(51 + (72 - 51) * progress);
        const b = Math.floor(234 + (153 - 234) * progress);
        return `rgba(${r}, ${g}, ${b}, ${0.8 - progress * 0.3})`;
    }
  };

  // Create new particle
  const createParticle = (): Particle => {
    const { width, height } = dimensions;
    const side = Math.random() < 0.5 ? 'left' : 'right';

    // Start and end points (representing networks)
    const startX = side === 'left' ? width * 0.1 : width * 0.9;
    const startY = height * 0.3 + Math.random() * height * 0.4;
    const endX = side === 'left' ? width * 0.9 : width * 0.1;
    const endY = height * 0.3 + Math.random() * height * 0.4;

  const baseSize = 2 + Math.random() * 3;
  const particleSize = Math.max(1, Math.min(getOptimalParticleCount(baseSize), 5));

    return {
      id: particleIdRef.current++,
      x: startX,
      y: startY,
      targetX: endX,
      targetY: endY,
      progress: 0,
      speed: 0.015 + Math.random() * 0.02, // 0.015-0.035% per frame (20x slower)
      size: particleSize,
      opacity: 0.8 + Math.random() * 0.2,
      color: getParticleColor(theme, 0),
      trail: [],
    };
  };

  // Update particle
  const updateParticle = (particle: Particle): Particle => {
    const newProgress = Math.min(particle.progress + particle.speed / 100, 1);

    // Bezier curve for smooth arc movement
    const t = newProgress;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    // Control point for arc (higher = more curved)
    const controlX = (particle.x + particle.targetX) / 2;
    const controlY =
      Math.min(particle.y, particle.targetY) - dimensions.height * 0.1;

    const newX =
      mt3 * particle.x +
      3 * mt2 * t * controlX +
      3 * mt * t2 * controlX +
      t3 * particle.targetX;
    const newY =
      mt3 * particle.y +
      3 * mt2 * t * controlY +
      3 * mt * t2 * controlY +
      t3 * particle.targetY;

    // Update trail
    const newTrail = [
      { x: newX, y: newY, opacity: particle.opacity },
      ...particle.trail.slice(0, 8), // Keep last 8 trail points
    ].map((point, index) => ({
      ...point,
      opacity: point.opacity * (1 - index * 0.15), // Fade trail
    }));

    return {
      ...particle,
      x: newX,
      y: newY,
      progress: newProgress,
      color: getParticleColor(theme, newProgress),
      trail: newTrail,
    };
  };

  // Draw particle with trail
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    // Draw trail
    particle.trail.forEach((point, index) => {
      if (point.opacity > 0.1) {
        ctx.beginPath();
        ctx.arc(
          point.x,
          point.y,
          particle.size * (1 - index * 0.1),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = particle.color.replace(
          /[\d.]+\)$/g,
          `${point.opacity})`
        );
        ctx.fill();
      }
    });

    // Draw main particle
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();

    // Add glow effect
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = particle.color.replace(/[\d.]+\)$/g, '0.2)');
    ctx.fill();
  };

  // Draw bridge connection lines
  const drawBridgeLines = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = dimensions;

    // Network nodes
    const leftNode = { x: width * 0.1, y: height * 0.5 };
    const rightNode = { x: width * 0.9, y: height * 0.5 };

    // Draw connection lines
    const baseColor = theme === 'purple' ? [147, 51, 234] : theme === 'blue' ? [59, 130, 246] : [147, 51, 234];

    ctx.lineWidth = isHovered ? 2.5 : 1.5; // Thicker lines on hover
    ctx.setLineDash([5, 5]);

    for (let i = 0; i < 3; i++) {
      const offsetY = (i - 1) * 20;
      const gradient = ctx.createLinearGradient(leftNode.x, 0, rightNode.x, 0);
      gradient.addColorStop(0, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${isHovered ? 0.6 : 0.3})`);
      gradient.addColorStop(0.5, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${isHovered ? 0.9 : 0.6})`);
      gradient.addColorStop(1, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${isHovered ? 0.6 : 0.3})`);

      ctx.strokeStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(leftNode.x, leftNode.y + offsetY);
      ctx.lineTo(rightNode.x, rightNode.y + offsetY);
      ctx.stroke();

      // Add glow effect to lines
      ctx.shadowBlur = isHovered ? 15 : 10; // Stronger glow on hover
      ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${isHovered ? 0.9 : 0.7})`;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
    }

    ctx.setLineDash([]); // Reset dash

    // Draw network nodes
    [leftNode, rightNode].forEach((node, index) => {
      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        15
      );
      gradient.addColorStop(
        0,
        theme === 'purple'
          ? `rgba(147, 51, 234, ${isHovered ? 1 : 0.8})`
          : theme === 'blue'
            ? `rgba(59, 130, 246, ${isHovered ? 1 : 0.8})`
            : index === 0
              ? `rgba(147, 51, 234, ${isHovered ? 1 : 0.8})`
              : `rgba(236, 72, 153, ${isHovered ? 1 : 0.8})`
      );
      gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');

      ctx.beginPath();
      ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Node core
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fillStyle =
        theme === 'purple'
          ? '#9333ea'
          : theme === 'blue'
            ? '#3b82f6'
            : index === 0
              ? '#9333ea'
              : '#ec4899';
      ctx.fill();
    });
  };

  // Animation loop
  useEffect(() => {
    if (!isClient || !enabled || !dimensions.width || !dimensions.height)
      return;

    const animate = (currentTime: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw bridge infrastructure
      drawBridgeLines(ctx);

      // Add new particles (much slower spawn rate)
      const deltaTime = currentTime - lastTimeRef.current;
  const baseSpawnInterval = 2000 / adjustedIntensity;
  const optimalParticleSpawnRate = Math.max(500, Math.min(getOptimalParticleCount(baseSpawnInterval), 4000)); // Adjust min/max spawn rates as needed

      if (deltaTime > optimalParticleSpawnRate) {
        // Spawn rate based on intensity (20x slower)
        particlesRef.current.push(createParticle());
        lastTimeRef.current = currentTime;
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current
        .map(updateParticle)
        .filter(particle => particle.progress < 1); // Remove completed particles

      particlesRef.current.forEach(particle => {
        drawParticle(ctx, particle);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, enabled, dimensions, adjustedIntensity, theme, getOptimalParticleCount]);

  if (!isClient || !enabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}

// Default export for dynamic imports
export default BridgeAnimation;

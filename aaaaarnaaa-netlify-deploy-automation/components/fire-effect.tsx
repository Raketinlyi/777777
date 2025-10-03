'use client';

import { useEffect, useRef, useState } from 'react';

interface FireEffectProps {
  intensity?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: { r: number; g: number; b: number };
  life: number;
  maxLife: number;
}

export function FireEffect({ intensity = 1, className = '' }: FireEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    setIsClient(true);
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Fire colors
    const fireColors = [
      { r: 255, g: 0, b: 0 }, // red
      { r: 255, g: 51, b: 0 }, // red-orange
      { r: 255, g: 102, b: 0 }, // orange
      { r: 255, g: 153, b: 0 }, // orange-yellow
      { r: 255, g: 204, b: 0 }, // yellow
    ];

    // Initialize particles
    const particleCount = Math.floor(200 * intensity);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push(
        createFireParticle(canvas.width, canvas.height, fireColors)
      );
    }

    particlesRef.current = particles;

    // Animation loop
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];

        if (!particle) continue;

        // Update position
        particle.x += particle.vx * (deltaTime / 16);
        particle.y += particle.vy * (deltaTime / 16);

        // Update life
        particle.life -= deltaTime / 1000;

        // Calculate opacity based on life
        const lifeRatio = Math.max(0, particle.life / particle.maxLife);
        const alpha = lifeRatio * 0.9;

        if (lifeRatio > 0) {
          // Draw particle
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size
          );

          gradient.addColorStop(
            0,
            `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`
          );
          gradient.addColorStop(
            1,
            `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`
          );

          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Reset particle if it's dead
        if (particle.life <= 0) {
          particlesRef.current[i] = createFireParticle(
            canvas.width,
            canvas.height,
            fireColors
          );
        }
      }

      // Add glow effect
      ctx.globalCompositeOperation = 'lighter';

      // Draw fire base
      const baseGradient = ctx.createLinearGradient(
        canvas.width / 2,
        canvas.height,
        canvas.width / 2,
        canvas.height - 100
      );
      baseGradient.addColorStop(0, 'rgba(255, 102, 0, 0.8)');
      baseGradient.addColorStop(1, 'rgba(255, 102, 0, 0)');

      ctx.fillStyle = baseGradient;
      ctx.fillRect(canvas.width / 4, canvas.height - 50, canvas.width / 2, 50);

      ctx.globalCompositeOperation = 'source-over';

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isClient, intensity]);

  const createFireParticle = (
    width: number,
    height: number,
    colors: { r: number; g: number; b: number }[]
  ): Particle => {
    const size = Math.random() * 20 + 10;
    const x = width / 2 + ((Math.random() - 0.5) * width) / 2;
    const y = height - Math.random() * 20;

    // Speed of movement upward and sideways
    const vx = (Math.random() - 0.5) * 2;
    const vy = -Math.random() * 3 - 2;

    // Random color from the palette
    const color = colors[Math.floor(Math.random() * colors.length)]!;

    return {
      x,
      y,
      size,
      vx,
      vy,
      color,
      life: Math.random() * 2 + 1,
      maxLife: 3,
    };
  };

  if (!isClient) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        className='absolute inset-0 w-full h-full'
        style={{ zIndex: 1 }}
      />
    </div>
  );
}

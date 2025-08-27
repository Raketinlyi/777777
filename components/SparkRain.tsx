'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

type Spark = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // seconds
  size: number;
  hue: number;
};

type SparkRainProps = {
  className?: string;
  enabled?: boolean;
};

/** Canvas spark rain that reacts to 'crazycube:spark-burst' events. */
export function SparkRain({ className = '', enabled = true }: SparkRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isClient, setIsClient] = useState(false);
  const sparksRef = useRef<Spark[]>([]);
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const config = useMemo(() => {
    if (intensity === 'high') {
      return { countMin: 120, countMax: 180, blur: 10, sizeMin: 1.5, sizeMax: 3, gravity: 520, fade: 1.0 };
    }
    if (intensity === 'medium') {
      return { countMin: 60, countMax: 100, blur: 8, sizeMin: 1.2, sizeMax: 2.5, gravity: 480, fade: 1.15 };
    }
    return { countMin: 20, countMax: 40, blur: 5, sizeMin: 1, sizeMax: 1.8, gravity: 440, fade: 1.25 };
  }, [intensity]);

  // Mount/resize handling; keep canvas overlay non-intrusive on mobile
  useEffect(() => {
    setIsClient(true);
    // Determine device power score and set intensity
    const determineIntensity = async () => {
      try {
        const width = window.innerWidth;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
        type PerfNavigator = Navigator & { hardwareConcurrency?: number; deviceMemory?: number };
        const nav = navigator as PerfNavigator;
        const cores = nav.hardwareConcurrency ?? 4;
        const mem = nav.deviceMemory ?? 4;

        // Quick RAF benchmark ~ 20 frames
        let frames = 0;
        const start = performance.now();
        await new Promise<void>(resolve => {
          const step = () => {
            frames += 1;
            if (frames >= 20) return resolve();
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
        const elapsed = performance.now() - start;
        const fps = (frames / elapsed) * 1000;

        let score = 0;
        if (width >= 1024) score += 1; else score -= 1;
        if (cores >= 8) score += 2; else if (cores >= 6) score += 1; else score -= 1;
        if (mem >= 6) score += 1; else if (mem <= 2) score -= 1;
        if (fps >= 58) score += 2; else if (fps >= 50) score += 1; else if (fps < 40) score -= 2;
        if (isMobileUA) score -= 1;

        if (score >= 3) setIntensity('high');
        else if (score >= 1) setIntensity('medium');
        else setIntensity('low');
      } catch {
        setIntensity('medium');
      }
    };

    determineIntensity();
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Emit sparks at given coordinates (memoized to satisfy hooks rules)
  const emitSparks = useCallback((x: number, y: number) => {
    const count = config.countMin + Math.floor(Math.random() * (config.countMax - config.countMin));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      sparksRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 100,
        life: 0.8 + Math.random() * 0.8,
        size: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
        hue: 180 + Math.random() * 120, // cyan/blue/purple
      });
    }
  }, [config]);

  // Handle spark-burst events
  useEffect(() => {
    if (!enabled) return;
    const onBurst = (e: Event) => {
      const { detail } = e as CustomEvent<{ x: number; y: number }>;
      const x = detail?.x ?? window.innerWidth / 2;
      const y = detail?.y ?? window.innerHeight * 0.2;
      emitSparks(x, y);
    };
    window.addEventListener('crazycube:spark-burst', onBurst as EventListener);
    return () => window.removeEventListener('crazycube:spark-burst', onBurst as EventListener);
  }, [enabled, emitSparks]);

  useEffect(() => {
    if (!isClient || !enabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const gravity = config.gravity; // px/s^2
    const fade = config.fade; // fade multiplier

    const loop = (t: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = Math.min((t - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = t;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      const next: Spark[] = [];
      for (const s of sparksRef.current) {
        // integrate
        const nx = s.x + s.vx * dt;
        const ny = s.y + s.vy * dt;
        const nvy = s.vy + gravity * dt;
        const nlife = s.life - dt * fade;
        if (nlife > 0 && ny < canvas.height + 20) {
          next.push({ ...s, x: nx, y: ny, vy: nvy, life: nlife });
          // draw
          const alpha = Math.max(0, Math.min(1, nlife));
          ctx.beginPath();
          ctx.fillStyle = `hsla(${s.hue}, 90%, 60%, ${alpha})`;
          ctx.shadowColor = `hsla(${s.hue}, 90%, 70%, ${alpha})`;
          ctx.shadowBlur = config.blur;
          ctx.arc(nx, ny, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      sparksRef.current = next;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isClient, enabled, config]);

  if (!isClient || !enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-[5] block w-screen h-screen ${className}`}
      style={{
        // Ensure overlay never affects layout on mobile browsers
        contain: 'strict',
      }}
    />
  );
}



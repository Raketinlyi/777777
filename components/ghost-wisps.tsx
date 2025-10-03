'use client';

import { useEffect, useRef } from 'react';

// Ghostly wisps: a few slow-floating light orbs with subtle parallax.
// Very cheap: 18-24 particles max.
export function GhostWisps({
  count = 18,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement as HTMLElement | null;
    const dpr = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));

    const resize = () => {
      const w = (parent?.clientWidth || 1280) | 0;
      const h = (parent?.clientHeight || 720) | 0;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    type Wisp = { x: number; y: number; r: number; a: number; t: number; s: number; hue: number; phase: number };
  const wisps: Wisp[] = Array.from({ length: Math.max(4, Math.min(36, count)) }, () => ({
      x: Math.random() * (canvas.width / dpr),
      y: Math.random() * (canvas.height / dpr),
      r: 10 + Math.random() * 16,
      a: 0.08 + Math.random() * 0.06,
      t: Math.random() * 1000,
      s: 0.15 + Math.random() * 0.2,
      hue: 230 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
    }));

  const draw = () => {
      const W = canvas.width / dpr, H = canvas.height / dpr;
      ctx.clearRect(0, 0, W, H);

      for (const w of wisps) {
        w.t += 0.016;
        const driftX = Math.sin(w.t * 0.3 + w.phase) * 0.6;
  w.x += driftX * w.s;
  w.y += (0.03 + Math.sin(w.t * 0.15 + w.phase) * 0.02) * w.s;
        // wrap
        if (w.x < -50) w.x = W + 50; else if (w.x > W + 50) w.x = -50;
        if (w.y < -50) w.y = H + 50; else if (w.y > H + 50) w.y = -50;

        const g = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r * 2.2);
        g.addColorStop(0, `hsla(${w.hue},35%,85%,${w.a})`);
        g.addColorStop(1, 'hsla(0,0%,100%,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const RZ: typeof ResizeObserver | undefined = typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined;
    const ro = RZ ? new RZ(() => resize()) : undefined;
    if (ro && parent) ro.observe(parent);

    return () => {
      if (ro) ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

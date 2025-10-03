'use client';

import { useEffect, useRef } from 'react';

// Lightweight animated fog using a tiled noise texture.
// Designed to be extremely cheap: one small offscreen canvas as pattern.
// intensity ~ overall opacity (0..1), speed ~ pixels per second at base scale.
export function GraveyardFog({
  intensity = 0.25,
  speed = 8,
  className = '',
}: {
  intensity?: number;
  speed?: number; // px/sec
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 1; // keep it light and soft; blur hides pixels
    const parent = canvas.parentElement as HTMLElement | null;

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

    // Build a small noise tile
    const tile = document.createElement('canvas');
    const TW = 160, TH = 160;
    tile.width = TW; tile.height = TH;
    const tctx = tile.getContext('2d')!;
    const img = tctx.createImageData(TW, TH);
    // Simple value noise with smooth sampling
    const rand = (x: number, y: number) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smooth = (t: number) => t * t * (3 - 2 * t);
    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        const fx = x / 28; const fy = y / 28;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const x1 = x0 + 1, y1 = y0 + 1;
        const sx = smooth(fx - x0), sy = smooth(fy - y0);
        const n0 = lerp(rand(x0, y0), rand(x1, y0), sx);
        const n1 = lerp(rand(x0, y1), rand(x1, y1), sx);
        const n = lerp(n0, n1, sy);
        const v = (n * 255) | 0;
        const i = (y * TW + x) * 4;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    }
    tctx.putImageData(img, 0, 0);

    const pattern = ctx.createPattern(tile, 'repeat');
  // time base not required, offsets derive from tNow directly

    const draw = (tNow: number) => {
  // no t0 usage
      const W = canvas.width / dpr; const H = canvas.height / dpr;
      // Slowly changing offsets (two layers)
      const off1x = (tNow * (speed * 0.04)) % TW;
      const off1y = (tNow * (speed * 0.025)) % TH;
      const off2x = (tNow * (speed * -0.03)) % TW;
      const off2y = (tNow * (speed * 0.015)) % TH;

      ctx.clearRect(0, 0, W, H);

      if (pattern) {
        ctx.globalAlpha = Math.max(0, Math.min(1, intensity * 0.7));
        ctx.save();
        ctx.translate(-off1x, -off1y);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, W + TW, H + TH);
        ctx.restore();

        ctx.globalAlpha = Math.max(0, Math.min(1, intensity * 0.45));
        ctx.save();
        ctx.translate(-off2x, -off2y);
        ctx.scale(1.6, 1.6);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, W + TW * 2, H + TH * 2);
        ctx.restore();
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
  }, [intensity, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ filter: 'blur(12px)', opacity: 1 }}
    />
  );
}

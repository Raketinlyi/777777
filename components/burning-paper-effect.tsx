'use client';

import { useEffect, useRef } from 'react';

// New, more realistic burning-paper effect.
// Key points:
// - 10s total burn-in from edges with organic noise wobble
// - ember sparks, heat glow, soft smoke plumes
// - no external assets, pure Canvas2D
// - calls onBurnComplete() when finished

export function BurningPaperEffect({
  isActive,
  onBurnComplete,
  burnColor = 'orange',
}: {
  isActive: boolean;
  onBurnComplete?: () => void;
  burnColor?: 'orange' | 'gray';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const startRef = useRef<number>(0);
  const doneRef = useRef<boolean>(false);
  // Стабилизируем колбэк, чтобы эффект не перезапускался при каждом новом замыкании родителя
  const cbRef = useRef<typeof onBurnComplete>();
  useEffect(() => { cbRef.current = onBurnComplete; }, [onBurnComplete]);

  // Lightweight value-noise for organic edges
  const noise2D = (x: number, y: number) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const parent = canvas.parentElement as HTMLElement | null;
    const resize = () => {
      const w = (parent?.clientWidth || canvas.clientWidth || 300) | 0;
      const h = (parent?.clientHeight || canvas.clientHeight || 300) | 0;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

  const RZ: typeof ResizeObserver | undefined = typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined;
  const ro = RZ ? new RZ(() => resize()) : undefined;
    if (ro && parent) ro.observe(parent);

  startRef.current = performance.now();
    doneRef.current = false;

    // Particles pools
    type Ember = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    type Smoke = { x: number; y: number; r: number; a: number; t: number; s: number };
    const embers: Ember[] = [];
    const smokes: Smoke[] = [];

  const duration = 15_000; // 15s медленное горение (один проход)

  // Цвет «пустого окна» берём из родителя (фон контейнера с картинкой)
  const parentBg = parent ? getComputedStyle(parent).backgroundColor : '#ffffff';

  const draw = (now: number) => {
      if (doneRef.current) return;
      const t = now - startRef.current;
      const progress = Math.min(Math.max(t / duration, 0), 1);

      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      ctx.clearRect(0, 0, W, H);

  // Лёгкая виньетка/дымка
  const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.03)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

      // Compute inward burn distance for each edge with slight offsets for realism
      const inwardX = (W * 0.5) * progress;
      const inwardY = (H * 0.5) * progress;

      // Рисуем СГОРЕВШУЮ область (прячем картинку) цветом фона родителя.
      // Без «угля» внутри — просто чистое окно.
      const drawBurnEdgeCover = (side: 'top' | 'right' | 'bottom' | 'left') => {
        ctx.save();
        const steps = 32; // edge detail
        ctx.beginPath();
        if (side === 'top') {
          ctx.moveTo(0, 0);
          for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * W;
            const n = noise2D(i * 0.3, progress * 8) * 16 - 8;
            const y = Math.min(H, inwardY * 1.05 + n * (0.5 + 0.5 * progress));
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W, 0);
        } else if (side === 'right') {
          ctx.moveTo(W, 0);
          for (let i = 0; i <= steps; i++) {
            const y = (i / steps) * H;
            const n = noise2D(i * 0.3 + 10, progress * 8) * 16 - 8;
            const x = Math.max(0, W - inwardX * 1.0 - n * (0.5 + 0.5 * progress));
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W, H);
        } else if (side === 'bottom') {
          ctx.moveTo(W, H);
          for (let i = steps; i >= 0; i--) {
            const x = (i / steps) * W;
            const n = noise2D(i * 0.3 + 20, progress * 8) * 16 - 8;
            const y = Math.max(0, H - inwardY * 1.0 - n * (0.5 + 0.5 * progress));
            ctx.lineTo(x, y);
          }
          ctx.lineTo(0, H);
        } else {
          ctx.moveTo(0, H);
          for (let i = steps; i >= 0; i--) {
            const y = (i / steps) * H;
            const n = noise2D(i * 0.3 + 30, progress * 8) * 16 - 8;
            const x = Math.min(W, inwardX * 1.1 + n * (0.5 + 0.5 * progress));
            ctx.lineTo(x, y);
          }
          ctx.lineTo(0, 0);
        }
        ctx.closePath();
        // Заливаем сгоревшее области цветом фона — это «пропадает картинка».
        ctx.fillStyle = parentBg;
        ctx.fill();

        // Glowing rim
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 6;
        ctx.strokeStyle = burnColor === 'orange' ? 'rgba(255,140,40,0.35)' : 'rgba(200,200,220,0.25)';
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';

        ctx.restore();
      };

  drawBurnEdgeCover('top');
  drawBurnEdgeCover('right');
  drawBurnEdgeCover('bottom');
  drawBurnEdgeCover('left');

      // Flames along the dynamic border (short, lively)
      const flameColorStops = (
        g: CanvasGradient,
        scheme: 'orange' | 'gray'
      ) => {
        if (scheme === 'orange') {
          g.addColorStop(0, 'rgba(255,210,120,0.0)');
          g.addColorStop(0.2, 'rgba(255,200,90,0.35)');
          g.addColorStop(1, 'rgba(255,80,0,0.0)');
        } else {
          g.addColorStop(0, 'rgba(220,220,230,0.0)');
          g.addColorStop(0.25, 'rgba(200,200,210,0.28)');
          g.addColorStop(1, 'rgba(160,160,170,0.0)');
        }
      };

      const drawFlame = (x: number, y: number, dirX: number, dirY: number, len: number) => {
        const nx = x + dirX * len;
        const ny = y + dirY * len;
        const g = ctx.createLinearGradient(x, y, nx, ny);
        flameColorStops(g, burnColor);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = g as unknown as string;
        ctx.lineWidth = 3 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2);
        ctx.lineTo(nx + (Math.random() - 0.5) * 4, ny + (Math.random() - 0.5) * 4);
        ctx.stroke();
        ctx.restore();
      };

      const placeFlames = (side: 'top' | 'right' | 'bottom' | 'left') => {
        const gap = 14;
        const count = side === 'top' || side === 'bottom' ? Math.floor(W / gap) : Math.floor(H / gap);
        for (let i = 0; i < count; i++) {
          const phase = (i * 0.15 + progress * 5) % 1;
          const wob = (noise2D(i * 0.5, progress * 5) - 0.5) * 10;
          if (side === 'top') {
            const x = i * gap + gap * 0.5;
            const y = inwardY + wob;
            drawFlame(x, y, 0, -1, 10 + 18 * (1 - phase));
          } else if (side === 'bottom') {
            const x = i * gap + gap * 0.5;
            const y = H - inwardY + wob;
            drawFlame(x, y, 0, 1, 10 + 18 * (1 - phase));
          } else if (side === 'left') {
            const y = i * gap + gap * 0.5;
            const x = inwardX + wob;
            drawFlame(x, y, -1, 0, 10 + 18 * (1 - phase));
          } else {
            const y = i * gap + gap * 0.5;
            const x = W - inwardX + wob;
            drawFlame(x, y, 1, 0, 10 + 18 * (1 - phase));
          }
        }
      };

      if (progress < 0.96) {
        placeFlames('top');
        placeFlames('right');
        placeFlames('bottom');
        placeFlames('left');
      }

      // Ember sparks (rising) — немного больше искр
      const spawnEmbers = 10;
      for (let i = 0; i < spawnEmbers; i++) {
        if (Math.random() < 0.55) continue;
        const side = Math.floor(Math.random() * 4);
        let x = 0, y = 0, vx = 0, vy = 0;
        if (side === 0) { x = Math.random() * W; y = inwardY; vy = -0.4 - Math.random() * 0.4; }
        else if (side === 1) { x = W - inwardX; y = Math.random() * H; vx = 0.4 + Math.random() * 0.3; }
        else if (side === 2) { x = Math.random() * W; y = H - inwardY; vy = 0.4 + Math.random() * 0.4; }
        else { x = inwardX; y = Math.random() * H; vx = -0.4 - Math.random() * 0.3; }
        embers.push({ x, y, vx, vy, life: 0, max: 600 + Math.random() * 600 });
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]!;
        e.x += e.vx + (Math.random() - 0.5) * 0.1;
        e.y += e.vy - 0.07; // stronger buoyancy
        e.life += 16;
        const a = Math.max(0, 1 - e.life / e.max);
        ctx.fillStyle = burnColor === 'orange' ? `rgba(255,160,60,${0.6 * a})` : `rgba(210,210,220,${0.5 * a})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 1 + Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fill();
  if (e.life >= e.max) embers.splice(i, 1);
      }
      ctx.restore();

      // Soft smoke plumes — менее плотные (~50% от предыдущего)
      const smokeRate = 3 + progress * 9;
      for (let i = 0; i < smokeRate; i++) {
        if (Math.random() < 0.35) continue;
        const x = inwardX + Math.random() * (W - 2 * inwardX);
        const y = inwardY + Math.random() * (H - 2 * inwardY);
        smokes.push({ x, y, r: 8 + Math.random() * 12, a: 0.08, t: 0, s: 0.25 + Math.random() * 0.35 });
      }
      for (let i = smokes.length - 1; i >= 0; i--) {
        const s = smokes[i]!;
        s.t += 0.016;
        // подъём и лёгкий горизонтальный дрейф — менее выраженный
        s.y -= 0.3;
        s.x += Math.sin(s.t * 2.2 + noise2D(s.x * 0.02, s.y * 0.02) * 6) * 0.25;
        s.r += s.s;
        s.a *= 0.985;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        g.addColorStop(0, `rgba(80,80,80,${s.a})`);
        g.addColorStop(1, 'rgba(80,80,80,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.a < 0.01) smokes.splice(i, 1);
      }

      if (progress >= 1 && !doneRef.current) {
        doneRef.current = true;
        // финальный страховочный проход: заполняем всё окно цветом родителя
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = parentBg;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        cbRef.current?.();
        return;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (ro && parent) ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, burnColor]);

  if (!isActive) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
  style={{}}
    />
  );
}
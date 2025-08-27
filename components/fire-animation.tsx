'use client';

import { useEffect, useRef } from 'react';

/**
 * Full-screen column of fire (two canvas layers).
 * Big flames + small sparks. Scales with intensity.
 */
export function FireAnimation({
  intensity = 3,
  className = '',
}: {
  intensity?: number;
  className?: string;
}) {
  const bigRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvsBig = bigRef.current;
    const cvsSmall = sparkRef.current;
    if (!cvsBig || !cvsSmall) return;

    const ctxBig = cvsBig.getContext('2d')!;
    const ctxSmall = cvsSmall.getContext('2d')!;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      cvsBig.width = cvsSmall.width = w;
      cvsBig.height = cvsSmall.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    interface P {
      x: number;
      y: number;
      r: number;
      vy: number;
      hue: number;
    }
    const flames: P[] = [];
    const sparks: P[] = [];

    const mkFlame = (): P => ({
      x: rand(0, w),
      y: h + rand(0, h * 0.3),
      r: rand(30, 80),
      vy: rand(-2.5, -1.2),
      hue: rand(20, 40),
    });
    const mkSpark = (): P => ({
      x: rand(0, w),
      y: h + rand(0, 60),
      r: rand(2, 4),
      vy: rand(-5, -3),
      hue: rand(10, 20),
    });

    for (let i = 0; i < intensity * 40; i++) flames.push(mkFlame());
    for (let i = 0; i < intensity * 80; i++) sparks.push(mkSpark());

    const draw = () => {
      ctxBig.globalCompositeOperation = 'lighter';
      ctxBig.clearRect(0, 0, w, h);
      flames.forEach(p => {
        p.y += p.vy;
        p.r *= 0.995;
        if (p.y < -p.r || p.r < 8) Object.assign(p, mkFlame());
        const g = ctxBig.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `hsla(${p.hue},100%,55%,.9)`);
        g.addColorStop(1, `hsla(${p.hue + 20},100%,40%,0)`);
        ctxBig.fillStyle = g;
        ctxBig.beginPath();
        ctxBig.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctxBig.fill();
      });

      ctxSmall.globalCompositeOperation = 'lighter';
      ctxSmall.clearRect(0, 0, w, h);
      sparks.forEach(s => {
        s.y += s.vy;
        if (s.y < -s.r) Object.assign(s, mkSpark());
        ctxSmall.fillStyle = `hsla(${s.hue},100%,80%,.8)`;
        ctxSmall.fillRect(s.x, s.y, s.r, s.r);
      });
      requestAnimationFrame(draw);
    };
    draw();

    return () => window.removeEventListener('resize', resize);
  }, [intensity]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 ${className}`}
    >
      <canvas ref={bigRef} className='absolute inset-0' />
      <canvas ref={sparkRef} className='absolute inset-0' />
    </div>
  );
}

// Default export kept for legacy imports
export default FireAnimation;

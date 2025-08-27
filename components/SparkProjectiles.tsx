'use client';

import { useEffect } from 'react';

/** Lightweight projectiles from title to CTA buttons. */
export function SparkProjectiles() {
  useEffect(() => {
    const onBurst = (e: Event) => {
      const { detail } = e as CustomEvent<{ x: number; y: number }>;
      const fromX = detail?.x ?? window.innerWidth / 2;
      const fromY = detail?.y ?? window.innerHeight * 0.2;

      const targets = Array.from(
        document.querySelectorAll<HTMLElement>('[data-ignite-target]')
      );
      if (targets.length === 0) return;

      // Pick up to 2 random targets per burst
      const picks = shuffle(targets).slice(0, 2);
      for (const el of picks) {
        const rect = el.getBoundingClientRect();
        const toX = rect.left + rect.width / 2;
        const toY = rect.top + rect.height / 2;
        launchDot(fromX, fromY, toX, toY, () => ignite(el));
      }
    };
    window.addEventListener('crazycube:spark-burst', onBurst as EventListener);
    return () => window.removeEventListener('crazycube:spark-burst', onBurst as EventListener);
  }, []);

  return null;
}

// Briefly add a glowing class to target
function ignite(target: HTMLElement) {
  target.classList.add('ignite-active');
  window.setTimeout(() => target.classList.remove('ignite-active'), 800);
}

// Create and animate a single glowing dot projectile
function launchDot(fromX: number, fromY: number, toX: number, toY: number, onFinish: () => void) {
  const dot = document.createElement('div');
  dot.style.position = 'fixed';
  dot.style.left = '0';
  dot.style.top = '0';
  dot.style.width = '8px';
  dot.style.height = '8px';
  dot.style.borderRadius = '9999px';
  dot.style.pointerEvents = 'none';
  dot.style.zIndex = '6';
  dot.style.background = 'radial-gradient(circle, rgba(56,189,248,1) 0%, rgba(14,165,233,0.9) 60%, rgba(59,130,246,0.7) 100%)';
  dot.style.boxShadow = '0 0 12px rgba(56,189,248,0.9), 0 0 24px rgba(14,165,233,0.8)';
  dot.style.transform = `translate(${fromX - 4}px, ${fromY - 4}px)`;
  document.body.appendChild(dot);

  const midX = (fromX + toX) / 2 + (Math.random() - 0.5) * 120;
  const midY = Math.min(fromY, toY) - (80 + Math.random() * 120);
  const duration = 600 + Math.random() * 300;

  const keyframes = [
    { transform: `translate(${fromX - 4}px, ${fromY - 4}px)`, offset: 0, opacity: 1 },
    { transform: `translate(${midX - 4}px, ${midY - 4}px)`, offset: 0.6, opacity: 1 },
    { transform: `translate(${toX - 4}px, ${toY - 4}px)`, offset: 1, opacity: 0.7 },
  ];

  const anim = dot.animate(keyframes as Keyframe[], {
    duration,
    easing: 'ease-in-out',
    fill: 'forwards',
  });
  anim.onfinish = () => {
    dot.remove();
    onFinish();
  };
}

// Fisher–Yates shuffle with strict typing (no destructuring swap to appease TS)
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}



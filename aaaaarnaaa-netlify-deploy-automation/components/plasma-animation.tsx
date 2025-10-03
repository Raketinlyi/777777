'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

/**
 * Full-screen plasma energy field (two canvas layers).
 * Energy particles + electric arcs. Scales with intensity.
 */
export function PlasmaAnimation({
  intensity = 3,
  className = '',
  isPaused = false,
}: {
  intensity?: number;
  className?: string;
  isPaused?: boolean;
}) {
  const plasmaRef = useRef<HTMLCanvasElement>(null);
  const arcRef = useRef<HTMLCanvasElement>(null);
  const { getOptimalParticleCount, getOptimalIntensity } = usePerformanceMonitor();

  useEffect(() => {
    const cvsPlasma = plasmaRef.current;
    const cvsArc = arcRef.current;
    if (!cvsPlasma || !cvsArc) return;

    const ctxPlasma = cvsPlasma.getContext('2d')!;
    const ctxArc = cvsArc.getContext('2d')!;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      cvsPlasma.width = cvsArc.width = w;
      cvsPlasma.height = cvsArc.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    interface Particle {
      x: number;
      y: number;
      r: number;
      vy: number;
      hue: number;
      life: number;
      maxLife: number;
    }
    
    const particles: Particle[] = [];

    // Create energy particles
    const mkParticle = (): Particle => ({
      x: rand(0, w),
      y: rand(0, h), // Particles appear throughout the screen
      r: rand(20, 50), // Larger particles
      vy: rand(-1.4, -0.56), // Upward movement (30% slower)
  hue: rand(230, 270), // Indigo to purple range (avoid pink/red)
      life: rand(2.6, 5.2), // Longer life (30% longer)
      maxLife: 5.2,
    });

    // Create electric arc - just for one-time use
    const mkArc = () => ({
      x1: rand(0, w),
      y1: rand(h * 0.5, h), // Start from lower half
      x2: rand(0, w),
      y2: rand(0, h * 0.5), // End in upper half
    });

    // Initialize particles with performance optimization
    const optimalIntensity = getOptimalIntensity(intensity);
    const baseParticleCount = optimalIntensity * 15;
    const optimalParticleCount = getOptimalParticleCount(baseParticleCount);
    for (let i = 0; i < optimalParticleCount; i++) particles.push(mkParticle());

    const draw = () => {
      // Skip animation updates if paused, but still call requestAnimationFrame
      if (isPaused) {
        requestAnimationFrame(draw);
        return;
      }

      // Draw plasma particles
      ctxPlasma.globalCompositeOperation = 'lighter';
      ctxPlasma.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;

        p.y += p.vy;
        p.life -= 0.0112; // 30% slower life decay (0.016 * 0.7)

        if (p.life <= 0 || p.y < -p.r) {
          particles[i] = mkParticle();
          continue;
        }
        
        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio * 0.8;
        
        // Create gradient for plasma effect
  const hue1 = p.hue;
  const hue2 = Math.min(p.hue + 15, 280); // keep within purple/indigo
  const hue3 = Math.min(p.hue + 30, 285);
  const g = ctxPlasma.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
  g.addColorStop(0, `hsla(${hue1}, 100%, 70%, ${alpha})`);
  g.addColorStop(0.5, `hsla(${hue2}, 100%, 55%, ${alpha * 0.6})`);
  g.addColorStop(1, `hsla(${hue3}, 100%, 35%, 0)`);
        
        ctxPlasma.fillStyle = g;
        ctxPlasma.beginPath();
        ctxPlasma.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctxPlasma.fill();
      }

      // Draw electric arcs - with extremely long delay between appearance
      ctxArc.globalCompositeOperation = 'lighter';
      ctxArc.clearRect(0, 0, w, h);
      
      // Only show arcs extremely rarely - about once every 40-60 seconds
      if (Math.random() < 0.0003) { // Even lower probability per frame (~once every 40-60 seconds at 60fps)
        const arc = mkArc();
        const alpha = 0.3; // Even lower brightness
        
        // Draw lightning effect
        ctxArc.beginPath();
        ctxArc.moveTo(arc.x1, arc.y1);
        
        // Create jagged lightning path - fewer segments for slower appearance
        const segments = 5; // Fewer segments for slower appearance
        for (let j = 1; j < segments; j++) {
          const t = j / segments;
          const x = arc.x1 + (arc.x2 - arc.x1) * t;
          const y = arc.y1 + (arc.y2 - arc.y1) * t;
          // Add random displacement for jagged effect
          const dx = rand(-10, 10); // Reduced displacement
          const dy = rand(-5, 5); // Reduced displacement
          ctxArc.lineTo(x + dx, y + dy);
        }
        
        ctxArc.lineTo(arc.x2, arc.y2);
        
        // Thinner lightning with less glow
        const thickness = rand(0.5, 1.5); // Thinner lightning
        
        // Draw outer glow - further reduced
        ctxArc.strokeStyle = `hsla(270, 100%, 80%, ${alpha * 0.2})`;
        ctxArc.lineWidth = thickness + 2;
        ctxArc.stroke();
        
        // Draw mid glow - further reduced
        ctxArc.strokeStyle = `hsla(270, 100%, 85%, ${alpha * 0.3})`;
        ctxArc.lineWidth = thickness + 1;
        ctxArc.stroke();
        
        // Draw core - further reduced
        ctxArc.strokeStyle = `hsla(270, 100%, 95%, ${alpha * 0.5})`;
        ctxArc.lineWidth = thickness;
        ctxArc.stroke();
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();

    return () => window.removeEventListener('resize', resize);
    // getOptimalIntensity/getOptimalParticleCount are stable; intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, isPaused]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 ${className}`}
    >
      <canvas ref={plasmaRef} className='absolute inset-0' />
      <canvas ref={arcRef} className='absolute inset-0' />
    </div>
  );
}

// Default export for legacy imports
export default PlasmaAnimation;
'use client';
import React, { useEffect, useRef } from 'react';
import { burnAudio } from '@/lib/burnAudio';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

interface BurnAnimationOverlayProps {
  step: 'idle' | 'approving' | 'burning' | 'exploding';
  intensity?: 1 | 2 | 3 | 4 | 5; // Уровень интенсивности анимации
}

// A single lightning bolt segment
class Segment {
  constructor(public p1: { x: number; y: number }, public p2: { x: number; y: number }, public thickness: number) {}
}

// Particle system classes
class Spark {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life: number;
  public maxLife: number;
  public size: number;
  public color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8 - 2; // Slight upward bias
    this.life = 0;
    this.maxLife = (30 + Math.random() * 20) * 1.3; // 30% slower
    this.size = 1 + Math.random() * 3;
    this.color = Math.random() > 0.5 ? '#FFD700' : '#FF6B35';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.vx *= 0.98; // Air resistance
    this.life++;
    return this.life >= this.maxLife;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = 1 - this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Smoke {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life: number;
  public maxLife: number;
  public size: number;
  public rotation: number;
  public rotationSpeed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -1 - Math.random() * 2; // Always upward
    this.life = 0;
    this.maxLife = (60 + Math.random() * 40) * 1.3; // 30% slower
    this.size = 5 + Math.random() * 15;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy *= 0.99; // Slow down over time
    this.size += 0.2; // Expand
    this.rotation += this.rotationSpeed;
    this.life++;
    return this.life >= this.maxLife;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = (1 - this.life / this.maxLife) * 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#666666';
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Ash {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life: number;
  public maxLife: number;
  public size: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1;
    this.vy = 1 + Math.random() * 2; // Falling down
    this.life = 0;
    this.maxLife = (80 + Math.random() * 60) * 1.3; // 30% slower
    this.size = 1 + Math.random() * 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx += (Math.random() - 0.5) * 0.1; // Random drift
    this.life++;
    return this.life >= this.maxLife;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = 1 - this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// A full lightning bolt effect
class LightningBolt {
  private segments: Segment[] = [];
  public alpha = 1;
  private life = 0;
  private lifeMax = 39; // frames (30% slower)

  constructor(startX: number, startY: number, endX: number, endY: number, thickness: number, private branchChance: number) {
    this.createBolt(startX, startY, endX, endY, thickness);
  }

  private createBolt(x1: number, y1: number, x2: number, y2: number, thickness: number, depth: number = 0) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Условие выхода: если расстояние мало ИЛИ достигнута максимальная глубина рекурсии
    if (distance < 20 || depth > 8) {
      this.segments.push(new Segment({ x: x1, y: y1 }, { x: x2, y: y2 }, thickness));
      return;
    }

    const midX = x1 + dx * 0.5 + (Math.random() - 0.5) * 20;
    const midY = y1 + dy * 0.5 + (Math.random() - 0.5) * 20;

    this.createBolt(x1, y1, midX, midY, thickness, depth + 1);
    this.createBolt(midX, midY, x2, y2, thickness, depth + 1);

    // Branching logic - только если не слишком глубоко
    if (depth < 6 && Math.random() < this.branchChance) {
      const branchAngle = angle + (Math.random() * 1.2 - 0.6); // +/- 30 degrees
      const branchLength = distance * (0.3 + Math.random() * 0.4);
      const branchEndX = midX + Math.cos(branchAngle) * branchLength;
      const branchEndY = midY + Math.sin(branchAngle) * branchLength;
      this.createBolt(midX, midY, branchEndX, branchEndY, thickness * 0.6, depth + 1);
    }
  }

  update() {
    this.life++;
    this.alpha = 1 - this.life / this.lifeMax;
    return this.life >= this.lifeMax;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = '#FFD700'; // Gold color
    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 20;
    ctx.globalCompositeOperation = 'lighter';

    this.segments.forEach(seg => {
      ctx.beginPath();
      ctx.moveTo(seg.p1.x, seg.p1.y);
      ctx.lineTo(seg.p2.x, seg.p2.y);
      ctx.lineWidth = seg.thickness * this.alpha;
      ctx.stroke();
    });

    ctx.restore();
  }
}

export const BurnAnimationOverlay: React.FC<BurnAnimationOverlayProps> = ({ step, intensity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const frameCount = useRef(0);
  const { getOptimalParticleCount, getOptimalIntensity } = usePerformanceMonitor();
  
  // Массивы для хранения эффектов
  const bolts = useRef<LightningBolt[]>([]);
  const sparks = useRef<Spark[]>([]);
  const smoke = useRef<Smoke[]>([]);
  const ash = useRef<Ash[]>([]);

  // ОПТИМИЗАЦИЯ: Лимиты частиц для производительности
  const MAX_BOLTS = 15; // Было неограничено
  const MAX_SPARKS = 50; // Было неограничено  
  const MAX_SMOKE = 25; // Было неограничено
  const MAX_ASH = 30; // Было неограничено

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      frameCount.current++;
      const { width, height } = canvas;
      
      // Очищаем canvas только если есть что рисовать
      const hasParticles = bolts.current.length > 0 || sparks.current.length > 0 || 
                          smoke.current.length > 0 || ash.current.length > 0;
      if (hasParticles) {
        ctx.clearRect(0, 0, width, height);
      }

      const intensityMultiplier = intensity;
      
      // ОПТИМИЗАЦИЯ: Увеличены интервалы между созданием эффектов
      const frequency = Math.max(8, 15 - intensity); // Было 3-5, теперь 8-12

      if (step === 'approving' && frameCount.current % frequency === 0) {
        // ОПТИМИЗАЦИЯ: Ограничиваем количество молний
        const boltCount = Math.min(intensityMultiplier, 2); // Максимум 2 молнии за раз
        for (let i = 0; i < boltCount && bolts.current.length < MAX_BOLTS; i++) {
          const side = Math.floor(Math.random() * 4);
          let x1, y1;
          if (side === 0) { x1 = 0; y1 = Math.random() * height; } // left
          else if (side === 1) { x1 = width; y1 = Math.random() * height; } // right
          else if (side === 2) { x1 = Math.random() * width; y1 = 0; } // top
          else { x1 = Math.random() * width; y1 = height; } // bottom
          
          const thickness = 2 + (intensityMultiplier - 1) * 0.5;
          const branchChance = 0.3 + (intensityMultiplier - 1) * 0.1;
          bolts.current.push(new LightningBolt(x1, y1, width / 2, height / 2, thickness, branchChance));
        }
        
        // ОПТИМИЗАЦИЯ: Меньше искр, реже создание
        if (frameCount.current % 20 === 0 && sparks.current.length < MAX_SPARKS) { // Было каждые 15 кадров (30% медленнее)
          const sparkCount = Math.min(intensityMultiplier, 3); // Максимум 3 искры
          for (let i = 0; i < sparkCount; i++) {
            sparks.current.push(new Spark(
              width / 2 + (Math.random() - 0.5) * 100,
              height / 2 + (Math.random() - 0.5) * 100
            ));
          }
          // Звук искр
          if (Math.random() < 0.3) {
            burnAudio.playSpark();
          }
        }
      }

      if (step === 'burning' && frameCount.current % frequency === 0) {
        // ОПТИМИЗАЦИЯ: Ограничиваем количество молний при горении
        const boltCount = Math.min(intensityMultiplier, 3); // Максимум 3 молнии за раз
        for (let i = 0; i < boltCount && bolts.current.length < MAX_BOLTS; i++) {
          const side = Math.floor(Math.random() * 4);
          let x1, y1;
          if (side === 0) { x1 = 0; y1 = Math.random() * height; } // left
          else if (side === 1) { x1 = width; y1 = Math.random() * height; } // right
          else if (side === 2) { x1 = Math.random() * width; y1 = 0; } // top
          else { x1 = Math.random() * width; y1 = height; } // bottom
          
          const thickness = 3.5 + (intensityMultiplier - 1) * 1;
          const branchChance = 0.5 + (intensityMultiplier - 1) * 0.15;
          const randomOffset = 100 + (intensityMultiplier - 1) * 50;
          bolts.current.push(new LightningBolt(x1, y1, width / 2 + (Math.random() - 0.5) * randomOffset, height / 2 + (Math.random() - 0.5) * randomOffset, thickness, branchChance));
        }
        
        // ОПТИМИЗАЦИЯ: Меньше частиц, реже создание
        if (frameCount.current % 13 === 0) { // Было каждые 10 кадров (30% медленнее)
          // Дым - ограничиваем количество
          const smokeCount = Math.min(intensityMultiplier, 2);
          for (let i = 0; i < smokeCount && smoke.current.length < MAX_SMOKE; i++) {
            smoke.current.push(new Smoke(
              width / 2 + (Math.random() - 0.5) * 150,
              height / 2 + (Math.random() - 0.5) * 150
            ));
          }
          
          // Искры - ограничиваем количество
          const sparkCount = Math.min(intensityMultiplier * 2, 5);
          for (let i = 0; i < sparkCount && sparks.current.length < MAX_SPARKS; i++) {
            sparks.current.push(new Spark(
              width / 2 + (Math.random() - 0.5) * 200,
              height / 2 + (Math.random() - 0.5) * 200
            ));
          }
          
          // Звуки горения
          if (frameCount.current % 26 === 0) { // Было каждые 20 кадров (30% медленнее)
            burnAudio.playFireCrackle(intensityMultiplier);
          }
          if (Math.random() < 0.4) {
            burnAudio.playSpark();
          }
        }
      }
      
      if (step === 'exploding' && frameCount.current === 1) {
          // ОПТИМИЗАЦИЯ: Автоматическое снижение качества при низкой производительности
          const optimalIntensity = getOptimalIntensity(intensity);
          
          const explosionBolts = getOptimalParticleCount(Math.min(15 + (optimalIntensity - 1) * 5, 25));
          for(let i = 0; i < explosionBolts; i++) {
              const angle = (i / explosionBolts) * Math.PI * 2;
              const radius = (width/2) + (optimalIntensity - 1) * 30;
              const x2 = width/2 + Math.cos(angle) * radius;
              const y2 = height/2 + Math.sin(angle) * radius;
              const explosionThickness = 4 + (optimalIntensity - 1) * 1.5;
              const explosionBranching = 0.6 + (optimalIntensity - 1) * 0.15;
              bolts.current.push(new LightningBolt(width/2, height/2, x2, y2, explosionThickness, explosionBranching));
          }
          
          // ОПТИМИЗАЦИЯ: Автоматическое снижение количества частиц
          const sparkCount = getOptimalParticleCount(Math.min(25 + optimalIntensity * 10, 40));
          for (let i = 0; i < sparkCount; i++) {
            sparks.current.push(new Spark(
              width / 2 + (Math.random() - 0.5) * 50,
              height / 2 + (Math.random() - 0.5) * 50
            ));
          }
          
          const smokeCount = getOptimalParticleCount(Math.min(10 + optimalIntensity * 5, 20));
          for (let i = 0; i < smokeCount; i++) {
            smoke.current.push(new Smoke(
              width / 2 + (Math.random() - 0.5) * 100,
              height / 2 + (Math.random() - 0.5) * 100
            ));
          }
          
          const ashCount = getOptimalParticleCount(Math.min(15 + optimalIntensity * 8, 25));
          for (let i = 0; i < ashCount; i++) {
            ash.current.push(new Ash(
              width / 2 + (Math.random() - 0.5) * 80,
              height / 2 + (Math.random() - 0.5) * 80
            ));
          }
          
          // Звук взрыва
          burnAudio.playExplosion(intensity);
      }

      // ОПТИМИЗАЦИЯ: Принудительно удаляем лишние частицы если превышен лимит
      if (bolts.current.length > MAX_BOLTS) {
        bolts.current = bolts.current.slice(-MAX_BOLTS);
      }
      if (sparks.current.length > MAX_SPARKS) {
        sparks.current = sparks.current.slice(-MAX_SPARKS);
      }
      if (smoke.current.length > MAX_SMOKE) {
        smoke.current = smoke.current.slice(-MAX_SMOKE);
      }
      if (ash.current.length > MAX_ASH) {
        ash.current = ash.current.slice(-MAX_ASH);
      }

      // Update and draw all effects
      bolts.current = bolts.current.filter(bolt => !bolt.update());
      bolts.current.forEach(bolt => bolt.draw(ctx));
      
      sparks.current = sparks.current.filter(spark => !spark.update());
      sparks.current.forEach(spark => spark.draw(ctx));
      
      smoke.current = smoke.current.filter(smokeParticle => !smokeParticle.update());
      smoke.current.forEach(smokeParticle => smokeParticle.draw(ctx));
      
      ash.current = ash.current.filter(ashParticle => !ashParticle.update());
      ash.current.forEach(ashParticle => ashParticle.draw(ctx));

      const hasParticlesAfterUpdate = bolts.current.length > 0 || sparks.current.length > 0 || 
                          smoke.current.length > 0 || ash.current.length > 0;
      
      if (step === 'idle' && !hasParticlesAfterUpdate) {
        // Stop animation loop if idle and no particles are left
        ctx.clearRect(0, 0, width, height);
      } else {
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };

    // Start animation if not idle or has particles
    const hasParticles = bolts.current.length > 0 || sparks.current.length > 0 || 
                        smoke.current.length > 0 || ash.current.length > 0;
    if (step !== 'idle' || hasParticles) {
      frameCount.current = 0; // Reset frame count for explosion
      animationFrameId.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [step, intensity]);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
        {step === 'exploding' && (
            <div className="absolute inset-0 bg-white" style={{ animation: 'flash-out 0.8s forwards' }} />
        )}
        <style jsx>{`
            @keyframes flash-out {
                0% { opacity: 0.8; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }
        `}</style>
    </div>
  );
};
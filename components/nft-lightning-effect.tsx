'use client';

import { useEffect, useRef } from 'react';

/**
 * Intense lightning effect that appears around a specific NFT card when being burned.
 * The lightning strikes more frequently and intensely as the burn process progresses.
 */
export function NFTLightningEffect({
  isActive,
  intensity = 1,
  targetElementId,
}: {
  isActive: boolean;
  intensity?: number; // 1-3 scale representing the burn step (1: approving CRAA, 2: approving NFT, 3: burning)
  targetElementId?: string; // ID of the element to target with lightning effect
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get target element if ID is provided
    if (targetElementId) {
      targetElementRef.current = document.getElementById(targetElementId);
    }

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Start time for animation
    startTimeRef.current = Date.now();

    // Animation function
    const animate = () => {
      // Respect reduced motion
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        cancelAnimationFrame(animationRef.current);
        return;
      }

      // Soft cap FPS ~45 to reduce strain
      const now = performance.now();
      if (now - lastFrameRef.current < 22) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameRef.current = now;
      if (!ctx) return;
      
      const currentTime = Date.now();
      const elapsed = (currentTime - startTimeRef.current) / 1000; // seconds
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Increase frequency and intensity based on intensity parameter and time
  const baseFrequency = 0.18 + (intensity * 0.18); // slightly softer base
      const timeFactor = Math.min(elapsed / 5, 1); // Increases over 5 seconds
      const frequency = baseFrequency * (1 + timeFactor); // Gets more frequent over time
      
      // Only draw lightning based on frequency
      if (Math.random() < frequency) {
        drawLightning(ctx, canvas.width, canvas.height, intensity, timeFactor);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, intensity, targetElementId]);

  // Draw a lightning bolt
  const drawLightning = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    timeFactor: number
  ) => {
    // Get target element position if available
    let targetX = width / 2;
    let targetY = height / 2;
    let targetWidth = 300;
    let targetHeight = 400;
    
    if (targetElementRef.current) {
      const rect = targetElementRef.current.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
      targetWidth = rect.width;
      targetHeight = rect.height;
    }
    
    // Calculate lightning properties based on intensity and time
  const boltCount = Math.floor(1 + intensity * 1.8 + timeFactor * 2.5); // slightly fewer, cleaner
  const maxAlpha = 0.35 + (intensity * 0.18) + (timeFactor * 0.18); // softer
    
    for (let i = 0; i < boltCount; i++) {
      // Position lightning around the target element
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let startX, startY, endX, endY;
      
      const spread = 30 + intensity * 20; // How far lightning spreads from the element
      
      switch (side) {
        case 0: // top
          startX = targetX + (Math.random() - 0.5) * targetWidth;
          startY = targetY - targetHeight / 2 - Math.random() * spread;
          endX = targetX + (Math.random() - 0.5) * targetWidth * 0.5;
          endY = targetY - targetHeight / 2;
          break;
        case 1: // right
          startX = targetX + targetWidth / 2 + Math.random() * spread;
          startY = targetY + (Math.random() - 0.5) * targetHeight;
          endX = targetX + targetWidth / 2;
          endY = targetY + (Math.random() - 0.5) * targetHeight * 0.5;
          break;
        case 2: // bottom
          startX = targetX + (Math.random() - 0.5) * targetWidth;
          startY = targetY + targetHeight / 2 + Math.random() * spread;
          endX = targetX + (Math.random() - 0.5) * targetWidth * 0.5;
          endY = targetY + targetHeight / 2;
          break;
        case 3: // left
        default:
          startX = targetX - targetWidth / 2 - Math.random() * spread;
          startY = targetY + (Math.random() - 0.5) * targetHeight;
          endX = targetX - targetWidth / 2;
          endY = targetY + (Math.random() - 0.5) * targetHeight * 0.5;
          break;
      }
      
      // Create lightning path
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Create jagged path
  const segments = 7 + Math.floor(intensity * 5) + Math.floor(timeFactor * 5);
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        
        // Add random displacement, increasing with intensity and time
  const displacement = 8 + (intensity * 12) + (timeFactor * 12);
        const dx = (Math.random() - 0.5) * displacement;
        const dy = (Math.random() - 0.5) * displacement * 0.5;
        
        ctx.lineTo(x + dx, y + dy);
      }
      
      ctx.lineTo(endX, endY);
      
  // Style - white core + neon glows (violet/blue)
      const alpha = Math.min(maxAlpha, Math.random() * maxAlpha);

  // Core
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 1 + intensity + (timeFactor * 1.3);
  ctx.stroke();

  // Inner neon (violet)
  ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 0.45})`;
  ctx.lineWidth = 2 + (intensity * 1.4) + (timeFactor * 1.8);
  ctx.stroke();

  // Outer neon (blue)
  ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.25})`;
  ctx.lineWidth = 4 + (intensity * 1.8) + (timeFactor * 2.2);
  ctx.stroke();
    }
  };

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function BackgroundLightning() {
  const [showLightning, setShowLightning] = useState(false);
  const [flames, setFlames] = useState<Array<{id: number, x: number, y: number, intensity: number}>>([]);
  
  useEffect(() => {
    // Show lightning more frequently for burn effect - every 10-20 seconds
    const showLightningPeriodically = () => {
      const delay = 10000 + Math.random() * 10000; // 10-20 seconds
      
      setTimeout(() => {
        setShowLightning(true);
        
        // Generate flame particles during lightning
        const newFlames = Array.from({ length: 5 + Math.floor(Math.random() * 5) }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: 60 + Math.random() * 40, // Bottom area
          intensity: 0.3 + Math.random() * 0.4
        }));
        setFlames(newFlames);
        
        setTimeout(() => {
          setShowLightning(false);
          // Clear flames after lightning
          setTimeout(() => setFlames([]), 2000);
          
          showLightningPeriodically();
        }, 600 + Math.random() * 400); // 600-1000ms
      }, delay);
    };
    
    showLightningPeriodically();
  }, []);
  
  const lightningPosition = {
    left: `${Math.random() * 100}%`,
    opacity: showLightning ? 0.6 : 0, // Higher opacity for burn effect
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Enhanced lightning with burn colors */}
      <motion.div 
        className="absolute top-0 w-[2px] h-full transition-opacity duration-500"
        style={{
          ...lightningPosition,
          // Softer cool gradient instead of burn red/orange
          background: 'linear-gradient(to bottom, #7c3aed, #6366f1, #06b6d4, #0ea5e9)',
          boxShadow: showLightning 
            ? '0 0 8px #6366f1, 0 0 16px #06b6d4, 0 0 24px #0ea5e9' 
            : 'none',
          opacity: lightningPosition.opacity,
        }}
        animate={{
          opacity: showLightning ? [0, 0.8, 0.4, 0.9, 0] : 0,
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.1, 0.3, 0.7, 1],
        }}
      />
      
      {/* Animated flame particles */}
      {flames.map((flame) => (
        <motion.div
          key={flame.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${flame.x}%`,
            top: `${flame.y}%`,
            background: `radial-gradient(circle, rgba(124,58,237,0.95) 0%, rgba(99,102,241,0.85) 40%, rgba(6,182,212,0.45) 80%, transparent 100%)`,
            boxShadow: `0 0 ${4 * flame.intensity}px rgba(99,102,241,0.6)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, flame.intensity, flame.intensity * 0.7, 0],
            scale: [0, 1, 1.2, 0],
            y: [-20, -40, -60, -80],
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* Subtle burn glow overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          // Subtle cool glow instead of red burn tint
          background: 'radial-gradient(ellipse at bottom, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
        animate={{
          opacity: showLightning ? [0, 0.3, 0] : 0,
        }}
        transition={{
          duration: 1.5,
        }}
      />
    </div>
  );
}

export default BackgroundLightning;
'use client';
import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  isLowPerformance: boolean;
  qualityLevel: 'high' | 'medium' | 'low';
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    isLowPerformance: false,
    qualityLevel: 'high'
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;

    const measurePerformance = (currentTime: number) => {
      if (lastFrameTimeRef.current > 0) {
        const frameTime = currentTime - lastFrameTimeRef.current;
        frameTimesRef.current.push(frameTime);

        // Держим только последние 60 кадров для анализа
        if (frameTimesRef.current.length > 60) {
          frameTimesRef.current.shift();
        }

        frameCountRef.current++;

        // Обновляем метрики каждые 30 кадров
        if (frameCountRef.current % 30 === 0 && frameTimesRef.current.length >= 30) {
          const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
          const fps = 1000 / avgFrameTime;

          // Определяем уровень производительности
          let qualityLevel: 'high' | 'medium' | 'low' = 'high';
          let isLowPerformance = false;

          if (fps < 30) {
            qualityLevel = 'low';
            isLowPerformance = true;
          } else if (fps < 45) {
            qualityLevel = 'medium';
            isLowPerformance = true;
          }

          setMetrics({
            fps: Math.round(fps),
            frameTime: Math.round(avgFrameTime * 100) / 100,
            isLowPerformance,
            qualityLevel
          });
        }
      }

      lastFrameTimeRef.current = currentTime;
      animationFrameId = requestAnimationFrame(measurePerformance);
    };

    animationFrameId = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Функция для получения оптимального количества частиц
  const getOptimalParticleCount = (baseCount: number): number => {
    switch (metrics.qualityLevel) {
      case 'low':
        return Math.max(1, Math.floor(baseCount * 0.3)); // 30% от базового
      case 'medium':
        return Math.max(1, Math.floor(baseCount * 0.6)); // 60% от базового
      case 'high':
      default:
        return baseCount;
    }
  };

  // Функция для получения оптимальной интенсивности
  const getOptimalIntensity = (baseIntensity: number): number => {
    switch (metrics.qualityLevel) {
      case 'low':
        return Math.max(1, Math.floor(baseIntensity * 0.5)); // 50% от базовой
      case 'medium':
        return Math.max(1, Math.floor(baseIntensity * 0.75)); // 75% от базовой
      case 'high':
      default:
        return baseIntensity;
    }
  };

  return {
    ...metrics,
    getOptimalParticleCount,
    getOptimalIntensity
  };
}
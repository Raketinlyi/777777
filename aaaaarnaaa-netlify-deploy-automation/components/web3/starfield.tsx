'use client';

import React from 'react';
import { usePerformanceContext } from '@/hooks/use-performance-context';

export function Starfield() {
  const { isLiteMode, isMobile } = usePerformanceContext();

  // Don't render anything in lite mode
  // Always show starfield

  const starCount = isMobile ? 50 : 100;

  return (
    <div className='fixed inset-0 pointer-events-none overflow-hidden'>
      {/* CSS-only starfield */}
      <div className='starfield-container'>
        {/* Layer 1: Small distant stars */}
        <div className='stars-layer-1'></div>

        {/* Layer 2: Medium stars */}
        <div className='stars-layer-2'></div>

        {/* Layer 3: Large bright stars */}
        <div className='stars-layer-3'></div>

        {/* Shooting stars */}
        <div className='shooting-stars'>
          <div className='shooting-star'></div>
          <div className='shooting-star'></div>
          <div className='shooting-star'></div>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .starfield-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .stars-layer-1,
        .stars-layer-2,
        .stars-layer-3 {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        /* Small distant stars */
        .stars-layer-1 {
          background-image:
            radial-gradient(1px 1px at 20px 30px, #fff, transparent),
            radial-gradient(1px 1px at 40px 70px, #fff, transparent),
            radial-gradient(1px 1px at 90px 40px, #fff, transparent),
            radial-gradient(1px 1px at 130px 80px, #fff, transparent),
            radial-gradient(1px 1px at 160px 30px, #fff, transparent);
          background-repeat: repeat;
          background-size: 200px 100px;
          animation: twinkle 4s ease-in-out infinite alternate;
        }

        /* Medium stars */
        .stars-layer-2 {
          background-image:
            radial-gradient(1px 1px at 40px 60px, #00d4ff, transparent),
            radial-gradient(1px 1px at 120px 10px, #00d4ff, transparent),
            radial-gradient(1px 1px at 160px 90px, #00d4ff, transparent);
          background-repeat: repeat;
          background-size: 300px 150px;
          animation: twinkle 6s ease-in-out infinite alternate;
        }

        /* Large bright stars */
        .stars-layer-3 {
          background-image:
            radial-gradient(2px 2px at 100px 50px, #7c3aed, transparent),
            radial-gradient(2px 2px at 200px 100px, #7c3aed, transparent);
          background-repeat: repeat;
          background-size: 400px 200px;
          animation: twinkle 8s ease-in-out infinite alternate;
        }

        @keyframes twinkle {
          from {
            opacity: 0.3;
          }
          to {
            opacity: 1;
          }
        }

        /* Shooting stars */
        .shooting-stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .shooting-star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: linear-gradient(45deg, #fff, transparent);
          border-radius: 50%;
        }

        .shooting-star:nth-child(1) {
          top: 10%;
          left: 10%;
          animation: shoot 3s linear infinite;
          animation-delay: 0s;
        }

        .shooting-star:nth-child(2) {
          top: 30%;
          left: 60%;
          animation: shoot 4s linear infinite;
          animation-delay: 1s;
        }

        .shooting-star:nth-child(3) {
          top: 60%;
          left: 20%;
          animation: shoot 5s linear infinite;
          animation-delay: 2s;
        }

        @keyframes shoot {
          0% {
            transform: rotate(45deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(45deg) translateX(300px);
            opacity: 0;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .stars-layer-1 {
            background-size: 150px 75px;
          }
          .stars-layer-2 {
            background-size: 200px 100px;
          }
          .stars-layer-3 {
            background-size: 250px 125px;
          }
          .shooting-star:nth-child(2),
          .shooting-star:nth-child(3) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

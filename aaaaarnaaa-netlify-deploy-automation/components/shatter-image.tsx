'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import Image from 'next/image';

gsap.registerPlugin(Physics2DPlugin);

type ShatterMode = 'fly' | 'shatter';

interface ShatterImageProps {
  src: string;
  alt?: string;
  className?: string;
  /** maximum number of pieces to create (8-16) */
  maxPieces?: number;
  /** delay before starting to fall (seconds) */
  stillDelay?: number;
  /** total animation duration (seconds) */
  explodeDuration?: number;
  /** mode */
  mode?: ShatterMode;
  priority?: boolean;
}

export function ShatterImage({
  src,
  alt = '',
  className = '',
  maxPieces = 16,
  stillDelay = 0, // No delay for immediate shatter
  mode = 'shatter',
  priority = false,
}: ShatterImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);

  const runFly = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    gsap.to(img, { 
      opacity: 1,
      duration: 0.4,
      onComplete: () => {
        gsap.to(img, {
          delay: stillDelay,
          duration: 1.25,
          scale: 0.1,
          x: window.innerWidth - img.getBoundingClientRect().left + 40,
          y: -(img.getBoundingClientRect().top + img.getBoundingClientRect().height) - 40,
          opacity: 0,
          ease: 'power3.inOut',
        });
      }
    });
  }, [stillDelay]);

  const runShatter = useCallback(() => {
    const img = imgRef.current;
    const wrap = wrapRef.current;
    if (!img || !wrap) return;

    const { width, height } = wrap.getBoundingClientRect();
    wrap.style.width = `${width}px`;
    wrap.style.height = `${height}px`;
    wrap.style.overflow = 'visible'; // Allow pieces to fly out
    wrap.style.position = 'relative';

    const pieces: HTMLDivElement[] = [];
    const pieceCount = Math.max(8, Math.min(maxPieces, 16));
    const gridSize = pieceCount <= 9 ? 3 : 4;
    const pw = width / gridSize;
    const ph = height / gridSize;

    for (let i = 0; i < gridSize * gridSize; i++) {
      const piece = document.createElement('div');
      piece.style.position = 'absolute';
      piece.style.width = `${pw}px`;
      piece.style.height = `${ph}px`;

      const col = i % gridSize;
      const row = Math.floor(i / gridSize);
      const left = col * pw;
      const top = row * ph;

      piece.style.left = `${left}px`;
      piece.style.top = `${top}px`;
      piece.style.backgroundImage = `url(${src})`;
      piece.style.backgroundSize = `${width}px ${height}px`;
      piece.style.backgroundPosition = `-${left}px -${top}px`;
      piece.style.backgroundRepeat = 'no-repeat';
      piece.style.zIndex = '20';
      piece.style.pointerEvents = 'none';
      wrap.appendChild(piece);
      pieces.push(piece);
    }

    // Hide original image immediately
    gsap.set(img, { opacity: 0 });

    const tl = gsap.timeline();

    // Animate pieces with physics
    pieces.forEach((piece, index) => {
      tl.to(
        piece,
        {
          duration: gsap.utils.random(1.5, 2.5),
          physics2D: {
            velocity: gsap.utils.random(300, 500), // Increased velocity
            angle: gsap.utils.random(0, 360),
            gravity: 400, // Add some gravity
          },
          scale: gsap.utils.random(0.2, 0.8),
          rotation: gsap.utils.random(-720, 720),
          opacity: 0,
          ease: 'power2.out',
          onComplete: () => piece.remove(),
        },
        stillDelay // Start animation after the delay
      );
    });
  }, [src, maxPieces, stillDelay]);

  useEffect(() => {
    if (!ready) return;
    // Ensure the shatter effect runs when triggered
    if (mode === 'shatter') {
      runShatter();
    } else if (mode === 'fly') {
      runFly();
    } else {
      // Default state: just show the image
      if(imgRef.current) gsap.set(imgRef.current, { opacity: 1 });
    }
  }, [ready, mode, runFly, runShatter]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        className='object-cover'
        priority={priority}
        onLoadingComplete={() => setReady(true)}
        style={{ opacity: 0 }} // Start with image hidden
      />
    </div>
  );
}

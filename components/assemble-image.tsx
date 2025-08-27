'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * AssembleImage — reverse effect of ShatterImage.
 * Fragments fly in from outside and assemble the image over specified time.
 */
interface AssembleImageProps {
  src: string;
  alt?: string;
  className?: string;
  grid?: number; // divide side into N×N
  assembleDuration?: number; // full assembly time (s)
  priority?: boolean;
  fallbacks?: string[]; // list of alternatives if first image is 404/403
}

const isLocal = (s: string) => s.startsWith('/');

export function AssembleImage({
  src,
  alt = '',
  className = '',
  grid = 6,
  assembleDuration = 4,
  priority = false,
  fallbacks = [],
}: AssembleImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const build = () => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;

    /* clean previous shards */
    wrap.querySelectorAll<HTMLDivElement>('.shard').forEach(el => {
      gsap.killTweensOf(el);
      el.remove();
    });

    let { width, height } = wrap.getBoundingClientRect();
    if (width < 10 || height < 10) {
      width = img.naturalWidth || 300;
      height = img.naturalHeight || 300;
      Object.assign(wrap.style, { width: `${width}px`, height: `${height}px` });
    }

    const bw = width / grid;
    const bh = height / grid;
    const shards: HTMLDivElement[] = [];

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const shard = document.createElement('div');
        shard.className =
          'shard absolute will-change-transform pointer-events-none';

        /* +1 px overlap */
        const w = bw + 2;
        const h = bh + 2;
        const lx = c * bw - 1;
        const ty = r * bh - 1;

        // @ts-expect-error – assigning subset of CSSStyleDeclaration
        Object.assign(shard.style, {
          width: `${w}px`,
          height: `${h}px`,
          left: `${lx}px`,
          top: `${ty}px`,
          backgroundImage: `url(${src})`,
          backgroundSize: `${width}px ${height}px`,
          backgroundPosition: `-${lx}px -${ty}px`,
          backgroundRepeat: 'no-repeat',
          opacity: 0,
        } as CSSStyleDeclaration);

        wrap.appendChild(shard);
        shards.push(shard);
      }
    }

    /* timeline */
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        shards.forEach(s => s.remove());
      },
    });

    // start with shards scattered
    shards.forEach(shard => {
      const dx = gsap.utils.random(-width * 0.8, width * 0.8);
      const dy = gsap.utils.random(-height * 0.8, height * 0.8);
      const rot = gsap.utils.random(-240, 240);
      gsap.set(shard, { x: dx, y: dy, rotation: rot, opacity: 0 });
      tl.to(
        shard,
        {
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          duration: assembleDuration,
        },
        0
      );
    });

    // fade in base image slightly before end
    tl.to(img, { opacity: 1, duration: 0.3 }, assembleDuration - 0.3);
    // fade out shards quickly after assembly
    tl.to(shards, { opacity: 0, duration: 0.4 }, `>${-0.4}`);
  };

  /* hooks */
  useEffect(() => {
    if (!ready) return;
    build();
    const onResize = () => build();
    const ro = new ResizeObserver(build);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [ready, grid, assembleDuration]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <img
        ref={el => {
          imgRef.current = el;
        }}
        src={currentSrc}
        alt={alt}
        className='w-full h-full object-contain'
        onLoad={() => setReady(true)}
        onError={() => {
          if (fallbacks.length) {
            const next = fallbacks.shift()!;
            setCurrentSrc(next);
          } else {
            setCurrentSrc('/placeholder-logo.png');
          }
        }}
        style={{ opacity: 0 }}
      />
    </div>
  );
}

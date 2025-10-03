"use client";

import React, { useRef, useState } from "react";
import { motion, type MotionStyle, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";

type MotionDivProProps = Omit<HTMLMotionProps<"div">, "ref"> & {
  children?: React.ReactNode;
  className?: string;
  /** 0 = subtle, 1 = medium, 2 = strong */
  intensity?: 0 | 1 | 2;
  /** Enable interactive tilt on pointer move */
  interactive?: boolean;
};

type IntensityLevel = 0 | 1 | 2;

const getIntensitySettings = (level: IntensityLevel) => {
  switch (level) {
    case 2:
      return {
        factor: 8,
        ring: "ring-1 ring-white/20",
        glow: "shadow-[0_0_40px_-10px_rgba(147,51,234,0.45)]",
      } as const;
    case 1:
      return {
        factor: 5,
        ring: "ring-1 ring-white/10",
        glow: "shadow-[0_0_26px_-10px_rgba(147,51,234,0.35)]",
      } as const;
    default:
      return {
        factor: 3,
        ring: "ring-0",
        glow: "shadow-[0_0_18px_-12px_rgba(147,51,234,0.25)]",
      } as const;
  }
};

/**
 * A polished, modern animated container for any content.
 * Adds smooth entrance, soft glow, gradient sheen and optional interactive tilt.
 * Designed to remove the "kolkhoz" feel and match top-tier web design aesthetics.
 */
export default function MotionDivPro(props: Readonly<MotionDivProProps>) {
  const {
    children,
    className,
    intensity = 0,
    interactive = true,
    style,
    ...rest
  } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const { factor, ring, glow } = getIntensitySettings(intensity);

  const onMove = (e: React.MouseEvent) => {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width; // -0.5..0.5
    const dy = (e.clientY - cy) / rect.height; // -0.5..0.5
    setTilt({ x: dy * factor, y: -dx * factor });
  };

  const onLeave = () => setTilt({ x: 0, y: 0 });

  const motionStyle: MotionStyle = {
    transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
  };

  if (style) {
    Object.assign(motionStyle, style);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={motionStyle}
      className={clsx(
        "relative overflow-hidden rounded-2xl backdrop-blur-sm",
        // base surface
        "bg-[radial-gradient(150%_100%_at_0%_0%,rgba(99,102,241,.12),transparent_60%),radial-gradient(120%_80%_at_100%_100%,rgba(244,114,182,.12),transparent_60%)]",
        // gradient sheen (animated)
        "before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.08),transparent)] before:bg-[length:200%_100%] before:animate-[sheen_5s_linear_infinite] before:pointer-events-none",
        // noise overlay for premium finish
        "after:absolute after:inset-0 after:bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\" viewBox=\"0 0 120 120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"1\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.03\"/></svg>')] after:mix-blend-soft-light after:pointer-events-none",
        glow,
        ring,
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// Keyframes for gradient sheen
// Tailwind can't declare custom @keyframes inline in TS; rely on globals.css.
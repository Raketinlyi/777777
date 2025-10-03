"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface AutoFitTextProps {
  children: React.ReactNode;
  minScale?: number; // 0.7..1
  align?: "left" | "center" | "right";
  className?: string;
}

// Scales down text to fit its container width (never upscales)
export const AutoFitText: React.FC<AutoFitTextProps> = ({
  children,
  minScale = 0.8,
  align = "right",
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const update = useCallback(() => {
    const c = containerRef.current;
    const t = contentRef.current;
    if (!c || !t) return;
    // reset to natural size first
    t.style.transform = "scale(1)";
    t.style.whiteSpace = "nowrap";

    const cw = c.clientWidth;
    const tw = t.scrollWidth;
    if (tw <= 0 || cw <= 0) return;
    const nextScale = Math.min(1, Math.max(minScale, cw / tw));
    setScale(nextScale);
  }, [minScale]);

  useLayoutEffect(() => { update(); }, [update]);
  useEffect(() => {
    update();
    const RZ: typeof ResizeObserver | undefined = typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined;
    const ro = RZ ? new RZ(() => update()) : undefined;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    if (ro && contentRef.current) ro.observe(contentRef.current);
    window.addEventListener('resize', update);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const origin = align === "left" ? "left center" : align === "center" ? "center" : "right center";

  return (
    <div ref={containerRef} className={className} style={{ overflow: "hidden" }}>
      <div ref={contentRef} style={{ display: "inline-block", transform: `scale(${scale})`, transformOrigin: origin }}>
        {children}
      </div>
    </div>
  );
};

export default AutoFitText;

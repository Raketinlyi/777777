'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

export function withIdleImport<T extends object>(
  importer: () => Promise<{ default: React.ComponentType<T> }>,
  options?: { ssr?: boolean }
) {
  const Noop = () => null;
  const ComponentLazy = dynamic(importer, {
    ssr: options?.ssr ?? false,
    loading: () => null,
  });
  const Wrapper = (props: T) => {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      if (typeof window === 'undefined') return;
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => setReady(true));
      } else {
        setTimeout(() => setReady(true), 200);
      }
    }, []);
    if (!ready) return null;
    return <ComponentLazy {...props} />;
  };
  return Wrapper as unknown as React.FC<T>;
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  IPFS_GATEWAYS,
  markGatewayFailed,
  resolveIpfsUrl,
  cacheSuccessfulGateway,
  invalidateCachedGateway,
} from '@/lib/ipfs';

interface IpfsImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  tokenId?: string | number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export function IpfsImage({
  src,
  alt,
  width = 200,
  height = 200,
  className = '',
  fallbackSrc = '/icons/favicon-180x180.png',
  tokenId,
  fill = false,
  sizes,
  priority = false,
  loading = 'lazy',
}: Readonly<IpfsImageProps>) {
  // Use ref to track if component is mounted and prevent resets
  const isMountedRef = useRef(false);
  const lastSrcRef = useRef(src);
  
  const [currentSrc, setCurrentSrc] = useState(() => resolveIpfsUrl(src));
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Only reset when src actually changes (not on every rerender)
  useEffect(() => {
    if (lastSrcRef.current !== src) {
      lastSrcRef.current = src;
      setCurrentSrc(resolveIpfsUrl(src));
      setGatewayIndex(0);
      setHasError(false);
      isMountedRef.current = false;
    }
  }, [src]);

  const handleLoad = () => {
    // Cache successful URL for this IPFS hash
    if (!isMountedRef.current) {
      const ipfsRegex = /\/ipfs\/([A-Za-z0-9]+)(\/.*)?$/;
      const match = ipfsRegex.exec(currentSrc);
      if (match) {
        const ipfsHash = match[1] + (match[2] || '');
        cacheSuccessfulGateway(ipfsHash, currentSrc);
      }
      isMountedRef.current = true;
    }
  };

  const handleError = () => {
    // Extract IPFS hash from current URL
    const ipfsRegex = /\/ipfs\/([A-Za-z0-9]+)(\/.*)?$/;
    const match = ipfsRegex.exec(currentSrc);
    const ipfsPath = match ? match[1] + (match[2] || '') : null;

    if (ipfsPath) {
      invalidateCachedGateway(ipfsPath);
    }
    
    if (match && gatewayIndex < IPFS_GATEWAYS.length - 1) {
      const nextIndex = gatewayIndex + 1;
      const nextGateway = IPFS_GATEWAYS[nextIndex];
      
      // Mark current gateway as failed
      if (IPFS_GATEWAYS[gatewayIndex]) {
        markGatewayFailed(IPFS_GATEWAYS[gatewayIndex]);
      }
      
      // Try next gateway
      setCurrentSrc(`${nextGateway}${ipfsPath}`);
      setGatewayIndex(nextIndex);
      return;
    }

    // Try local fallback images for specific tokens
    if (tokenId && !hasError) {
      const idx = Number(tokenId) % 7 || 7;
      setCurrentSrc(`/images/zol${idx}.png`);
      setHasError(true);
      return;
    }

    // Final fallback to favicon
    setCurrentSrc(fallbackSrc);
  };

  const imageDimensionProps = fill
    ? { fill: true as const }
    : { width, height };

  const resolvedLoading = priority ? undefined : loading ?? 'lazy';

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      sizes={sizes}
      priority={priority}
      {...(resolvedLoading ? { loading: resolvedLoading } : {})}
      unoptimized
      {...imageDimensionProps}
    />
  );
}

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IPFS_GATEWAYS } from '@/lib/ipfs';

interface IpfsImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  tokenId?: string | number;
}

// Convert ipfs:// URLs to HTTPS gateway
const resolveImageSrc = (url?: string) => {
  if (!url) return '/favicon.ico';
  if (url.startsWith('ipfs://')) {
    return `https://nftstorage.link/ipfs/${url.slice(7)}`;
  }
  if (url.startsWith('https://')) {
    return url;
  }
  return '/favicon.ico';
};

export function IpfsImage({
  src,
  alt,
  width = 200,
  height = 200,
  className = '',
  fallbackSrc = '/favicon.ico',
  tokenId,
}: IpfsImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Reset when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setGatewayIndex(0);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    // If original src failed, try IPFS gateways
    if (
      src.includes('d35a2j13p9i4c9.cloudfront.net') ||
      src.includes('cloudflare-ipfs.com')
    ) {
      // Extract IPFS hash from known patterns
      const ipfsMatch =
        src.match(/ipfs\/([^\/]+)\/(.+)/) ||
        src.match(/QmdRAv2R2MNWEfT3kpostz13qVrDdD2j62jW2i2sra2aA1\/(.+)/);

      if (ipfsMatch && tokenId) {
        const fileName = ipfsMatch[1] || `${tokenId}.png`;
        const ipfsHash = 'QmdRAv2R2MNWEfT3kpostz13qVrDdD2j62jW2i2sra2aA1';

        if (gatewayIndex < IPFS_GATEWAYS.length) {
          const newSrc = `${IPFS_GATEWAYS[gatewayIndex]}${ipfsHash}/${fileName}`;
          setCurrentSrc(newSrc);
          setGatewayIndex(gatewayIndex + 1);
          return;
        }
      }
    }

    // Try next IPFS gateway if available
    if (gatewayIndex < IPFS_GATEWAYS.length && src.startsWith('ipfs://')) {
      const ipfsHash = src.replace('ipfs://', '');
      const newSrc = `${IPFS_GATEWAYS[gatewayIndex]}${ipfsHash}`;
      setCurrentSrc(newSrc);
      setGatewayIndex(gatewayIndex + 1);
      return;
    }

    // Try local fallback images for specific tokens
    if (tokenId && !hasError) {
      const idx = Number(tokenId) % 7 || 7;
      setCurrentSrc(`/images/zol${idx}.png`);
      setHasError(true);
      return;
    }

    // Final fallback
    setCurrentSrc(fallbackSrc);
  };

  return (
    <Image
      src={resolveImageSrc(currentSrc)}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized // Disable optimization for external URLs
    />
  );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface NFTImageProps {
  tokenId: string;
  className?: string;
  size?: number;
  status?: 'normal' | 'burned' | 'revived';
  alt?: string;
}

export const NFTImage: React.FC<NFTImageProps> = ({
  tokenId,
  className,
  size = 200,
  status = 'normal',
  alt,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Определяем источник изображения
  const getImageSrc = (): string => {
    if (status === 'burned') {
      return '/images/burned-nft-placeholder.svg';
    }
    if (status === 'revived') {
      return '/images/revived-nft-placeholder.svg';
    }
    if (imageError) {
      return '/placeholder.svg';
    }
    
    // Пробуем разные форматы NFT изображений
    const possibleSources = [
      `/images/${tokenId}.jpg`,
      `/images/${tokenId}.png`,
      `/images/cube${tokenId}.png`,
      `/images/nft_${tokenId}.jpg`,
    ];
    
    return possibleSources[0] ?? '/placeholder.svg'; // Начинаем с первого, fallback если undefined
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg",
        status === 'burned' && "ring-2 ring-red-500/50",
        status === 'revived' && "ring-2 ring-green-500/50",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      
      {/* Main image */}
      <Image
        src={getImageSrc()}
        alt={alt || `NFT #${tokenId}`}
        width={size}
        height={size}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          status === 'burned' && "grayscale contrast-125",
          status === 'revived' && "brightness-110 saturate-125"
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={false}
      />
      
      {/* Status overlay */}
      {status !== 'normal' && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className={cn(
            "px-2 py-1 rounded text-xs font-bold text-white shadow-lg",
            status === 'burned' && "bg-red-600/90",
            status === 'revived' && "bg-green-600/90"
          )}>
            {status === 'burned' ? '🔥 BURNED' : '✨ REVIVED'}
          </div>
        </div>
      )}
      
      {/* Glow effect for special states */}
      {status === 'revived' && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-blue-400/20 to-purple-400/20 rounded-lg animate-pulse" />
      )}
      
      {status === 'burned' && (
        <div className="absolute inset-0 bg-gradient-to-t from-red-600/30 via-orange-500/20 to-yellow-400/10 rounded-lg" />
      )}
    </div>
  );
};

export default NFTImage;
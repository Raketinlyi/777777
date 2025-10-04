import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { IpfsImage } from '@/components/IpfsImage';

export interface UnifiedNftCardProps {
  imageSrc: string | null;
  tokenId: string | number;
  title?: string;
  rarityLabel?: string;
  rarityColorClass?: string; // tailwind text / bg color classes
  widgets?: ReactNode[]; // custom widgets (e.g. CRA badge, stars row, ping status …)
  highlight?: boolean; // e.g. selected
  delay?: number; // animation delay sec
  onClick?: () => void;
  imageOverlay?: ReactNode;
  imageOverlayClassName?: string;
}

export const UnifiedNftCard = React.memo(function UnifiedNftCard({
  imageSrc,
  tokenId,
  title,
  rarityLabel,
  rarityColorClass = 'text-white',
  widgets = [],
  highlight = false,
  delay = 0,
  onClick,
  imageOverlay,
  imageOverlayClassName,
}: UnifiedNftCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.03 }}
      className='group'
      onClick={() => {
        onClick?.();
      }}
    >
      <Card
        className={`bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 transition-all duration-300 ${
          highlight
            ? 'border-orange-500 shadow-lg shadow-orange-500/25'
            : 'border-slate-700 group-hover:border-orange-500/50'
        }`}
      >
        <CardHeader className='pb-2'>
          <div className='relative'>
            <div className='aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center overflow-hidden'>
              {imageSrc ? (
                <IpfsImage
                  src={imageSrc}
                  alt={title || `NFT #${tokenId}`}
                  width={240}
                  height={240}
                  className='w-full h-full object-cover'
                />
              ) : (
                <span className='text-xl font-bold text-white'>#{tokenId}</span>
              )}
              {imageOverlay && (
                <div
                  className={cn(
                    'absolute inset-0 pointer-events-none',
                    imageOverlayClassName
                  )}
                >
                  {imageOverlay}
                </div>
              )}
            </div>
            {rarityLabel && (
              <span
                className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-xs font-semibold ${rarityColorClass}`}
              >
                {rarityLabel}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-center space-y-1 min-h-[80px] flex flex-col items-center justify-start'>
            <h3 className='font-semibold text-white text-xs'>
              {title || `Token #${tokenId}`}
            </h3>
            {/* widgets row */}
            {widgets.length > 0 && (
              <div className='flex flex-wrap items-center justify-center gap-0.5 mt-1'>
                {widgets.map((w, idx) => (
                  <span key={idx}>{w}</span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StarState } from '@/lib/stars';

interface StarMeterProps {
  state: StarState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClassMap: Record<NonNullable<StarMeterProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarMeter({ state, size = 'sm', className }: StarMeterProps) {
  const iconSizeClass = sizeClassMap[size];

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <div className='flex items-center gap-0.5'>
        {Array.from({ length: state.totalBase }).map((_, idx) => {
          const isActive = idx < state.activeBase;
          return (
            <Star
              key={`base-${idx}`}
              className={cn(
                iconSizeClass,
                isActive
                  ? 'text-yellow-300 drop-shadow-sm'
                  : 'text-yellow-300/40'
              )}
              fill={isActive ? 'currentColor' : 'none'}
              strokeWidth={isActive ? 0 : 1.5}
            />
          );
        })}
      </div>
      {state.bonusSlots > 0 && (
        <div className='flex items-center gap-0.5 ml-1'>
          {Array.from({ length: state.bonusSlots }).map((_, idx) => {
            const isActive = idx < state.activeBonus;
            return (
              <Star
                key={`bonus-${idx}`}
                className={cn(
                  iconSizeClass,
                  isActive ? 'text-sky-300 drop-shadow-sm' : 'text-sky-300/40'
                )}
                fill={isActive ? 'currentColor' : 'none'}
                strokeWidth={isActive ? 0 : 1.5}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

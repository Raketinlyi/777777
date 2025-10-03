'use client';

import type React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useMobile } from '@/hooks/use-mobile';

interface StatsCardProps {
  title: string;
  value: string | number | undefined;
  description?: string;
  icon?: React.ReactNode;
  color?:
    | 'blue'
    | 'pink'
    | 'green'
    | 'orange'
    | 'purple'
    | 'cyan'
    | 'red'
    | 'yellow'
    | 'slate'
    | 'emerald'
    | 'amber'
    | 'indigo'
    | 'rose'
    | 'teal';
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  color = 'blue',
  loading = false,
}: StatsCardProps) {
  const isMobile = useMobile();

  // Define color classes based on selected theme color
  const colorClasses = {
    blue: {
      bg: 'from-blue-900/40 to-indigo-900/40',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'bg-blue-500/20',
    },
    pink: {
      bg: 'from-pink-900/40 to-rose-900/40',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
      glow: 'bg-pink-500/20',
    },
    green: {
      bg: 'from-green-900/40 to-emerald-900/40',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'bg-green-500/20',
    },
    orange: {
      bg: 'from-orange-900/40 to-amber-900/40',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      glow: 'bg-orange-500/20',
    },
    purple: {
      bg: 'from-purple-900/40 to-violet-900/40',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'bg-purple-500/20',
    },
    cyan: {
      bg: 'from-cyan-900/40 to-sky-900/40',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'bg-cyan-500/20',
    },
    red: {
      bg: 'from-red-900/40 to-pink-900/40',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'bg-red-500/20',
    },
    yellow: {
      bg: 'from-yellow-900/40 to-amber-900/40',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      glow: 'bg-yellow-500/20',
    },
    slate: {
      bg: 'from-slate-900/40 to-gray-900/40',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      glow: 'bg-slate-500/20',
    },
    emerald: {
      bg: 'from-emerald-900/40 to-green-900/40',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'bg-emerald-500/20',
    },
    amber: {
      bg: 'from-amber-900/40 to-yellow-900/40',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'bg-amber-500/20',
    },
    indigo: {
      bg: 'from-indigo-900/40 to-purple-900/40',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
      glow: 'bg-indigo-500/20',
    },
    rose: {
      bg: 'from-rose-900/40 to-pink-900/40',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      glow: 'bg-rose-500/20',
    },
    teal: {
      bg: 'from-teal-900/40 to-cyan-900/40',
      border: 'border-teal-500/30',
      text: 'text-teal-400',
      glow: 'bg-teal-500/20',
    },
  };

  return (
    <Card
      className={`overflow-hidden bg-gradient-to-br ${colorClasses[color].bg} border ${
        colorClasses[color].border
      } backdrop-blur-sm relative`}
    >
      {/* Animated glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-xl ${colorClasses[color].glow} blur-xl`}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />

      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium text-slate-300 flex items-center'>
          {icon && <span className='mr-2'>{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='animate-pulse h-8 bg-slate-700/50 rounded-md w-3/4'></div>
        ) : (
          <>
            <div className={`text-2xl font-bold ${colorClasses[color].text}`}>
              {typeof value === 'number' ||
              (typeof value === 'string' && !isNaN(Number(value)))
                ? new Intl.NumberFormat('en-US', {
                    maximumFractionDigits: 2,
                  }).format(Number(value))
                : value}
            </div>
            {description && (
              <p className='text-xs text-slate-400 mt-1'>{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

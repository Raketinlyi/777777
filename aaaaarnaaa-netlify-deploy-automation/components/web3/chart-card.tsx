'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  color?: 'blue' | 'pink' | 'green' | 'orange' | 'purple' | 'cyan';
  loading?: boolean;
}

export function ChartCard({
  title,
  children,
  icon,
  color = 'blue',
  loading = false,
}: ChartCardProps) {
  const isMobile = useMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        <CardTitle className='text-lg font-medium text-slate-200 flex items-center'>
          {icon && <span className='mr-2'>{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='flex justify-center items-center py-12'>
            <Loader2 className='h-8 w-8 text-slate-400 animate-spin' />
          </div>
        ) : (
          <>{isClient && children}</>
        )}
      </CardContent>
    </Card>
  );
}

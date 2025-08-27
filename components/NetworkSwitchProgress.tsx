'use client';

import { motion } from 'framer-motion';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface NetworkSwitchProgressProps {
  isSwitching: boolean;
  switchAttempts: number;
  maxAttempts: number;
  isApeChain: boolean;
  onForceSwitch: () => void;
}

export function NetworkSwitchProgress({
  isSwitching,
  switchAttempts,
  maxAttempts,
  isApeChain,
  onForceSwitch,
}: NetworkSwitchProgressProps) {
  const progress = (switchAttempts / maxAttempts) * 100;

  if (isApeChain) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='p-4 bg-green-900/50 border border-green-500/50 rounded-xl backdrop-blur-sm'
      >
        <div className='flex items-center gap-3'>
          <CheckCircle className='w-5 h-5 text-green-400' />
          <div>
            <h3 className='text-green-300 font-semibold'>
              Connected to ApeChain
            </h3>
            <p className='text-green-200 text-sm'>
              You&apos;re ready to use CrazyCube dApp! 🚀
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isSwitching) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='p-4 bg-blue-900/50 border border-blue-500/50 rounded-xl backdrop-blur-sm'
      >
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <RefreshCw className='w-5 h-5 text-blue-400 animate-spin' />
            <div>
              <h3 className='text-blue-300 font-semibold'>
                Switching to ApeChain
              </h3>
              <p className='text-blue-200 text-sm'>
                Attempt {switchAttempts} of {maxAttempts}
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <Progress value={progress} className='h-2' />
            <p className='text-blue-200 text-xs'>
              {switchAttempts > 0 && `Attempt ${switchAttempts} in progress...`}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='p-4 bg-red-900/50 border border-red-500/50 rounded-xl backdrop-blur-sm'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <AlertTriangle className='w-5 h-5 text-red-400' />
          <div>
            <h3 className='text-red-300 font-semibold'>Wrong Network</h3>
            <p className='text-red-200 text-sm'>
              Please switch to ApeChain to use this dApp
            </p>
          </div>
        </div>
        <Button
          onClick={onForceSwitch}
          variant='outline'
          size='sm'
          className='border-red-500 text-red-300 hover:bg-red-500/20'
        >
          Force Switch
        </Button>
      </div>
    </motion.div>
  );
}

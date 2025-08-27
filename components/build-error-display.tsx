'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function BuildErrorDisplay() {
  const [buildErrors, setBuildErrors] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only check for build errors in development
    if (process.env.NODE_ENV !== 'development') return;

    try {
      const storedErrors = localStorage.getItem('build_errors');
      if (storedErrors) {
        const errors = JSON.parse(storedErrors);
        if (Array.isArray(errors) && errors.length > 0) {
          setBuildErrors(errors);
          setIsVisible(true);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Build error display error:', errorMessage);
    }
  }, []);

  const clearErrors = () => {
    localStorage.removeItem('build_errors');
    setBuildErrors([]);
    setIsVisible(false);
  };

  if (
    !isVisible ||
    buildErrors.length === 0 ||
    process.env.NODE_ENV !== 'development'
  ) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-auto p-4 flex items-center justify-center'>
      <Card className='w-full max-w-3xl'>
        <CardHeader className='bg-red-900/50'>
          <CardTitle className='text-white'>
            Build Errors Detected (Dev Mode)
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          <div className='mb-4'>
            <p className='text-red-400 mb-2'>
              The following errors were detected during build:
            </p>
            <div className='bg-black/50 p-4 rounded-md overflow-auto max-h-[60vh]'>
              {buildErrors.map((error, index) => (
                <div
                  key={index}
                  className='mb-2 text-white font-mono text-sm whitespace-pre-wrap'
                >
                  {/* Safe text rendering - no HTML injection possible */}
                  {String(error).replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
              ))}
            </div>
          </div>
          <div className='flex justify-end'>
            <Button onClick={clearErrors} variant='destructive'>
              Clear Errors
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

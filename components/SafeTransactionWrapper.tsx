'use client';

import React, { ReactNode, Suspense } from 'react';
import { ErrorBoundary, TransactionErrorBoundary } from './ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface SafeTransactionWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  type?: 'ping' | 'burn' | 'breed' | 'claim' | 'general';
}

const defaultLoadingFallback = (
  <Card className='w-full max-w-[280px] mx-auto'>
    <CardContent className='p-4 space-y-3'>
      <Skeleton className='h-20 w-20 rounded-lg mx-auto' />
      <Skeleton className='h-4 w-16 mx-auto' />
      <div className='space-y-2'>
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-3/4' />
      </div>
      <Skeleton className='h-8 w-full' />
    </CardContent>
  </Card>
);

/**
 * Safe wrapper for transaction components that provides:
 * - Error boundaries for graceful error handling
 * - Suspense for loading states
 * - Type-specific error messages
 * - Netlify-compatible rendering
 */
export const SafeTransactionWrapper: React.FC<SafeTransactionWrapperProps> = ({
  children,
  fallback,
  loadingFallback = defaultLoadingFallback,
  type = 'general',
}) => {
  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={loadingFallback}>
        {type === 'ping' ||
        type === 'burn' ||
        type === 'breed' ||
        type === 'claim' ? (
          <TransactionErrorBoundary>{children}</TransactionErrorBoundary>
        ) : (
          children
        )}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * HOC for wrapping components with safe transaction handling
 */
export const withSafeTransaction = <P extends object>(
  Component: React.ComponentType<P>,
  type: SafeTransactionWrapperProps['type'] = 'general'
) => {
  const WrappedComponent = (props: P) => (
    <SafeTransactionWrapper type={type}>
      <Component {...props} />
    </SafeTransactionWrapper>
  );

  WrappedComponent.displayName = `withSafeTransaction(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default SafeTransactionWrapper;

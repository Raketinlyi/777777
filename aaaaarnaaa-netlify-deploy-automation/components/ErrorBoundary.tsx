'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className='max-w-md mx-auto mt-8 border-red-500/50 bg-red-900/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-400'>
              <AlertTriangle className='w-5 h-5' />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-red-300 text-sm'>
              An error occurred. Please try refreshing the page.
            </p>

            <div className='flex gap-2'>
              <Button
                onClick={this.handleRetry}
                variant='outline'
                size='sm'
                className='border-red-500/50 text-red-300 hover:bg-red-500/10'
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                Try Again
              </Button>

              <Button
                onClick={() => {
                  // Мягкий reset состояния без перезагрузки страницы
                  this.setState({ hasError: false, error: null });
                }}
                variant='outline'
                size='sm'
                className='border-red-500/50 text-red-300 hover:bg-red-500/10'
              >
                Reset State
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export const TransactionErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  
  const fallback = (
    <Card className='border-orange-500/50 bg-orange-950/20'>
      <CardHeader>
        <CardTitle className='text-orange-400 flex items-center gap-2'>
          <AlertTriangle className='w-5 h-5' />
          Transaction Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-orange-300 text-sm mb-4'>
          There was an error with the transaction component. Your wallet and
          funds are safe.
        </p>
        <Button
          onClick={() => {
            // Мягкий reset состояния и обновление данных
            queryClient.invalidateQueries();
            // Перерендер компонента
            window.location.hash = '#refresh';
            window.location.hash = '';
          }}
          variant='outline'
          size='sm'
          className='border-orange-500/50 text-orange-300 hover:bg-orange-500/10'
        >
          <RefreshCw className='w-4 h-4 mr-2' />
          Reset & Refresh
        </Button>
      </CardContent>
    </Card>
  );

  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
};

export default ErrorBoundary;

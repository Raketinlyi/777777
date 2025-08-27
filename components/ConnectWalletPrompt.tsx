import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle } from 'lucide-react';

interface ConnectWalletPromptProps {
  title?: string;
  description?: string;
  onConnect: () => void;
  isConnecting?: boolean;
}

export function ConnectWalletPrompt({
  title = 'Connect Wallet',
  description = 'To view your NFTs and use all game features, you need to connect your wallet.',
  onConnect,
  isConnecting = false,
}: ConnectWalletPromptProps) {
  return (
    <Card className='max-w-md mx-auto'>
      <CardContent className='pt-6 text-center'>
        <div className='mb-4'>
          <div className='w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center'>
            <Wallet className='w-8 h-8 text-primary' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>{title}</h3>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>

        <Button onClick={onConnect} disabled={isConnecting} className='w-full'>
          {isConnecting ? (
            <>
              <div className='w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin' />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className='w-4 h-4 mr-2' />
              Connect Wallet
            </>
          )}
        </Button>

        <div className='mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800'>
          <div className='flex items-start space-x-2'>
            <AlertCircle className='w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0' />
            <p className='text-xs text-yellow-700 dark:text-yellow-300'>
              Data is only shown for connected wallets. We don&apos;t show fake
              balances.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

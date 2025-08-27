'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WEB_MODEL3_ID, webModel3Utils } from '@/lib/web-model3';
import { toast } from '@/hooks/use-toast';

interface WebModel3InfoProps {
  className?: string;
}

export function WebModel3Info({ className = '' }: WebModel3InfoProps) {
  const modelData = {
    id: WEB_MODEL3_ID,
    isActive: true,
    timestamp: Date.now(),
    source: 'WalletConnect',
    version: '1.0.0',
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'ID copied to clipboard',
    });
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Database className='h-5 w-5' />
          Web Model 3 Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Status:</span>
          <Badge
            variant={modelData.isActive ? 'default' : 'secondary'}
            className='flex items-center gap-1'
          >
            {modelData.isActive ? (
              <CheckCircle2 className='h-3 w-3' />
            ) : (
              <AlertCircle className='h-3 w-3' />
            )}
            {modelData.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Model ID */}
        <div className='space-y-2'>
          <span className='text-sm font-medium'>Model ID:</span>
          <div className='flex items-center gap-2'>
            <code className='flex-1 bg-muted p-2 rounded text-xs break-all'>
              {modelData.id}
            </code>
            <Button
              variant='outline'
              size='sm'
              onClick={() => copyToClipboard(modelData.id)}
            >
              <Copy className='h-3 w-3' />
            </Button>
          </div>
          <div className='text-xs text-muted-foreground'>
            Formatted: {webModel3Utils.formatModelId(modelData.id)}
          </div>
        </div>

        {/* Source */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Source:</span>
          <span className='text-sm text-muted-foreground'>
            {modelData.source}
          </span>
        </div>

        {/* Version */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Version:</span>
          <span className='text-sm text-muted-foreground'>
            {modelData.version}
          </span>
        </div>

        {/* Validation */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>ID Valid:</span>
          <Badge
            variant={
              webModel3Utils.isValidModelId(modelData.id)
                ? 'default'
                : 'destructive'
            }
          >
            {webModel3Utils.isValidModelId(modelData.id) ? 'Valid' : 'Invalid'}
          </Badge>
        </div>

        {/* Configuration Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Configured:</span>
          <Badge
            variant={webModel3Utils.isConfigured() ? 'default' : 'secondary'}
          >
            {webModel3Utils.isConfigured() ? 'Custom' : 'Default'}
          </Badge>
        </div>

        {/* Usage Info */}
        <div className='bg-muted/50 p-3 rounded-lg'>
          <h4 className='text-sm font-medium mb-2'>Usage:</h4>
          <p className='text-xs text-muted-foreground'>
            This ID is used for WalletConnect integration. It&apos;s securely
            stored in environment variables and automatically loaded when the
            application starts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for list display
export function WebModel3Card({ className = '' }: { className?: string }) {
  return (
    <Card className={`${className}`}>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-medium'>Web Model 3</h3>
            <p className='text-sm text-muted-foreground'>
              {webModel3Utils.formatModelId(WEB_MODEL3_ID)}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='default'>
              <CheckCircle2 className='h-3 w-3 mr-1' />
              Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

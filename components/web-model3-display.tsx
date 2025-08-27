import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';
import { WEB_MODEL3_ID, webModel3Utils } from '@/lib/web-model3';

export function WebModel3Display() {
  return (
    <Card className='bg-black/20 backdrop-blur-sm border-white/10'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-white'>
          <Database className='h-5 w-5' />
          Web Model 3 Display
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='text-sm text-white/70'>
            Current Model ID:{' '}
            <code className='bg-white/10 px-2 py-1 rounded'>
              {webModel3Utils.formatModelId(WEB_MODEL3_ID)}
            </code>
          </div>
          <div className='text-xs text-white/50'>Full ID: {WEB_MODEL3_ID}</div>
        </div>
      </CardContent>
    </Card>
  );
}

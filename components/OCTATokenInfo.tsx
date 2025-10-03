import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OCTATokenInfo() {
  return (
    <Card className="bg-slate-900/60 border-purple-500/20">
      <CardHeader>
        <CardTitle>OCTAA token info (placeholder)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">OCTAA metrics are available in the web-model and rewards sections.</p>
      </CardContent>
    </Card>
  );
}

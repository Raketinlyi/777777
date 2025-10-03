import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubgraphStats() {
  return (
    <Card className="bg-slate-900/60 border-slate-700/20">
      <CardHeader>
        <CardTitle>Live data (placeholder)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">Subgraph statistics will appear here.</p>
      </CardContent>
    </Card>
  );
}

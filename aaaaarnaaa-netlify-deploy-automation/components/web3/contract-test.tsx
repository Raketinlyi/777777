'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createPublicClient, http } from 'viem';
import { monadChain } from '@/config/chains';
import { CRAZY_OCTAGON_READER_ABI } from '@/lib/abi/crazyOctagon';

export default function ContractTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testContractConnection = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // Log contract addresses for debugging
      console.log('Contract configuration:', monadChain.contracts);
      
      const READER_ADDRESS = monadChain.contracts.reader?.address || 
                            monadChain.contracts.lpManager?.address ||
                            monadChain.contracts.gameProxy?.address;
                            
      if (!READER_ADDRESS) {
        throw new Error('Reader contract address not found');
      }
      
      setResult(`Reader Address: ${READER_ADDRESS}`);
      
      const client = createPublicClient({ 
        chain: monadChain, 
        transport: http() 
      });
      
      // Test a simple read function
      const globalStats = await client.readContract({
        address: READER_ADDRESS as `0x${string}`,
        abi: CRAZY_OCTAGON_READER_ABI,
        functionName: 'getGlobalStats',
      }) as readonly unknown[];
      
      setResult(`Contract connection successful!\nTotal Locked: ${globalStats[0]}\nMonthly Pool: ${globalStats[1]}`);
    } catch (error) {
      console.error('Contract test error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
      <h3 className='text-lg font-bold text-white mb-4'>Contract Connection Test</h3>
      <Button 
        onClick={testContractConnection} 
        disabled={loading}
        className='bg-blue-600 hover:bg-blue-700 mb-4'
      >
        {loading ? 'Testing...' : 'Test Contract Connection'}
      </Button>
      {result && (
        <div className='bg-slate-900/50 rounded-lg p-3'>
          <pre className='text-sm text-white whitespace-pre-wrap'>{result}</pre>
        </div>
      )}
    </Card>
  );
}
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database, Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import { WebModel3Info, WebModel3Card } from '@/components/web-model3-info';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WebModel3Page() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='flex items-center gap-4 mb-8'
        >
          <Link href='/'>
            <Button
              variant='ghost'
              size='sm'
              className='text-white hover:bg-white/10'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-2'>
              <Database className='h-8 w-8' />
              Web Model 3
            </h1>
            <p className='text-white/70 mt-1'>
              Web Model 3 configuration for WalletConnect
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Main Model Info */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <WebModel3Info className='bg-black/20 backdrop-blur-sm border-white/10' />
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='space-y-6'
          >
            {/* Compact Card */}
            <WebModel3Card className='bg-black/20 backdrop-blur-sm border-white/10' />

            {/* Security Configuration */}
            <Card className='bg-black/20 backdrop-blur-sm border-white/10'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <Shield className='h-5 w-5' />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 text-sm'>
                  <div>
                    <h4 className='font-medium text-white mb-1'>
                      Environment Variables:
                    </h4>
                    <p className='text-white/70'>
                      Configuration stored securely in environment variables
                    </p>
                  </div>
                  <div>
                    <h4 className='font-medium text-white mb-1'>Usage:</h4>
                    <p className='text-white/70'>
                      Used for secure WalletConnect integration
                    </p>
                  </div>
                  <div>
                    <h4 className='font-medium text-white mb-1'>Security:</h4>
                    <p className='text-white/70'>
                      All sensitive data is encrypted and stored securely
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className='bg-black/20 backdrop-blur-sm border-white/10'>
              <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                  <Lock className='h-5 w-5' />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-white/70'>Format:</span>
                    <span className='text-white'>Secure encrypted string</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-white/70'>Source:</span>
                    <span className='text-white'>
                      Secure configuration service
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-white/70'>Purpose:</span>
                    <span className='text-white'>Secure wallet connection</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-white/70'>Environment:</span>
                    <span className='text-white'>Production secure</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className='mt-8 p-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg'
        >
          <h3 className='text-lg font-semibold mb-2 flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            About Web Model 3 Security
          </h3>
          <p className='text-white/70 text-sm'>
            Web Model 3 is a secure configuration for WalletConnect integration
            in the application. All configuration data is stored encrypted in
            environment variables and automatically loaded when the application
            starts. This ensures maximum security and protection against
            unauthorized access.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

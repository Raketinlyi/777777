'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useConnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { TabNavigation } from '@/components/tab-navigation';
import { useTranslation } from 'react-i18next';
import { useMobile } from '@/hooks/use-mobile';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import dynamic from 'next/dynamic';

const BridgeAnimation = dynamic(() => import('@/components/bridge-animation'), {
  ssr: false,
});
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  ArrowRightLeft,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Coins,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Globe,
  Lock,
  Unlock,
} from 'lucide-react';

// Network configurations
const NETWORKS = {
  apechain: {
    name: 'ApeChain',
    symbol: 'APE',
    color: 'from-blue-500 to-cyan-500',
    icon: '🦍',
    tokens: {
      craa: 'CRAA',
      nft: 'CrazyCube NFT',
    },
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    color: 'from-purple-500 to-pink-500',
    icon: '◎',
    tokens: {
      craa: 'SOL-CRAA',
      nft: 'SOL-CrazyCube NFT',
    },
  },
} as const;

// Bridge status types
type BridgeStatus =
  | 'idle'
  | 'preparing'
  | 'processing'
  | 'confirming'
  | 'success'
  | 'error';
type BridgeType = 'tokens' | 'nfts';
type NetworkDirection = 'apechain-to-solana' | 'solana-to-apechain';

// Bridge Status Component
const BridgeStatusIndicator = ({ status }: { status: BridgeStatus }) => {
  const statusConfig = {
    idle: {
      text: 'Ready to Bridge',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      icon: <Unlock className='w-4 h-4' />,
    },
    preparing: {
      text: 'Preparing Transaction',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      icon: <Loader2 className='w-4 h-4 animate-spin' />,
    },
    processing: {
      text: 'Processing Bridge',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      icon: <Loader2 className='w-4 h-4 animate-spin' />,
    },
    confirming: {
      text: 'Confirming on Destination',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      icon: <Loader2 className='w-4 h-4 animate-spin' />,
    },
    success: {
      text: 'Bridge Complete',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle className='w-4 h-4' />,
    },
    error: {
      text: 'Bridge Failed',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      icon: <AlertTriangle className='w-4 h-4' />,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${config.bgColor}`}
    >
      {config.icon}
      <span className={`font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
};

// Network Card Component
const NetworkCard = ({
  network,
  isSource,
  bridgeType,
}: {
  network: keyof typeof NETWORKS;
  isSource: boolean;
  bridgeType: BridgeType;
}) => {
  const networkData = NETWORKS[network];
  const tokenSymbol =
    bridgeType === 'tokens' ? networkData.tokens.craa : networkData.tokens.nft;

  return (
    <Card className='bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700/50 backdrop-blur-sm mobile-safe-button'>
      <CardContent className='p-4 md:p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${networkData.color} flex items-center justify-center text-xl md:text-2xl`}
            >
              {networkData.icon}
            </div>
            <div>
              <h3 className='text-base md:text-lg font-semibold text-white'>
                {networkData.name}
              </h3>
              <p className='text-xs md:text-sm text-gray-400'>
                {networkData.symbol} Network
              </p>
            </div>
          </div>
          <Badge
            variant={isSource ? 'default' : 'secondary'}
            className='text-xs'
          >
            {isSource ? 'FROM' : 'TO'}
          </Badge>
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <span className='text-xs md:text-sm text-gray-400'>Token:</span>
            <span className='text-xs md:text-sm font-medium text-white'>
              {tokenSymbol}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-xs md:text-sm text-gray-400'>Balance:</span>
            <span className='text-xs md:text-sm font-medium text-green-400'>
              {bridgeType === 'tokens' ? '1,234.56' : '12 NFTs'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Coming Soon Banner
const ComingSoonBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className='text-center mb-6'
  >
    <div className='inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full px-4 md:px-6 py-2 md:py-3 backdrop-blur-sm mobile-safe-button'>
      <Sparkles className='w-4 h-4 md:w-5 md:h-5 text-purple-400' />
      <span className='text-white font-semibold text-sm md:text-lg'>
        🚀 COMING SOON - Cross-Chain Bridge
      </span>
      <Sparkles className='w-4 h-4 md:w-5 md:h-5 text-pink-400' />
    </div>
    <p className='text-white/80 text-center mt-3 text-xs md:text-sm max-w-2xl mx-auto px-4'>
      Bridge your CRAA tokens and CrazyCube NFTs seamlessly between ApeChain and
      Solana networks. Experience true cross-chain interoperability with minimal
      fees and fast transactions.
    </p>
  </motion.div>
);

export default function BridgePage() {
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const { isLiteMode } = usePerformanceContext();
  const [mounted, setMounted] = useState(false);

  // Bridge state
  const [bridgeType, setBridgeType] = useState<BridgeType>('tokens');
  const [direction, setDirection] =
    useState<NetworkDirection>('apechain-to-solana');
  const [amount, setAmount] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>('idle');
  const [estimatedTime, setEstimatedTime] = useState(45);
  const [txHash, setTxHash] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch before mount
  if (!mounted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center'>
        <div className='text-white'>{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  // Get source and destination networks
  const [sourceNetwork, destNetwork] =
    direction === 'apechain-to-solana'
      ? (['apechain', 'solana'] as const)
      : (['solana', 'apechain'] as const);

  const handleConnectWallet = () => {
    const injectedConnector = connectors.find(
      connector => connector.type === 'injected'
    );
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  // Simulate bridge process
  const handleBridge = async () => {
    if (!amount && bridgeType === 'tokens') return;
    if (!selectedNFT && bridgeType === 'nfts') return;

    setBridgeStatus('preparing');
    setEstimatedTime(45);

    // Simulate bridge process with realistic timing
    const stages = [
      { status: 'preparing' as const, duration: 2000 },
      { status: 'processing' as const, duration: 15000 },
      { status: 'confirming' as const, duration: 10000 },
      { status: 'success' as const, duration: 0 },
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      setBridgeStatus(stage.status);

      if (stage.status === 'success') {
        setTxHash('0x' + Math.random().toString(16).substr(2, 64));
      }
    }
  };

  // Swap networks
  const swapNetworks = () => {
    setDirection(prev =>
      prev === 'apechain-to-solana'
        ? 'solana-to-apechain'
        : 'apechain-to-solana'
    );
  };

  // Reset form
  const resetForm = () => {
    setBridgeStatus('idle');
    setAmount('');
    setSelectedNFT('');
    setTxHash('');
  };

  return (
    <div
      className='min-h-screen mobile-content-wrapper bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4'
    >
      {/* Bridge animation background - always show */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        <BridgeAnimation
          intensity={bridgeStatus === 'processing' ? 4 : 2}
          theme='gradient'
          enabled={true}
          className='w-full h-full'
        />
      </div>

      <div className='container mx-auto relative z-10'>
        {/* Header */}
        <header className='mb-2 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-purple-500/30 bg-black/20 text-purple-300 hover:bg-black/40 mobile-safe-button'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('navigation.returnHome', 'Home')}
            </Button>
          </Link>
          {!isMobile && <TabNavigation />}
          <WalletConnect />
        </header>

        <main>
          {/* Title */}
          <div className='mt-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 whitespace-nowrap'>
              {t('bridge.title', 'Cross-Chain Bridge 🌉')}
            </h1>
          </div>
          <p className='text-center text-purple-300 mt-1 mb-2 text-sm md:text-base px-4'>
            {t(
              'bridge.description',
              'Seamlessly transfer your CRAA tokens and CrazyCube NFTs between ApeChain and Solana'
            )}
          </p>

          {/* Guide accordion */}
          <div className='flex justify-center my-2'>
            <Accordion type='single' collapsible className='w-full max-w-lg'>
              <AccordionItem
                value='guide'
                className='border-none mobile-safe-button'
              >
                <AccordionTrigger className='w-full bg-black/30 backdrop-blur-sm border border-purple-500/40 rounded-full px-4 py-2 text-center text-purple-200 text-sm md:text-base font-semibold hover:bg-black/50 focus:outline-none focus:ring-0 after:hidden mobile-safe-button'>
                  {t('bridge.guide.title', 'How to Bridge Assets')}
                </AccordionTrigger>
                <AccordionContent className='text-sm space-y-2 text-purple-200 mt-2 bg-black/90 p-4 rounded-lg border border-purple-500/20 mobile-safe-button'>
                  <p>
                    {t(
                      'bridge.guide.intro',
                      'Bridge your assets between ApeChain and Solana networks safely and efficiently.'
                    )}
                  </p>
                  <ol className='list-decimal list-inside pl-4 space-y-0.5'>
                    <li>
                      {t(
                        'bridge.guide.step1',
                        'Select the type of asset to bridge (CRAA tokens or NFTs)'
                      )}
                    </li>
                    <li>
                      {t(
                        'bridge.guide.step2',
                        'Choose source and destination networks'
                      )}
                    </li>
                    <li>
                      {t(
                        'bridge.guide.step3',
                        'Enter amount or select NFT to transfer'
                      )}
                    </li>
                    <li>
                      {t(
                        'bridge.guide.step4',
                        'Confirm transaction and wait for completion'
                      )}
                    </li>
                  </ol>
                  <p className='text-xs text-purple-300'>
                    {t(
                      'bridge.guide.note',
                      'Bridge process typically takes 30-60 seconds. Assets are secured by smart contracts during transfer.'
                    )}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Coming Soon Banner */}
          <ComingSoonBanner />

          {/* Wallet connection check */}
          {!isConnected ? (
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4'>
                <ArrowRightLeft
                  className={`h-8 w-8 ${mounted ? 'text-purple-500' : 'text-gray-500'}`}
                />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                {t('bridge.connectWallet', 'Connect Your Wallet')}
              </h3>
              <p className='text-gray-300 mb-4 px-4'>
                {t(
                  'bridge.connectWalletDesc',
                  'Please connect your wallet to access the cross-chain bridge'
                )}
              </p>
              <Button
                onClick={handleConnectWallet}
                className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
              >
                {t('wallet.connect', 'Connect Wallet')}
              </Button>
            </div>
          ) : (
            /* Bridge Interface */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='space-y-4 md:space-y-6 max-w-4xl mx-auto'
            >
              {/* Bridge Type Selection */}
              <Card className='bg-black/30 backdrop-blur-sm border-purple-500/30 mobile-safe-button'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center space-x-2 text-white text-base md:text-lg'>
                    <Zap className='w-4 h-4 md:w-5 md:h-5 text-purple-400' />
                    <span>Bridge Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4'>
                    <Button
                      variant={bridgeType === 'tokens' ? 'default' : 'outline'}
                      onClick={() => setBridgeType('tokens')}
                      className={`flex-1 ${
                        bridgeType === 'tokens'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'border-purple-500/50 text-purple-300 hover:bg-purple-500/10'
                      }`}
                    >
                      <Coins className='w-4 h-4 mr-2' />
                      CRAA Tokens
                    </Button>
                    <Button
                      variant={bridgeType === 'nfts' ? 'default' : 'outline'}
                      onClick={() => setBridgeType('nfts')}
                      className={`flex-1 ${
                        bridgeType === 'nfts'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'border-purple-500/50 text-purple-300 hover:bg-purple-500/10'
                      }`}
                    >
                      <ImageIcon className='w-4 h-4 mr-2' />
                      CrazyCube NFTs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Network Selection */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-center'>
                {/* Source Network */}
                <NetworkCard
                  network={sourceNetwork}
                  isSource={true}
                  bridgeType={bridgeType}
                />

                {/* Swap Button */}
                <div className='flex justify-center order-first md:order-none'>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={swapNetworks}
                    className='w-12 h-12 rounded-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 mobile-safe-button'
                  >
                    <ArrowRightLeft className='w-5 h-5' />
                  </Button>
                </div>

                {/* Destination Network */}
                <NetworkCard
                  network={destNetwork}
                  isSource={false}
                  bridgeType={bridgeType}
                />
              </div>

              {/* Bridge Interface */}
              <Card className='bg-black/30 backdrop-blur-sm border-purple-500/30 mobile-safe-button'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center space-x-2 text-white text-base md:text-lg'>
                    <Shield className='w-4 h-4 md:w-5 md:h-5 text-purple-400' />
                    <span>
                      {t('bridge.interface.title', 'Bridge Interface')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 md:space-y-6'>
                  {/* Input Section */}
                  {bridgeType === 'tokens' ? (
                    <div className='space-y-4'>
                      <Label
                        htmlFor='amount'
                        className='text-purple-300 text-sm font-medium'
                      >
                        {t('bridge.interface.amountLabel', 'Amount to Bridge')}
                      </Label>
                      <div className='relative'>
                        <Input
                          id='amount'
                          type='number'
                          placeholder={t(
                            'bridge.interface.amountPlaceholder',
                            '0.00'
                          )}
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className='bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 pr-16 mobile-safe-button'
                        />
                        <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 text-sm font-medium'>
                          CRAA
                        </div>
                      </div>
                      <div className='flex justify-between text-xs text-gray-400'>
                        <span>
                          {t(
                            'bridge.interface.available',
                            'Available: 1,234.56 CRAA'
                          )}
                        </span>
                        <Button
                          variant='link'
                          className='text-purple-400 text-xs p-0 h-auto'
                        >
                          {t('bridge.interface.useMax', 'Use Max')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      <Label className='text-purple-300 text-sm font-medium'>
                        {t(
                          'bridge.interface.selectNftLabel',
                          'Select NFT to Bridge'
                        )}
                      </Label>
                      <Select
                        value={selectedNFT}
                        onValueChange={setSelectedNFT}
                      >
                        <SelectTrigger className='bg-gray-800/50 border-purple-500/30 text-white mobile-safe-button'>
                          <SelectValue
                            placeholder={t(
                              'bridge.interface.selectNftPlaceholder',
                              'Choose your CrazyCube NFT'
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent className='bg-gray-800 border-purple-500/30 mobile-safe-button'>
                          <SelectItem value='cube-1'>
                            CrazyCube #1234
                          </SelectItem>
                          <SelectItem value='cube-2'>
                            CrazyCube #5678
                          </SelectItem>
                          <SelectItem value='cube-3'>
                            CrazyCube #9012
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Bridge Status */}
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-800/30 rounded-lg border border-purple-500/20 space-y-2 sm:space-y-0 mobile-safe-button'>
                    <BridgeStatusIndicator status={bridgeStatus} />
                    {bridgeStatus === 'processing' && (
                      <div className='text-purple-400 text-sm flex items-center space-x-2'>
                        <Clock className='w-4 h-4' />
                        <span>~{estimatedTime}s remaining</span>
                      </div>
                    )}
                  </div>

                  {/* Success Message */}
                  <AnimatePresence>
                    {bridgeStatus === 'success' && txHash && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className='bg-green-500/10 border border-green-500/30 rounded-lg p-4 mobile-safe-button'
                      >
                        <div className='flex items-center space-x-2 text-green-400 mb-2'>
                          <CheckCircle className='w-5 h-5' />
                          <span className='font-medium'>
                            Bridge Successful!
                          </span>
                        </div>
                        <p className='text-sm text-green-300 mb-2'>
                          Your{' '}
                          {bridgeType === 'tokens'
                            ? `${amount} CRAA tokens`
                            : 'NFT'}{' '}
                          have been successfully bridged to{' '}
                          {NETWORKS[destNetwork].name}.
                        </p>
                        <div className='text-xs text-green-400 font-mono break-all'>
                          Transaction: {txHash}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bridge Button */}
                  <Button
                    onClick={
                      bridgeStatus === 'success' ? resetForm : handleBridge
                    }
                    disabled={
                      bridgeStatus === 'preparing' ||
                      bridgeStatus === 'processing' ||
                      bridgeStatus === 'confirming' ||
                      (!amount && bridgeType === 'tokens') ||
                      (!selectedNFT && bridgeType === 'nfts')
                    }
                    className='w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {bridgeStatus === 'success' ? (
                      <>
                        <ArrowRightLeft className='w-4 h-4 mr-2' />
                        Bridge Again
                      </>
                    ) : bridgeStatus !== 'idle' ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        {bridgeStatus === 'preparing' && 'Preparing...'}
                        {bridgeStatus === 'processing' && 'Processing...'}
                        {bridgeStatus === 'confirming' && 'Confirming...'}
                      </>
                    ) : (
                      <>
                        <Zap className='w-4 h-4 mr-2' />
                        Bridge {bridgeType === 'tokens' ? 'Tokens' : 'NFT'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Bridge Info */}
              <Card className='bg-black/20 backdrop-blur-sm border-purple-500/20 mobile-safe-button'>
                <CardContent className='p-4 md:p-6'>
                  <h3 className='text-white font-semibold mb-4 flex items-center space-x-2'>
                    <Globe className='w-4 h-4 md:w-5 md:h-5 text-purple-400' />
                    <span>Bridge Information</span>
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2 text-purple-300'>
                        <Lock className='w-4 h-4' />
                        <span className='font-medium'>Security</span>
                      </div>
                      <p className='text-gray-400'>
                        Assets are secured by smart contracts during the bridge
                        process
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2 text-purple-300'>
                        <Clock className='w-4 h-4' />
                        <span className='font-medium'>Speed</span>
                      </div>
                      <p className='text-gray-400'>
                        Bridge completion typically takes 30-60 seconds
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2 text-purple-300'>
                        <Coins className='w-4 h-4' />
                        <span className='font-medium'>Fees</span>
                      </div>
                      <p className='text-gray-400'>
                        Minimal bridge fees for cross-chain transfers
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coming Soon Features */}
              <Card className='bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm border-purple-500/30 mobile-safe-button'>
                <CardContent className='p-4 md:p-6'>
                  <h3 className='text-white font-semibold mb-4 text-center'>
                    🚀 Coming Soon Features
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    <ul className='space-y-2 text-purple-300'>
                      <li className='flex items-center space-x-2'>
                        <ArrowRight className='w-4 h-4 flex-shrink-0' />
                        <span>
                          Bridge CRAA tokens between ApeChain and Solana
                        </span>
                      </li>
                      <li className='flex items-center space-x-2'>
                        <ArrowRight className='w-4 h-4 flex-shrink-0' />
                        <span>Transfer CrazyCube NFTs across networks</span>
                      </li>
                      <li className='flex items-center space-x-2'>
                        <ArrowRight className='w-4 h-4 flex-shrink-0' />
                        <span>Maintain NFT metadata and rarity</span>
                      </li>
                    </ul>
                    <ul className='space-y-2 text-purple-300'>
                      <li className='flex items-center space-x-2'>
                        <ArrowRight className='w-4 h-4 flex-shrink-0' />
                        <span>Low-cost cross-chain transactions</span>
                      </li>
                      <li className='flex items-center space-x-2'>
                        <ArrowRight className='w-4 h-4 flex-shrink-0' />
                        <span>Real-time bridge status tracking</span>
                      </li>
                      <li className='flex items-center space-x-2'>
                        <ArrowRight className='w-4 h-4 flex-shrink-0' />
                        <span>Automatic balance synchronization</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Return to Home Button */}
          <div className='mt-8 text-center'>
            <Link href='/'>
              <Button className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'>
                {t('navigation.returnHome', 'Home')}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

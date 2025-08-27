'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Coins,
  Info,
  TrendingUp,
  Shield,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { safeOpen } from '@/lib/safeOpen';
import { useToast } from '@/components/ui/use-toast';

// Constants for Camelot
const CRAA_ADDRESS = process.env.NEXT_PUBLIC_CRAA_ADDRESS || '0xBb526D657Cc1Ba772469A6EC96AcB2ed9D2A93e5';
const CAMELOT_LINK = `https://app.camelot.exchange/?token2=${CRAA_ADDRESS}&swap=v2`;
const DEXSCREENER_LINK = process.env.NEXT_PUBLIC_DEXSCREENER_LINK || 'https://dexscreener.com/apechain/0x7493b5d547c6d9f42ca1133dcd39e2472b633efc';

// Component
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SwapModal({ open, onOpenChange }: Props) {
  const [isBlinking, setIsBlinking] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  // Blinking effect
  useEffect(() => {
    if (open) {
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [open]);

  const handleBuyClick = async () => {
    if (!window.ethereum) {
      safeOpen(CAMELOT_LINK);
      return;
    }

    try {
      // Switch to ApeChain (33139 = 0x8173)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x8173' }],
      });
    } catch (e) {
      // Remove console.error for production security
      // console.error('Switch error:', e);
      toast({
        title: t('wallet.switchError', 'Network switch failed'),
        description: t('wallet.switchErrorDesc', 'Please try again'),
        variant: 'destructive',
      });
    }

    safeOpen(CAMELOT_LINK);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] rounded-2xl bg-[#0b0e13] border border-white/10 shadow-[0_0_50px_rgba(255,183,0,.12)] overflow-y-auto">
        <DialogHeader className="p-0 sticky top-0 bg-[#0b0e13] z-10">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              {t('swap.buyCRAA', 'Buy CRAA on Camelot')}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </DialogHeader>

        {/* Main content */}
        <div className="px-5 py-4 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-blue-300 text-sm space-y-2">
                <div className="font-semibold">{t('swap.instructions.title', 'Instructions for buying CRAA:')}</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>{t('swap.instructions.step1', 'Click the "🟡 Buy CRAA on Camelot" button below')}</li>
                  <li>{t('swap.instructions.step2', 'Automatically switch to ApeChain network')}</li>
                  <li>{t('swap.instructions.step3', 'Set slippage: buy 3-5%, sell 10-15%')}</li>
                  <li>{t('swap.instructions.step4', 'Confirm transaction in wallet')}</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Fees and slippage description */}
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-4">
            <div className="text-amber-300 text-sm space-y-3">
              <div className="font-semibold text-base">{t('swap.fees.title', '💰 Fees and Slippage:')}</div>
              
              <div className="space-y-2">
                <div className="font-medium">{t('swap.fees.buy.title', '🟢 Buy CRAA (APE → CRAA):')}</div>
                <div className="text-xs space-y-1 ml-4">
                  <div>• <span className="text-green-300">{t('swap.fees.camelot', 'Camelot Fee:')}</span> {t('swap.fees.free', '0% (free)')}</div>
                  <div>• <span className="text-green-300">{t('swap.fees.slippage', 'Slippage:')}</span> {t('swap.fees.buy.slippage', '3-5% (recommended)')}</div>
                  <div>• <span className="text-green-300">{t('swap.fees.token.tax', 'Token Tax:')}</span> {t('swap.fees.buy.tax', '0% on purchase')}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium">{t('swap.fees.sell.title', '🔴 Sell CRAA (CRAA → APE):')}</div>
                <div className="text-xs space-y-1 ml-4">
                  <div>• <span className="text-red-300">{t('swap.fees.camelot', 'Camelot Fee:')}</span> {t('swap.fees.free', '0% (free)')}</div>
                  <div>• <span className="text-red-300">{t('swap.fees.slippage', 'Slippage:')}</span> {t('swap.fees.sell.slippage', '10-15% (recommended)')}</div>
                  <div>• <span className="text-red-300">{t('swap.fees.token.tax', 'Token Tax:')}</span> {t('swap.fees.sell.tax', '10% (automatic)')}</div>
                  <div className="text-amber-200 font-medium">⚠️ {t('swap.fees.sell.total', 'Total on sale: 10-15% slippage + 10% tax')}</div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 mt-3">
                <div className="font-medium text-amber-200">{t('swap.slippage.what.title', '💡 What is slippage?')}</div>
                <div className="text-xs text-amber-100 mt-1">
                  {t('swap.slippage.what.description', 'Slippage is the maximum price change you are willing to accept. In high volatility or low liquidity, the price may change between the moment the transaction is sent and its execution.')}
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot */}
          <div className="bg-purple-500/15 border border-purple-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-purple-300 text-sm font-medium mb-3">{t('swap.screenshot.title', '📸 Example of Camelot settings:')}</div>
              <div className="relative">
                <img 
                  src="/images/1234.jpg" 
                  alt={t('swap.screenshot.alt', 'Camelot settings example')}
                  className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-purple-400/30 shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'block';
                    }
                  }}
                />
                <div className="hidden text-purple-200 text-xs p-4 bg-purple-500/20 rounded-lg">
                  {t('swap.screenshot.fallback', 'Camelot settings screenshot will be added to /public/images/1234.jpg')}
                </div>
              </div>
            </div>
          </div>

          {/* DexScreener button */}
          <Button 
            onClick={() => safeOpen(DEXSCREENER_LINK)}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:brightness-110 font-bold flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            📊 {t('swap.dexscreener.button', 'View CRAA rate on DexScreener')}
          </Button>

          {/* Blinking button */}
          <motion.div
            animate={{ 
              boxShadow: isBlinking 
                ? '0 0 20px rgba(255, 183, 0, 0.6)' 
                : '0 0 0px rgba(255, 183, 0, 0)' 
            }}
            transition={{ duration: 0.5 }}
            className="rounded-xl overflow-hidden"
          >
            <Button 
              onClick={handleBuyClick}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:brightness-110 transition-all duration-300"
            >
              🟡 {t('swap.camelot.button', 'Buy CRAA on Camelot')}
            </Button>
          </motion.div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>{t('swap.security', 'Secure purchase through Camelot V2')}</span>
            </div>
            <div className="text-[10px] text-gray-500">
              {t('swap.recommended.settings', 'Recommended settings: buy 3-5% slippage, sell 10-15% slippage')}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
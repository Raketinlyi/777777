"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useBalance } from "wagmi";
import { usePathname } from "next/navigation";
import { useNetwork } from "@/hooks/use-network";
import { monadChain } from "@/config/chains";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, AlertTriangle, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import NumberWithTooltip from "@/components/NumberWithTooltip";
import { useTranslation } from "react-i18next";
import { motion } from 'framer-motion';
import { createPublicClient, http, formatEther } from 'viem';
import { safeOpen } from '@/lib/safeOpen';
import { CompactMusicPlayer } from "@/components/CompactMusicPlayer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PANCAKESWAP_CRAA_LP_URL,
  PANCAKESWAP_OCTAA_SWAP_URL,
  DEXSCREENER_CRAA_URL,
} from '@/lib/token-links';

function WalletConnectInner() {
  const { isConnected, address } = useAccount();
  const { isMonadChain, forceSwitchToMonadChain } = useNetwork();
  const { t } = useTranslation();
  const { open } = useWeb3Modal();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
const pathname = usePathname();
  const [altCraa, setAltCraa] = useState<string>('');
  const [altOcta, setAltOcta] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    
    (async () => {
      if (!address) {
        setAltCraa('');
        setAltOcta('');
        return;
      }
      
      try {
        // prefer default RPC, fall back to public
        const rpc = (monadChain.rpcUrls.default.http && monadChain.rpcUrls.default.http[0]) ||
          (monadChain.rpcUrls.public && monadChain.rpcUrls.public.http && monadChain.rpcUrls.public.http[0]);
        if (!rpc) return;

        const pc = createPublicClient({ chain: monadChain, transport: http(rpc) });

        const erc20Abi = [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ type: 'address' }],
            outputs: [{ type: 'uint256' }],
          },
        ];

        const balCraa = await pc.readContract({
          address: monadChain.contracts.octaaToken.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        }) as bigint;

        const balOcta = await pc.readContract({
          address: monadChain.contracts.octaToken.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        }) as bigint;

        // Только обновляем состояние если компонент не размонтирован
        if (!isCancelled) {
          setAltCraa(formatEther(balCraa));
          setAltOcta(formatEther(balOcta));
        }
      } catch {
        // ignore fetch errors — wagmi useBalance will provide values as fallback
        if (!isCancelled) {
          setAltCraa('');
          setAltOcta('');
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [address]);


  const { data: craBal } = useBalance({
    address,
    token: monadChain.contracts.octaaToken.address as `0x${string}`,
    chainId: monadChain.id,
    query: { enabled: !!address },
  });

  const { data: octaBal } = useBalance({
    address,
    token: monadChain.contracts.octaToken.address as `0x${string}`,
    chainId: monadChain.id,
    query: { enabled: !!address },
  });

  // blinking effect removed — kept UI static for now

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const renderGameGuideContent = () => {
    const quickLinks = (
      <div className="mt-4 space-y-2 text-sm text-slate-200">
        <div className="font-semibold text-indigo-300">
          {t('wallet.pancakeLinks.title', 'Quick DeFi links')}
        </div>
        <ul className="space-y-1">
          <li>
            <a
              href={PANCAKESWAP_OCTAA_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-200 underline"
            >
              🟡 {t('wallet.pancakeLinks.octaa', 'Swap OCTAA on PancakeSwap')}
            </a>
          </li>
          <li>
            <a
              href={PANCAKESWAP_CRAA_LP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:text-amber-200 underline"
            >
              🟠 {t('wallet.pancakeLinks.craa', 'Swap CRAA on PancakeSwap')}
            </a>
          </li>
          <li>
            <a
              href={DEXSCREENER_CRAA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-300 hover:text-purple-200 underline"
            >
              📊 {t('wallet.pancakeLinks.dex', 'View CRAA chart (DexScreener)')}
            </a>
          </li>
        </ul>
      </div>
    );

    try {
      const content = t("wallet.gameGuideContent");
      if (typeof content === "string") {
        return (
          <div className="text-slate-300 whitespace-pre-line text-sm leading-relaxed space-y-4">
            <div>{content}</div>
            {quickLinks}
          </div>
        );
      }
      if (typeof content === "object" && content !== null) {
        const guideContent = content as any;
        return (
          <div className="text-slate-300 text-sm leading-relaxed space-y-4">
            <div className="text-lg font-bold text-purple-400 mb-2">
              {guideContent.title || "🎮 CrazyCube Game Guide"}
            </div>
            {guideContent.gettingStarted && (
              <div>
                <div className="font-semibold text-purple-300">
                  {guideContent.gettingStarted.title}
                </div>
                <div className="space-y-1 ml-4">
                  <div>{guideContent.gettingStarted.getCRAA}</div>
                  <div>{guideContent.gettingStarted.buyNFTs}</div>
                </div>
              </div>
            )}
            {quickLinks}
          </div>
        );
      }
      return (
        <div className="text-slate-300 text-sm">Game guide content not available</div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="flex items-center">
      {!isConnected ? (
        <motion.div
          whileHover={{
            boxShadow:
              "0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.4)",
          }}
          transition={{ duration: 0.2 }}
          className="rounded-full overflow-hidden"
        >
          <Button onClick={() => open()} className="neon-button border-0">
            <Wallet className="w-4 h-4 mr-2" />
            {t("wallet.connect", "Connect Wallet")}
          </Button>
        </motion.div>
      ) : !isMonadChain ? (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => forceSwitchToMonadChain()}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t("network.switch", "Switch to Monad Testnet")}
          </Button>
        </div>
      ) : (
  <div className="flex flex-col items-end gap-1 -mt-1">
          <motion.div
            whileHover={{
              boxShadow:
                "0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.4)",
            }}
            transition={{ duration: 0.2 }}
            className="rounded-full overflow-hidden"
          >
            <Button
              onClick={() => open()}
              className="neon-button border-0 min-w-[140px] px-3 py-1.5 text-sm font-medium"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {address ? formatAddress(address) : t("wallet.connected", "Connected")}
            </Button>
          </motion.div>
            {(craBal || octaBal) && (
            <div className="flex flex-col items-end gap-1 -mt-1">
              {/* Explicit CRAA balance line like satt11-main */}
              {craBal && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100">
                  <span className="text-[10px] opacity-80">{t('ping.balance', 'Balance:')}</span>
                  <span className="text-sm font-bold font-mono">
                    <NumberWithTooltip
                      value={parseFloat(((craBal?.formatted as string) ?? altCraa) || '0')}
                      type="cr"
                      fractionDigits={0}
                      preciseDigits={6}
                      suffix="CRAA"
                    />
                  </span>
                </div>
              )}

              {/* Explicit OCTA balance line (separate) */}
              {octaBal && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100">
                  <span className="text-[10px] opacity-80">{t('ping.balance', 'Balance:')}</span>
                  <span className="text-sm font-bold font-mono">
                    <NumberWithTooltip
                      value={parseFloat(((octaBal?.formatted as string) ?? altOcta) || '0')}
                      type="cr"
                      fractionDigits={0}
                      preciseDigits={6}
                      suffix="OCTAA"
                    />
                  </span>
                </div>
              )}
              {/* combined Balances row removed per design — separate Balance lines shown above */}

              {/* Action buttons row: Instruction, Space Walk */}
              <div className="flex items-center gap-2">
                <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      {t("wallet.instruction", "Instruction")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-white flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-purple-400" />
                        {t("wallet.gameGuide", "CrazyCube Game Guide")}
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">{renderGameGuideContent()}</ScrollArea>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="h-8 px-3 bg-indigo-400 hover:bg-indigo-300 text-black font-semibold"
                    >
                      {t('ping.pancakeSwap', '🥞 PancakeSwap')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[220px] bg-slate-900 text-slate-100 border-slate-700">
                    <DropdownMenuItem
                      className="cursor-pointer text-sm"
                      onSelect={() => safeOpen(PANCAKESWAP_OCTAA_SWAP_URL)}
                    >
                      🟡 {t('wallet.pancakeLinks.octaa', 'Swap OCTAA on PancakeSwap')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-sm"
                      onSelect={() => safeOpen(PANCAKESWAP_CRAA_LP_URL)}
                    >
                      🟠 {t('wallet.pancakeLinks.craa', 'Swap CRAA on PancakeSwap')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      className="cursor-pointer text-sm"
                      onSelect={() => safeOpen(DEXSCREENER_CRAA_URL)}
                    >
                      📊 {t('wallet.pancakeLinks.dex', 'View CRAA chart (DexScreener)')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {pathname !== "/" && <CompactMusicPlayer />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WalletConnectNoSSR() {
  const { t } = useTranslation();
  const [modalReady, setModalReady] = useState(false);

  useEffect(() => {
    try {
      const isReady = typeof window !== "undefined" &&
        Boolean(
          (window as unknown as { web3modal_initialized?: boolean })
            .web3modal_initialized
        );
      
      setModalReady(prevReady => {
        // Только обновляем если состояние действительно изменилось
        if (prevReady !== isReady) {
          return isReady;
        }
        return prevReady;
      });
    } catch {
      setModalReady(false);
    }
  }, []);

  if (!modalReady) {
    return (
      <div className="flex items-center">
        <Button disabled className="neon-button border-0 opacity-60 cursor-not-allowed">
          <Wallet className="w-4 h-4 mr-2" />
          {t("wallet.connect", "Connect Wallet")}
        </Button>
      </div>
    );
  }

  return <WalletConnectInner />;
}


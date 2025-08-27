'use client';

import type React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SimpleToastProvider } from '@/components/simple-toast';
import { BuildErrorDisplay } from '@/components/build-error-display';
import { SocialSidebar } from '@/components/social-sidebar';
import { setupGlobalErrorHandling } from '@/utils/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useEffect, useState } from 'react';
// Import i18n
import '@/lib/i18n';
// Import Web3 provider
import { WagmiProvider } from 'wagmi';
import { config } from '@/config/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { PerformanceProvider } from '@/hooks/use-performance-context';
import { useWalletEvents } from '@/hooks/use-wallet-events';
import { EthereumProviderSafe } from '@/components/ethereum-provider-safe';
import { GlobalLanguageSwitcher } from '@/components/global-language-switcher';
import EthereumGuard from '@/components/EthereumGuard';
import { useRef } from 'react';
import { getGlobalAudioElement } from '@/lib/globalAudio';
import { SparkProjectiles } from '@/components/SparkProjectiles';

// Create a client for React Query
const queryClient = new QueryClient();

// Inner component that uses wallet events - must be inside WagmiProvider
function WalletEventHandler({ children }: { children: React.ReactNode }) {
  useWalletEvents();
  return <>{children}</>;
}

// Initialize Web3Modal (always, using placeholder if no Project ID)
// Purpose: ensure `useWeb3Modal` calls won't crash before init; avoids 403 config fetch by
// falling back to local defaults when projectId is placeholder.
if (typeof window !== 'undefined' && !(window as any).web3modal_initialized) {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'crazycube-project-id';
  const isEnabled = process.env.NEXT_PUBLIC_WEB3_MODAL_ENABLED !== 'false';
  if (isEnabled) {
    try {
      createWeb3Modal({
        wagmiConfig: config,
        projectId,
        enableAnalytics: false,
        enableOnramp: false,
        enableSwaps: true,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#0EA5E9',
          '--w3m-border-radius-master': '8px',
        },
        featuredWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
        ],
      });
      (window as any).web3modal_initialized = true;
    } catch (error) {}
  }
}

// Patch console.error only once
// Purpose: keep prod logs clean from noisy wallet/CSP warnings while preserving errors.
let isConsoleErrorPatched = false;
function patchConsoleError() {
  if (isConsoleErrorPatched) return;
  isConsoleErrorPatched = true;
  
  // Удаляем console.error override для production безопасности
  // const originalError = console.error;
  // console.error = (...args) => {
  //   const message = args.map(arg => String(arg)).join(' ');
  //   const isKnownWalletError =
  //     message.includes(
  //       "Cannot read properties of undefined (reading 'global')"
  //     ) ||
  //     message.includes(
  //       'provider - this is likely due to another Ethereum wallet extension'
  //     ) ||
  //     message.includes('Unchecked runtime.lastError') ||
  //     message.includes('Could not establish connection') ||
  //     message.includes('Connection interrupted') ||
  //     message.includes('WebSocket connection failed') ||
  //     message.includes('InternalRpcError: Request failed') ||
  //     message.includes('ContractFunctionExecutionError') ||
  //     message.includes('EstimateGasExecutionError') ||
  //     message.includes('UserRejectedRequestError') ||
  //     message.includes('RpcRequestError: Rate limit exceeded') ||
  //     message.includes(
  //       "Failed to execute 'createPolicy' on 'TrustedTypePolicyFactory'"
  //     ) ||
  //     message.includes('In HTML, <p> cannot be a descendant of <p>') ||
  //     message.includes('<p> cannot contain a nested <p>') ||
  //     message.includes('<div> cannot be a descendant of <p>') ||
  //     message.includes('<p> cannot contain a nested <div>') ||
  //     message.includes('Maximum update depth exceeded');
  //   if (isKnownWalletError) return;
  //   originalError.apply(console, args);
  // };
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);

  // Initialize on client side
  // Responsibilities:
  // 1) i18n lazy init; 2) optional Trusted Types policy; 3) create persistent global <audio>;
  // 4) set up global error handling and minimal visibility handler.
  useEffect(() => {
    setMounted(true);
    patchConsoleError();
    setupGlobalErrorHandling();

    // Initialize i18n
    const initI18n = async () => {
      try {
        const i18n = (await import('@/lib/i18n')).default;
        if (i18n && !i18n.isInitialized) {
          await i18n.init();
        }
      } catch (error) {}
    };

    // Initialize Trusted Types (opt-in via env to avoid mobile issues)
    const initTrustedTypes = () => {
      const enabled = process.env.NEXT_PUBLIC_TRUSTED_TYPES_ENABLED === 'true';
      if (!enabled) return;
      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        try {
          if (process.env.NODE_ENV === 'development') {
            window.trustedTypes.createPolicy('nextjs#bundler', {
              createHTML: (input: string) => input,
              createScript: (input: string) => input,
              createScriptURL: (input: string) => input,
            });
          }

          window.trustedTypes.createPolicy('default', {
            createHTML: (input: string) => input,
            createScript: (input: string) => input,
            createScriptURL: (input: string) => input,
          });
        } catch (_) {
          /* already exists */
        }
      }
    };

    initI18n();
    initTrustedTypes();
    // Ensure global audio element exists once on client
    const audio = getGlobalAudioElement();
    let onVisibility: (() => void) | null = null;
    if (audio) {
      // Persist through soft navigations: avoid pause on visibilitychange
      onVisibility = () => {
        // If user explicitly played and audio was playing, keep state; otherwise do nothing
      };
      document.addEventListener('visibilitychange', onVisibility);
    }

    // Cleanup always returned
    return () => {
      if (onVisibility) {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, []);

  return (
    <>
      {!mounted ? null : (
        <ThemeProvider attribute='class' defaultTheme='dark'>
          <WagmiProvider config={config} reconnectOnMount={false}>
            <QueryClientProvider client={queryClient}>
              <ErrorBoundary>
                <PerformanceProvider>
                  <EthereumProviderSafe>
                    <WalletEventHandler>
                      <SimpleToastProvider>
                        <EthereumGuard />
                        <div className='relative flex min-h-screen flex-col'>
                          <GlobalLanguageSwitcher />
                          <SocialSidebar />
                           <SparkProjectiles />
                           {/* Ensure global audio exists */}
                           <div id='__global_audio_mount' className='hidden'>
                             {/* global <audio> is injected into document.body by getGlobalAudioElement() */}
                           </div>
                          {children}
                          <BuildErrorDisplay />
                        </div>
                      </SimpleToastProvider>
                    </WalletEventHandler>
                  </EthereumProviderSafe>
                </PerformanceProvider>
              </ErrorBoundary>
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeProvider>
      )}
    </>
  );
}

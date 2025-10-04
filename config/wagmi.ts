import { monadChain, apeChain } from './chains';

// ---- Export commonly-used constants (safe on server) ----
export const MAIN_CHAIN_ID = monadChain.id;
export const NFT_CONTRACT_ADDRESS = monadChain.contracts.crazyCubeNFT.address;
export const TOKEN_CONTRACT_ADDRESS = monadChain.contracts.crazyToken.address;
export const GAME_CONTRACT_ADDRESS = monadChain.contracts.gameProxy.address;

// The heavy wagmi + walletconnect setup must run ONLY in the browser:
//   – WalletConnect SDK tries to access IndexedDB which doesn't exist in Node.js
//   – Netlify serverless functions therefore crash with `indexedDB is not defined`
// We lazily build the config when window is available.

// `config` will be assigned only in browser. We keep it typed as `any` so client code can pass it without complaints.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export let config: any;

if (typeof window !== 'undefined') {
  // Dynamic imports for browser-only code
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createConfig, http, fallback } = require('wagmi');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { injected, metaMask, walletConnect } = require('wagmi/connectors');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createPublicClient } = require('viem');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initWagmiClient } = require('@/lib/alchemyKey');

  // Create public client with fallback transports and batching
  // Use Alchemy RPC endpoints first (with API keys), then fallback to public RPC
  const alchemyRpcs = [
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_1 ? `https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_1}` : null,
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_2 ? `https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_2}` : null,
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_3 ? `https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_3}` : null,
  ].filter(Boolean);

  const publicClient = createPublicClient({
    chain: monadChain,
    batch: { multicall: true },
    transport: fallback([
      // Prioritize Alchemy RPCs with API keys
      ...alchemyRpcs.map(rpc => http(rpc, { batch: true, retryCount: 3, timeout: 30_000 })),
      // Fallback to configured RPCs (may include public RPC)
      ...(monadChain.rpcUrls.default.http[0]
        ? [http(monadChain.rpcUrls.default.http[0], { batch: true, retryCount: 2, timeout: 20_000 })]
        : []),
      ...(monadChain.rpcUrls.default.http[1]
        ? [http(monadChain.rpcUrls.default.http[1], { batch: true, retryCount: 2, timeout: 20_000 })]
        : []),
    ]),
  });

  // Initialize the multi-tier system with wagmi client
  initWagmiClient(publicClient);

  // Detect problematic browsers (e.g., Yandex) where multiple extensions may clash
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase();
  const isYandex = ua.includes('yabrowser') || ua.includes('yandex');
  const enableInjected = (process.env.NEXT_PUBLIC_ENABLE_INJECTED ?? 'false') !== 'false' && !isYandex;

  // Define configuration for Wagmi with fallback transports
  config = createConfig({
    chains: [monadChain, apeChain],
    // Add a listener to check for chain changes
  onChainChanged: (chain: { id: number }) => {
      if (chain.id !== monadChain.id && chain.id !== apeChain.id) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('crazycube:toast', {
              detail: {
                title: 'Unsupported Network',
                description: 'Please switch to Monad Testnet or ApeChain',
                variant: 'destructive',
              },
            })
          );
        }
      }
    },
    transports: {
      [monadChain.id]: fallback([
        // Prioritize Alchemy RPCs with API keys for Monad
        ...alchemyRpcs.map(rpc => http(rpc, { batch: true, retryCount: 3, timeout: 30_000 })),
        // Fallback to configured RPCs
        ...(monadChain.rpcUrls.default.http[0]
          ? [http(monadChain.rpcUrls.default.http[0], { batch: true, retryCount: 2, timeout: 20_000 })]
          : []),
        ...(monadChain.rpcUrls.default.http[1]
          ? [http(monadChain.rpcUrls.default.http[1], { batch: true, retryCount: 2, timeout: 20_000 })]
          : []),
      ]),
      [apeChain.id]: fallback([
        ...(apeChain.rpcUrls.default.http[0]
          ? [http(apeChain.rpcUrls.default.http[0], { batch: true })]
          : []),
      ]),
    },
    // Disable persistent storage to prevent auto-reconnect across sessions
    storage: null,
    connectors: [
      // WalletConnect first (works across browsers and mobile)
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        metadata: {
          name: 'CrazyCube',
          description: 'CrazyCube NFT Game',
          url: window.location.origin,
          icons: ['/icons/favicon-180x180.png'],
        },
        showQrModal: true,
      }),
      // Enable injected connectors only on safe browsers
      ...(enableInjected
        ? [
            metaMask({
              dappMetadata: {
                name: 'CrazyCube',
                url: window.location.origin,
                iconUrl: '/icons/favicon-180x180.png',
              },
            }),
            injected({ shimDisconnect: true }),
          ]
        : []),
    ],
    ssr: false,
  });
}

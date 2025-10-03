// Ethereum Provider Type Definitions
// Extends the global Window interface to include Ethereum provider

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isWalletConnect?: boolean;
      isCoinbaseWallet?: boolean;
      isRainbow?: boolean;
      isTrust?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (
        eventName: string,
        handler: (...args: any[]) => void
      ) => void;
      removeAllListeners: (eventName: string) => void;
      selectedAddress?: string;
      chainId?: string;
      networkVersion?: string;
      isConnected: () => boolean;
      enable: () => Promise<string[]>;
      send: (method: string, params?: any[]) => Promise<any>;
      sendAsync: (
        request: any,
        callback: (error: any, response: any) => void
      ) => void;
    };
    trustedTypes?: {
      createPolicy: (
        name: string,
        rules: {
          createHTML?: (input: string) => string;
          createScript?: (input: string) => string;
          createScriptURL?: (input: string) => string;
        }
      ) => any;
    };
    web3modal_initialized?: boolean;
  }
}

export {};

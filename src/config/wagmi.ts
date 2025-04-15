// config/wagmi.ts
import { http, createConfig, fallback } from 'wagmi';
import { walletConnect } from '@wagmi/connectors';
import { apeChainWagmi } from './wagmiChain';

// Create a custom HTTP client with retry logic
const httpWithRetry = (url: string) => http(url, {
  timeout: 10000, // 10 seconds timeout
  fetchOptions: {
    cache: 'no-store',
  },
  retryCount: 3,
  retryDelay: 1000,
});

// Create transport with fallback to multiple RPCs
const createTransport = () => {
  const rpcs = apeChainWagmi.rpcUrls.default.http;
  return fallback(rpcs.map(url => httpWithRetry(url)));
};

export const config = createConfig({
  chains: [apeChainWagmi],
  connectors: [
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
      showQrModal: true,
    }),
  ],
  transports: {
    [apeChainWagmi.id]: createTransport(),
  },
  ssr: false,
});
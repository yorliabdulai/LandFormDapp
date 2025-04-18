// config/wagmi.ts
import { http, createConfig, fallback } from 'wagmi';
import { 
  getDefaultWallets 
} from '@rainbow-me/rainbowkit';
import { apeChainWagmi } from './wagmiChain';

// Create a custom HTTP client with retry logic
const httpWithRetry = (url: string) => http(url, {
  timeout: 10000,
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

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

const { connectors } = getDefaultWallets({
  appName: 'LandForm',
  projectId: projectId,
});

export const config = createConfig({
  chains: [apeChainWagmi],
  connectors, // Using connectors from getDefaultWallets
  transports: {
    [apeChainWagmi.id]: createTransport(),
  },
  ssr: false,
});
// config/wagmiChain.ts
import type { Chain } from '@wagmi/chains';
import { APE_CHAIN_ID, APE_CHAIN_RPC_URL, APE_CHAIN_EXPLORER_URL } from './constants';

// Add publicly available fallback RPCs that support your chain
const FALLBACK_RPCS = [
  'https://apechain-mainnet.public.blastapi.io', // Replace with actual fallback RPC
  'https://rpc.apechain.com/http', // Replace with actual fallback RPC
  'https://apechain.drpc.org/',
   'https://apechain.gateway.tenderly.co/',
   'https://33139.rpc.thirdweb.com/'
];

export const apeChainWagmi: Chain = {
  id: APE_CHAIN_ID,
  name: 'ApeChain Testnet',
  network: 'apechain-testnet',
  nativeCurrency: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [APE_CHAIN_RPC_URL, ...FALLBACK_RPCS],
    },
    public: {
      http: [APE_CHAIN_RPC_URL, ...FALLBACK_RPCS],
    },
  },
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: APE_CHAIN_EXPLORER_URL,
    },
  },
  testnet: true,
};
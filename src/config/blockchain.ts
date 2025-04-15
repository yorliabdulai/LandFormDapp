// config/blockchain.ts
import { defineChain, type AppKitNetwork } from '@reown/appkit/networks';

const chainId = parseInt(import.meta.env.VITE_APECHAIN_CHAIN_ID || '33139', 10);

export const apeChain = defineChain({
  id: chainId,
  name: 'ApeChain Testnet',
  chainNamespace: 'eip155',
  caipNetworkId: `eip155:${import.meta.env.VITE_APECHAIN_CHAIN_ID || 33139}`,
  nativeCurrency: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_APECHAIN_RPC_URL ],
    },
    public: {
      http: [import.meta.env.VITE_APECHAIN_RPC_URL ],
    },
  },
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: import.meta.env.VITE_APECHAIN_EXPLORER_URL ,
    },
  },
  testnet: true,
}) as AppKitNetwork;

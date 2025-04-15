// config/appkitChain.ts
import { defineChain, type AppKitNetwork } from '@reown/appkit/networks';
import { APE_CHAIN_ID, APE_CHAIN_RPC_URL, APE_CHAIN_EXPLORER_URL } from './constants';

export const apeChainAppKit = defineChain({
  id: APE_CHAIN_ID,
  name: 'ApeChain Testnet',
  chainNamespace: 'eip155',
  caipNetworkId: `eip155:${APE_CHAIN_ID}`,
  nativeCurrency: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [APE_CHAIN_RPC_URL],
    },
    public: {
      http: [APE_CHAIN_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: APE_CHAIN_EXPLORER_URL,
    },
  },
  testnet: true,
}) as AppKitNetwork;

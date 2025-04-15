import { configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { apeChain } from './chains'; // Ensure this is defined with the correct chain ID, name, rpcUrls, etc.

const { chains, publicClient } = configureChains(
  [apeChain],
  [
    jsonRpcProvider({
      rpc: () => ({ http: 'https://rpc.curtis.apechain.com/http' })
    }),
    publicProvider(),
  ]
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
});

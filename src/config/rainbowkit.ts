// config/rainbowkit.ts
import { getDefaultWallets } from '@rainbow-me/rainbowkit';


const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const { wallets, connectors } = getDefaultWallets({
  appName: 'LandForm',
  projectId: projectId,
});
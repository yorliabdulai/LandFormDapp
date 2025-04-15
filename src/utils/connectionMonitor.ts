// utils/connectionMonitor.ts
import { apeChainWagmi } from '../config/wagmiChain';

export async function checkRpcHealth(): Promise<{
  isHealthy: boolean;
  workingRpc?: string;
}> {
  const rpcs = apeChainWagmi.rpcUrls.default.http;
  
  for (const rpc of rpcs) {
    try {
      const response = await fetch(rpc, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'net_version',
          params: [],
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          return { isHealthy: true, workingRpc: rpc };
        }
      }
    } catch (error) {
      console.warn(`RPC ${rpc} health check failed:`, error);
    }
  }
  
  return { isHealthy: false };
}
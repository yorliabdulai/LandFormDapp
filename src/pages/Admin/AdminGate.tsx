import React from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const AdminGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="p-6 flex flex-col justify-center items-center min-h-screen bg-gray-50 text-center">
        <p className="text-gray-600 text-lg mb-4">
          🔒 Please connect your wallet to access the admin dashboard
        </p>
        <ConnectButton showBalance={false} chainStatus="none" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGate;

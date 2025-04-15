import {
  useReadContract,
  useSimulateContract,
  useWriteContract,
  usePublicClient,
} from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { LandFormABI, CONTRACT_ADDRESS } from '@/constants/contracts';
import { isAddress } from 'viem';

// Read the current owner from the contract with retry logic using React Query.
export const useOwner = () => {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['contract', 'owner'],
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not found');
      try {
        const result = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LandFormABI,
          functionName: 'owner',
        });
        return result as string;
      } catch (error) {
        console.error('Error reading owner:', error);
        throw error;
      }
    },
    enabled: !!publicClient,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
};

// Read the pending owner from the contract with retry logic using React Query.
export const usePendingOwner = () => {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['contract', 'pendingOwner'],
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not found');
      try {
        const result = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: LandFormABI,
          functionName: 'pendingOwner',
        });
        return result as string;
      } catch (error) {
        console.error('Error reading pending owner:', error);
        throw error;
      }
    },
    enabled: !!publicClient,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
};

// Simulate transferOwnership transaction to a new owner address.
export const useTransferOwnershipSimulate = (newOwner: string) => {
  return useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: LandFormABI,
    functionName: 'transferOwnership',
    args: [newOwner],
  });
};

// Write hook to execute the transferOwnership transaction.
export const useTransferOwnershipWrite = () => {
  return useWriteContract();
};

// Simulate acceptOwnership transaction.
export const useAcceptOwnershipSimulate = () => {
  return useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: LandFormABI,
    functionName: 'acceptOwnership',
  });
};

// Write hook to execute the acceptOwnership transaction.
export const useAcceptOwnershipWrite = () => {
  return useWriteContract();
};
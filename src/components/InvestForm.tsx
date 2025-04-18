import React from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, LandFormABI } from '../constants/contracts';

// Define Project type based on the smart contract structure
type Project = {
  id: bigint;
  title: string;
  location: string;
  pricePerShare: bigint;
  totalShares: bigint;
  availableShares: bigint;
  imageId: string;
  description: string;
  owner: string;
};

interface InvestFormProps {
  project: Project;
}

const InvestForm = ({ project }: InvestFormProps) => {
  const { isConnected } = useAccount();
  const [shareAmount, setShareAmount] = useState<number>(1);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'preparing' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Calculate total cost
  const totalCost = BigInt(shareAmount) * project.pricePerShare;
  
  // Format price to display to the user
  const formatPrice = (price: bigint): string => {
    // Convert Wei to APE (assuming 18 decimals)
    return parseFloat(Number(price) / 10**18 + '').toFixed(2);
  };

  // Calculate progress percentage
  const calculateProgress = (available: bigint, total: bigint) => {
    if (total === 0n) return 0;
    return 100 - Number((available * 100n) / total);
  };

  // Use the new writeContract hook from wagmi
  const { writeContract, isPending, isSuccess, isError, error } = useWriteContract();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      setTransactionStatus('error');
      return;
    }

    if (shareAmount <= 0) {
      setErrorMessage('Please enter a valid number of shares');
      setTransactionStatus('error');
      return;
    }

    if (BigInt(shareAmount) > project.availableShares) {
      setErrorMessage(`Only ${project.availableShares.toString()} shares available`);
      setTransactionStatus('error');
      return;
    }

    setTransactionStatus('preparing');
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: LandFormABI,
        functionName: 'investInProject',
        args: [project.id, BigInt(shareAmount)],
        value: totalCost,
      });
      setTransactionStatus('pending');
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed to execute';
      setErrorMessage(errorMessage);
      setTransactionStatus('error');
    }
  };

  // Update transaction status based on contract write state
  useEffect(() => {
    if (isSuccess) {
      setTransactionStatus('success');
    } else if (isError) {
      setTransactionStatus('error');
      setErrorMessage(error?.message || 'Transaction failed');
    }
  }, [isSuccess, isError, error]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Invest in this Project</h3>
      
      {/* Project investment details */}
      <div className="mb-6">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Investment Progress</span>
            <span>{calculateProgress(project.availableShares, project.totalShares)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full" 
              style={{ width: `${calculateProgress(project.availableShares, project.totalShares)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Share Price</p>
            <p className="text-lg font-semibold text-gray-900">{formatPrice(project.pricePerShare)} APE</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Available</p>
            <p className="text-lg font-semibold text-gray-900">
              {Number(project.availableShares).toLocaleString()}/{Number(project.totalShares).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="shareAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Shares
          </label>
          <input
            type="number"
            id="shareAmount"
            min="1"
            max={project.availableShares.toString()}
            value={shareAmount}
            onChange={(e) => setShareAmount(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Total Investment:</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(totalCost)} APE</span>
          </div>
        </div>

        {/* Transaction status messages */}
        {transactionStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {errorMessage || 'Something went wrong. Please try again.'}
          </div>
        )}

        {transactionStatus === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
            Investment successful! Your shares have been purchased.
          </div>
        )}

        {/* CTA Button */}
        <button
          type="submit"
          disabled={!isConnected || isPending || transactionStatus === 'pending' || transactionStatus === 'preparing'}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            !isConnected || isPending || transactionStatus === 'pending' || transactionStatus === 'preparing'
              ? 'bg-primary-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {isConnected ? (
            transactionStatus === 'pending' || isPending ? (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : transactionStatus === 'preparing' ? (
              'Preparing Transaction...'
            ) : (
              `Invest Now (${formatPrice(totalCost)} APE)`
            )
          ) : (
            'Connect Wallet to Invest'
          )}
        </button>
      </form>
    </div>
  );
};

export default InvestForm;
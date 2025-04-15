import React, { useState, useEffect } from "react";
import { LandFormABI, CONTRACT_ADDRESS } from "@/constants/contracts";
import {
  useTransferOwnershipSimulate,
  useTransferOwnershipWrite,
  useAcceptOwnershipSimulate,
  useAcceptOwnershipWrite,
  useOwner,
  usePendingOwner,
} from "@/hooks/useOwnership";
import { useAccount } from "wagmi";
import { formatAddress } from "@/utils/formatAddress";
import { isAddress } from "viem";
import { 
  Shield, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  X, 
  AlertCircle, 
  Loader2,
  User,
  UserCheck
} from "lucide-react";

const OwnershipTransfers: React.FC = () => {
  const [newOwnerAddress, setNewOwnerAddress] = useState<string>("");
  const [addressError, setAddressError] = useState<string>("");
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);
  const [acceptSuccess, setAcceptSuccess] = useState<boolean>(false);
  const { address } = useAccount();
  
  // Get current owner and pending owner
  const { data: currentOwner, isLoading: ownerLoading } = useOwner();
  const { data: pendingOwner, isLoading: pendingOwnerLoading } = usePendingOwner();
  
  const isCurrentOwner = address && currentOwner && address.toLowerCase() === currentOwner.toLowerCase();
  const isPendingOwner = address && pendingOwner && pendingOwner !== '0x0000000000000000000000000000000000000000' && address.toLowerCase() === pendingOwner.toLowerCase();
  
  // Use simulation hooks
  const {
    error: transferSimError,
    isLoading: transferSimLoading,
  } = useTransferOwnershipSimulate(newOwnerAddress);

  const {
    error: acceptSimError,
    isLoading: acceptSimLoading,
  } = useAcceptOwnershipSimulate();

  // Write hooks to execute the transactions
  const { 
    writeContract: transferWrite, 
    isPending: isTransferLoading,
    isSuccess: isTransferSuccess,
    isError: isTransferError,
    error: transferError
  } = useTransferOwnershipWrite();
  
  const { 
    writeContract: acceptWrite, 
    isPending: isAcceptLoading,
    isSuccess: isAcceptSuccess,
    isError: isAcceptError,
    error: acceptError
  } = useAcceptOwnershipWrite();

  // Validate Ethereum address
  const validateAddress = (address: string): boolean => {
    if (!address) {
      setAddressError("Address is required");
      return false;
    }
    
    if (!isAddress(address)) {
      setAddressError("Invalid Ethereum address format");
      return false;
    }
    
    setAddressError("");
    return true;
  };

  const handleTransfer = () => {
    if (!validateAddress(newOwnerAddress)) return;
    
    transferWrite({
      abi: LandFormABI,
      functionName: "transferOwnership",
      args: [newOwnerAddress],
      address: CONTRACT_ADDRESS,
    });
  };

  const handleAccept = () => {
    acceptWrite({
      abi: LandFormABI,
      functionName: "acceptOwnership",
      args: [],
      address: CONTRACT_ADDRESS,
    });
  };

  // Update success states when transactions complete
  useEffect(() => {
    if (isTransferSuccess) {
      setTransferSuccess(true);
      const timer = setTimeout(() => setTransferSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isTransferSuccess]);

  useEffect(() => {
    if (isAcceptSuccess) {
      setAcceptSuccess(true);
      const timer = setTimeout(() => setAcceptSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isAcceptSuccess]);

  // Handle input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewOwnerAddress(e.target.value);
    if (addressError) validateAddress(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Shield size={24} className="text-primary-600 mr-2" />
        <h1 className="text-2xl font-heading font-bold text-gray-800">
          Ownership Management
        </h1>
      </div>
      
      {/* Ownership Status Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-md font-medium text-gray-700 mb-2">Current Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <User size={16} className="text-primary-600 mr-2" /> 
            <span className="text-sm font-medium">Current Owner:</span>
            <span className="text-sm ml-2">
              {ownerLoading ? "Loading..." : currentOwner ? formatAddress(currentOwner) : "Not available"}
            </span>
            {isCurrentOwner && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">You</span>
            )}
          </div>
          <div className="flex items-center">
            <UserCheck size={16} className="text-green-600 mr-2" />
            <span className="text-sm font-medium">Pending Owner:</span>
            <span className="text-sm ml-2">
              {pendingOwnerLoading 
                ? "Loading..." 
                : pendingOwner && pendingOwner !== "0x0000000000000000000000000000000000000000" 
                  ? formatAddress(pendingOwner) 
                  : "None"}
            </span>
            {isPendingOwner && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">You</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Transfer Ownership Card */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-primary-50 px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-heading font-semibold text-gray-800 flex items-center">
              <ArrowRight size={18} className="text-primary-600 mr-2" />
              Initiate Ownership Transfer
            </h2>
          </div>
          
          <div className="p-5">
            <p className="text-gray-600 mb-4 text-sm">
              Transfer ownership of the contract to a new address. The new owner must accept the transfer 
              to complete the process.
            </p>
            
            <div className="mb-4">
              <label htmlFor="newOwner" className="block text-sm font-medium text-gray-700 mb-1">
                New Owner Address
              </label>
              <input
                id="newOwner"
                type="text"
                placeholder="0x..."
                value={newOwnerAddress}
                onChange={handleAddressChange}
                className={`w-full px-3 py-2 border ${
                  addressError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent`}
              />
              {addressError && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {addressError}
                </p>
              )}
            </div>
            
            {transferSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center">
                <Check size={18} className="mr-2" />
                Transfer initiated successfully
              </div>
            )}
            
            {isTransferError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center">
                <X size={18} className="mr-2" />
                {transferError?.message || "Failed to transfer ownership"}
              </div>
            )}
            
            {transferSimError && !isTransferError && (
              <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-md border border-amber-200 flex items-center">
                <AlertCircle size={18} className="mr-2" />
                {transferSimError.message}
              </div>
            )}
            
            <button
              onClick={handleTransfer}
              disabled={isTransferLoading || transferSimLoading || !!addressError || !isCurrentOwner}
              className={`w-full flex justify-center items-center px-4 py-2 rounded-md font-medium text-white ${
                isTransferLoading || transferSimLoading || !isCurrentOwner
                  ? 'bg-primary-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
              } transition-colors`}
            >
              {isTransferLoading || transferSimLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Processing...
                </>
              ) : !isCurrentOwner ? (
                "Must be the current owner"
              ) : (
                "Transfer Ownership"
              )}
            </button>
          </div>
        </div>

        {/* Accept Ownership Card */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-green-50 px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-heading font-semibold text-gray-800 flex items-center">
              <ShieldCheck size={18} className="text-green-600 mr-2" />
              Accept Ownership
            </h2>
          </div>
          
          <div className="p-5">
            <p className="text-gray-600 mb-4 text-sm">
              If you are the pending new owner, you can complete the ownership transfer by accepting it below.
              Your current address: {address ? formatAddress(address) : "Not connected"}
            </p>
            
            {!isPendingOwner && pendingOwner && pendingOwner !== "0x0000000000000000000000000000000000000000" && (
              <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-md border border-amber-200 flex items-center">
                <AlertCircle size={18} className="mr-2" />
                You are not the pending owner. Only the pending owner can accept the transfer.
              </div>
            )}
            
            {pendingOwner === "0x0000000000000000000000000000000000000000" && (
              <div className="mb-4 p-3 bg-gray-50 text-gray-700 rounded-md border border-gray-200 flex items-center">
                <AlertCircle size={18} className="mr-2" />
                No pending ownership transfer
              </div>
            )}
            
            {acceptSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center">
                <Check size={18} className="mr-2" />
                Ownership accepted successfully
              </div>
            )}
            
            {isAcceptError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center">
                <X size={18} className="mr-2" />
                {acceptError?.message || "Failed to accept ownership"}
              </div>
            )}
            
            {acceptSimError && !isAcceptError && (
              <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-md border border-amber-200 flex items-center">
                <AlertCircle size={18} className="mr-2" />
                {acceptSimError.message}
              </div>
            )}
            
            <button
              onClick={handleAccept}
              disabled={isAcceptLoading || acceptSimLoading || !isPendingOwner}
              className={`w-full flex justify-center items-center px-4 py-2 rounded-md font-medium text-white ${
                isAcceptLoading || acceptSimLoading || !isPendingOwner
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              } transition-colors`}
            >
              {isAcceptLoading || acceptSimLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Processing...
                </>
              ) : !isPendingOwner ? (
                "Must be the pending owner"
              ) : (
                "Accept Ownership"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnershipTransfers;
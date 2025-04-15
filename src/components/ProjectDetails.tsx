import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContractRead } from 'wagmi';
import { CONTRACT_ADDRESS, LandFormABI } from '../constants/contracts';
import InvestForm from '../components/InvestForm';

// Define Project type based on the smart contract structure
type Project = {
  id: bigint;
  title: string;
  location: string;
  pricePerShare: bigint;
  totalShares: bigint;
  availableShares: bigint;
  imageURL: string;
  description: string;
  owner: string;
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch project details from the smart contract
  const { data, isError, isLoading: isLoadingProject } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: LandFormABI,
    functionName: 'getProject',
    args: [BigInt(id || '0')],
  });

  useEffect(() => {
    if (data) {
      setProject(data as unknown as Project);
    }
    setIsLoading(isLoadingProject);
  }, [data, isLoadingProject]);

  useEffect(() => {
    if (isError) {
      navigate('/projects', { replace: true });
    }
  }, [isError, navigate]);

  // Function to format price from BigInt
  const formatPrice = (price: bigint | undefined) => {
    if (!price) return '0.00';
    // Convert Wei to APE (assuming 18 decimals)
    return parseFloat(Number(price) / 10**18 + '').toFixed(2);
  };

  // Calculate progress percentage
  const calculateProgress = (available: bigint | undefined, total: bigint | undefined) => {
    if (!available || !total || total === 0n) return 0;
    return 100 - Number((available * 100n) / total);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            Project not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <img 
                src={project.imageURL || "/api/placeholder/600/400"} 
                alt={project.title} 
                className="w-full h-64 md:h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/api/placeholder/600/400";
                }}
              />
            </div>
            <div className="md:w-1/2 p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-700 mb-6">{project.location}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Share Price</p>
                  <p className="text-xl font-semibold text-gray-900">{formatPrice(project.pricePerShare)} APE</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Shares</p>
                  <p className="text-xl font-semibold text-gray-900">{Number(project.totalShares).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Available Shares</p>
                  <p className="text-xl font-semibold text-gray-900">{Number(project.availableShares).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Sold</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {Number(project.totalShares - project.availableShares).toLocaleString()} Shares
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Funding Progress</span>
                  <span>{calculateProgress(project.availableShares, project.totalShares)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${calculateProgress(project.availableShares, project.totalShares)}%` }}
                  ></div>
                </div>
              </div>
              
              <InvestForm project={project} />
            </div>
          </div>
          
          <div className="p-6 md:p-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Project</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>{project.description}</p>
            </div>
          </div>
          
          <div className="p-6 md:p-8 border-t border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-700 mb-4">{project.location}</p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Owner</h3>
                <p className="text-gray-700 break-all">{project.owner}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Investment Structure</h3>
                <p className="text-gray-700 mb-4">
                  Each share represents a fractional ownership in this land project. Smart contracts automatically handle profit distribution based on the number of shares owned.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Note</h3>
                <p className="text-gray-700">
                  All transactions are final and recorded on the blockchain. Please research thoroughly before investing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
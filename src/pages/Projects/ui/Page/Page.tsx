
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractRead } from 'wagmi';
import { CONTRACT_ADDRESS, LandFormABI } from '../../../../constants/contracts';

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

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch projects from the smart contract
  const { data, isError, isLoading: isLoadingProjects } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: LandFormABI,
    functionName: 'getAllProjects',
  });

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setProjects(data as unknown as Project[]);
    }
    setIsLoading(isLoadingProjects);
  }, [data, isLoadingProjects]);

  // Function to format price from BigInt
  const formatPrice = (price: bigint) => {
    // Convert Wei to APE (assuming 18 decimals)
    return parseFloat(Number(price) / 10**18 + '').toFixed(2);
  };

  // Calculate progress percentage
  const calculateProgress = (available: bigint, total: bigint) => {
    if (total === 0n) return 0;
    return 100 - Number((available * 100n) / total);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Available Land Projects</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Browse through our curated selection of premium land investment opportunities. Each project offers fractional ownership through tokenized shares.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            Error loading projects. Please try again later.
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
            No projects available at the moment. Please check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div key={Number(project.id)} className="card hover:translate-y-[-5px]">
                <img 
                  src={project.imageURL || "/api/placeholder/400/250"} 
                  alt={project.title} 
                  className="w-full h-48 object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/api/placeholder/400/250";
                  }}
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 truncate">{project.title}</h3>
                    {Number(project.availableShares) < Number(project.totalShares) / 4 && (
                      <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Hot</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{project.location}</p>
                  
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{calculateProgress(project.availableShares, project.totalShares)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${calculateProgress(project.availableShares, project.totalShares)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-4">
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
                  <Link 
                    to={`/projects/${project.id}`} 
                    className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-md transition-colors"
                  >
                    View Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
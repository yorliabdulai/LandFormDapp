import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractRead } from 'wagmi';
import { CONTRACT_ADDRESS, LandFormABI } from '../../../../constants/contracts';
import { 
  MapPin, 
  BarChart3, 
  DollarSign,
  ArrowRight, 
  Info,
  FileCheck,
  Loader
} from 'lucide-react';

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
  isActive?: boolean;
};

// Helper function to format IPFS URLs with proper logging
const formatIPFSUrl = (url: string) => {
  if (!url) {
    return "/api/placeholder/400/250";
  }
  
  let formattedUrl = url;
  
  // Check if the URL is an IPFS hash/CID
  if (url.startsWith('Qm') || url.startsWith('bafy')) {
    formattedUrl = `https://ipfs.filebase.io/ipfs/${url}`;
  } else if (url.startsWith('ipfs://')) {
    formattedUrl = url.replace('ipfs://', 'https://ipfs.filebase.io/ipfs/');
  } else if (url.includes('ipfs/')) {
    try {
      const parts = url.split('ipfs/');
      if (parts.length > 1) {
        const cid = parts[1].split('/')[0]; // Extract CID
        formattedUrl = `https://ipfs.filebase.io/ipfs/${cid}`;
      }
    } catch (error) {
      console.error("Error processing IPFS path:", error);
    }
  }
  
  return formattedUrl;
};

// ProjectCard Component
const ProjectCard = ({ project }: { project: Project }) => {
  const [imageUrl, setImageUrl] = useState<string>("/api/placeholder/400/250");
  const [imageError, setImageError] = useState<boolean>(false);
  
  useEffect(() => {
    // Use imageURL from the project
    if (project?.imageId) {
      const formattedUrl = formatIPFSUrl(project.imageId);
      setImageUrl(formattedUrl);
      
      // Pre-load the image to test if it works
      const img = new Image();
      img.onload = () => {
        setImageError(false);
      };
      
      img.onerror = () => {
        setImageError(true);
        
        // Try an alternative gateway if the first one fails
        const altUrl = `https://ipfs.io/ipfs/${project.imageId.replace('ipfs://', '').replace(/^.*ipfs\//, '')}`;
        setImageUrl(altUrl);
      };
      
      img.src = formattedUrl;
    }
  }, [project]);

  // Function to format price from BigInt
  const formatPrice = (price: bigint) => {
    // Convert Wei to APE (assuming 18 decimals)
    return parseFloat(Number(price) / 10**18 + '').toFixed(2);
  };

  // Function to calculate availability percentage
  // const calculateAvailability = (available: bigint, total: bigint): string => {
  //   if (!available || !total || total === 0n) return "0";
  //   return (Number(available) * 100 / Number(total)).toFixed(0);
  // };

  // Function to calculate progress percentage
  const calculateProgress = (available: bigint, total: bigint) => {
    if (total === 0n) return 0;
    return 100 - Number((available * 100n) / total);
  };

  // Function to get status tag based on availability
  const getStatusTag = (available: bigint, total: bigint) => {
    const percentage = Number(available) * 100 / Number(total);
    
    if (percentage < 20) {
      return <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
        <Info className="w-3 h-3" /> Limited
      </span>;
    } else if (percentage < 50) {
      return <span className="absolute top-2 right-2 bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
        <BarChart3 className="w-3 h-3" /> High Demand
      </span>;
    } else {
      return <span className="absolute top-2 right-2 bg-secondary-100 text-secondary-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
        <FileCheck className="w-3 h-3" /> New
      </span>;
    }
  };

  return (
    <div className="card hover:translate-y-[-5px] transition-all duration-300 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md">
      <div className="relative">
        {imageError ? (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <p className="text-sm text-gray-500">Image unavailable</p>
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt={project.title} 
            className="w-full h-48 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
              setImageError(true);
              
              // Try a different gateway as fallback
              if (!imageUrl.includes('ipfs.io')) {
                const fallbackUrl = `https://ipfs.io/ipfs/${project.imageId?.replace('ipfs://', '').replace(/^.*ipfs\//, '')}`;
                setImageUrl(fallbackUrl);
                setImageError(false);
              }
            }}
          />
        )}
        {getStatusTag(project.availableShares, project.totalShares)}
      </div>
      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
          <div className="flex items-center mt-1 text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            {project.location}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative w-full bg-gray-200 rounded-full h-2.5 mb-4 mt-4">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${calculateProgress(project.availableShares, project.totalShares)}%` }}
          ></div>
          <span className="absolute right-0 top-3 text-xs text-gray-500">
            {calculateProgress(project.availableShares, project.totalShares)}% filled
          </span>
        </div>
        
        <div className="flex justify-between mb-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              Share Price
            </p>
            <p className="text-lg font-semibold text-gray-900">{formatPrice(project.pricePerShare)} APE</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center">
              <BarChart3 className="h-3 w-3 mr-1" />
              Available
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {Number(project.availableShares).toLocaleString()}/{Number(project.totalShares).toLocaleString()}
            </p>
          </div>
        </div>
        <Link 
          to={`/projects/${project.id}`} 
          className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-md transition-colors mt-6 flex items-center justify-center"
        >
          View Project
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
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
      // Map the projects and ensure they all have isActive property set to true
      const formattedProjects = (data as unknown as Project[]).map(project => ({
        ...project,
        isActive: true // Set all projects as active by default
      }));
      setProjects(formattedProjects);
    }
    setIsLoading(isLoadingProjects);
  }, [data, isLoadingProjects]);

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
            <Loader className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-600">Loading projects from blockchain...</span>
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
              <ProjectCard 
                key={Number(project.id)} 
                project={project} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
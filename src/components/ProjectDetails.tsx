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
  imageId: string;
  description: string;
  owner: string;
};

// Helper function to format IPFS URLs with extensive logging
const formatIPFSUrl = (url: string) => {
  console.log("🔍 Original imageURL:", url);
  
  if (!url) {
    console.log("⚠️ No URL provided, using placeholder");
    return "/api/placeholder/600/400";
  }
  
  let formattedUrl = url;
  
  // Check if the URL is an IPFS hash/CID
  if (url.startsWith('Qm') || url.startsWith('bafy')) {
    formattedUrl = `https://ipfs.filebase.io/ipfs/${url}`;
    console.log("🔄 Converted raw CID to Filebase gateway URL:", formattedUrl);
  } else if (url.startsWith('ipfs://')) {
    formattedUrl = url.replace('ipfs://', 'https://ipfs.filebase.io/ipfs/');
    console.log("🔄 Converted ipfs:// protocol to Filebase gateway URL:", formattedUrl);
  } else if (url.includes('ipfs/')) {
    // Handle case where URL might contain ipfs/ path but not be properly formatted
    console.log("🔄 URL contains 'ipfs/' path, trying to extract CID");
    try {
      const parts = url.split('ipfs/');
      if (parts.length > 1) {
        const cid = parts[1].split('/')[0]; // Extract CID
        formattedUrl = `https://ipfs.filebase.io/ipfs/${cid}`;
        console.log("🔄 Extracted CID and converted to Filebase gateway URL:", formattedUrl);
      }
    } catch (error) {
      console.error("⚠️ Error processing IPFS path:", error);
    }
  } else {
    console.log("✅ Using URL as is (not identified as IPFS):", formattedUrl);
  }
  
  // Try multiple IPFS gateways if needed
  console.log("📋 Alternative URLs that could be tried:");
  console.log(`- Filebase: https://ipfs.filebase.io/ipfs/${url.replace('ipfs://', '')}`);
  console.log(`- IPFS.io: https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`);
  console.log(`- Cloudflare: https://cloudflare-ipfs.com/ipfs/${url.replace('ipfs://', '')}`);
  console.log(`- Infura: https://ipfs.infura.io/ipfs/${url.replace('ipfs://', '')}`);
  
  return formattedUrl;
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [expandDebug, setExpandDebug] = useState<boolean>(false);

  // Fetch project details from the smart contract
  const { data, isError, isLoading: isLoadingProject } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: LandFormABI,
    functionName: 'getProject',
    args: [BigInt(id || '0')],
  });
  
  useEffect(() => {
    if (data) {
      console.log("📦 Raw project data from contract:", data);
      const projectData = data as unknown as Project;
      console.log("🖼️ Image URL from contract:", projectData.imageId);
      setProject(projectData);
      
      // Try to pre-load the image to test if it works
      const img = new Image();
      const formattedUrl = formatIPFSUrl(projectData.imageId);
      setCurrentImageUrl(formattedUrl);
      
      img.onload = () => {
        console.log("✅ Image pre-loaded successfully:", formattedUrl);
        setImageError(false);
      };
      
      img.onerror = (e) => {
        console.error("❌ Image pre-load failed:", formattedUrl, e);
        setImageError(true);
        
        // Try alternative gateways if the first one fails
        tryAlternativeGateways(projectData.imageId);
      };
      
      img.src = formattedUrl;
    }
    setIsLoading(isLoadingProject);
  }, [data, isLoadingProject]);

  // Try different IPFS gateways if the default fails
  const tryAlternativeGateways = (url: string) => {
    if (!url) return;
    
    console.log("🔄 Trying alternative IPFS gateways");
    
    const cleanUrl = url.replace('ipfs://', '').replace(/^.*ipfs\//, '');
    const gateways = [
      `https://ipfs.filebase.io/ipfs/${cleanUrl}`,
      `https://ipfs.io/ipfs/${cleanUrl}`,
      `https://cloudflare-ipfs.com/ipfs/${cleanUrl}`,
      `https://dweb.link/ipfs/${cleanUrl}`,
      `https://ipfs.infura.io/ipfs/${cleanUrl}`,
    ];
    
    console.log("🔍 Cleaned CID/URL for gateway testing:", cleanUrl);
    console.log("📋 Testing these gateway URLs:", gateways);
    
    // We're just logging these - in a production app you might
    // use this info to automatically try different gateways
  };
  
  useEffect(() => {
    if (isError) {
      console.error("❌ Error fetching project data");
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
      <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            Project not found.
          </div>
        </div>
      </div>
    );
  }

  // Log information about the project when rendering
  console.log("🏞️ Rendering project details:", {
    id: project.id.toString(),
    title: project.title,
    imageURL: project.imageId,
    formattedImageURL: currentImageUrl,
    imageLoadError: imageError
  });

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Top section with image and details - stack on mobile, side by side on md+ */}
          <div className="flex flex-col md:flex-row">
            {/* Image section - full width on mobile, half width on md+ */}
            <div className="w-full md:w-1/2">
              {/* Image container - fixed height on mobile, full height on md+ */}
              <div className="relative w-full h-64 sm:h-80 md:h-full">
                {imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4 sm:p-6">
                    <p className="text-red-500 font-semibold mb-2 text-center">Image loading error</p>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2 text-center truncate max-w-full">
                      Raw URL: {project.imageId.length > 20 ? project.imageId.substring(0, 20) + '...' : project.imageId}
                    </p>
                    <button 
                      className="bg-primary-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-sm rounded-md hover:bg-primary-700"
                      onClick={() => {
                        // Try a different gateway when button is clicked
                        const newUrl = `https://ipfs.io/ipfs/${project.imageId.replace('ipfs://', '')}`;
                        console.log("🔄 Manually trying alternate gateway:", newUrl);
                        setCurrentImageUrl(newUrl);
                        setImageError(false);
                      }}
                    >
                      Try Alternate Gateway
                    </button>
                  </div>
                )}
                <img 
                  src={currentImageUrl} 
                  alt={project.title} 
                  className="w-full h-full object-cover" 
                  style={{ display: imageError ? 'none' : 'block' }}
                  onError={(e) => {
                    console.error("❌ Image failed to load in DOM:", currentImageUrl);
                    (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                    setImageError(true);
                  }}
                  onLoad={() => {
                    console.log("✅ Image loaded successfully in DOM:", currentImageUrl);
                    setImageError(false);
                  }}
                />
              </div>
              
              {/* Debug information - collapsible on mobile */}
              <div className="bg-gray-100 p-2">
                <button 
                  onClick={() => setExpandDebug(!expandDebug)} 
                  className="text-xs text-gray-500 flex items-center justify-between w-full md:hidden"
                >
                  <span>Debug Info {expandDebug ? '▲' : '▼'}</span>
                </button>
                <div className={`text-xs overflow-auto ${expandDebug ? 'block' : 'hidden md:block'}`}>
                  <p className="truncate">Raw URL: {project.imageId}</p>
                  <p className="truncate">Formatted URL: {currentImageUrl}</p>
                </div>
              </div>
            </div>

            {/* Project info section - full width on mobile, half width on md+ */}
            <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{project.title}</h1>
              <p className="text-gray-700 mb-4 sm:mb-6">{project.location}</p>
              
              {/* Stats grid - 2 columns on all screen sizes */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500">Share Price</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{formatPrice(project.pricePerShare)} APE</p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500">Total Shares</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{Number(project.totalShares).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500">Available Shares</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{Number(project.availableShares).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-500">Sold</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">
                    {Number(project.totalShares - project.availableShares).toLocaleString()} Shares
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-1">
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
              
              {/* Investment Form */}
              <InvestForm project={project} />
            </div>
          </div>
          
          {/* Project description section */}
          <div className="p-4 sm:p-6 md:p-8 border-t border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">About This Project</h2>
            <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none text-gray-700">
              <p>{project.description}</p>
            </div>
          </div>
          
          {/* Project details section */}
          <div className="p-4 sm:p-6 md:p-8 border-t border-gray-200 bg-gray-50">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Location</h3>
                <p className="text-gray-700 mb-3 sm:mb-4">{project.location}</p>
                
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Owner</h3>
                <p className="text-gray-700 break-all text-sm sm:text-base">{project.owner}</p>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Investment Structure</h3>
                <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                  Each share represents a fractional ownership in this land project. Smart contracts automatically handle profit distribution based on the number of shares owned.
                </p>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Important Note</h3>
                <p className="text-gray-700 text-sm sm:text-base">
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
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAllProjects } from '@/hooks/useProjects';
import { 
  Loader, 
  MapPin, 
  Settings, 
  ShieldCheck, 
  Banknote, 
  Wallet, 
  BarChart3, 
  DollarSign,
  ArrowRight, 
  Search, 
  Info,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

// Define the Project interface
interface Project {
  id: string | number;
  title: string;
  location: string;
  imageURL?: string;
  imageId?: string;
  pricePerShare: string | number;
  availableShares: string | number;
  totalShares: string | number;
  isActive: boolean;
}

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
const ProjectCard = ({ project, onClick }: { project: Project, onClick?: () => void }) => {
  const [imageUrl, setImageUrl] = useState<string>("/api/placeholder/400/250");
  const [imageError, setImageError] = useState<boolean>(false);
  
  useEffect(() => {
    // Use either imageURL or imageId depending on what's available
    const imageIdentifier = project?.imageURL || project?.imageId;
    if (imageIdentifier) {
      const formattedUrl = formatIPFSUrl(imageIdentifier);
      setImageUrl(formattedUrl);
      
      // Pre-load the image to test if it works
      const img = new Image();
      img.onload = () => {
        setImageError(false);
      };
      
      img.onerror = () => {
        setImageError(true);
        
        // Try an alternative gateway if the first one fails
        const altUrl = `https://ipfs.io/ipfs/${imageIdentifier.replace('ipfs://', '').replace(/^.*ipfs\//, '')}`;
        setImageUrl(altUrl);
      };
      
      img.src = formattedUrl;
    }
  }, [project]);

  // Function to format price to readable format
  const formatPrice = (weiValue: string | number): string => {
    if (!weiValue) return "0";
    // Convert BigInt to Number (safe for display purposes)
    const etherValue = Number(weiValue) / 1e18;
    return etherValue.toFixed(2);
  };

  // Function to calculate availability percentage
  const calculateAvailability = (available: string | number, total: string | number): string => {
    if (!available || !total || Number(total) === 0) return "0";
    return (Number(available) / Number(total) * 100).toFixed(0);
  };

  // Function to get status tag based on availability
  const getStatusTag = (available: string | number, total: string | number) => {
    const percentage = Number(available) / Number(total) * 100;
    
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
    <div 
      className="card hover:translate-y-[-5px] transition-all duration-300 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md"
      onClick={onClick}
    >
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
                const imageIdentifier = project?.imageURL || project?.imageId;
                const fallbackUrl = `https://ipfs.io/ipfs/${imageIdentifier?.replace('ipfs://', '').replace(/^.*ipfs\//, '')}`;
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
        <div className="flex justify-between mb-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              Share Price
            </p>
            <p className="text-lg font-semibold text-gray-900">{formatPrice(project.pricePerShare)} ETH</p>
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
        <div className="relative w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${calculateAvailability(project.availableShares, project.totalShares)}%` }}
          ></div>
          <span className="absolute right-0 top-3 text-xs text-gray-500">
            {calculateAvailability(project.availableShares, project.totalShares)}% available
          </span>
        </div>
        <Link 
          to={`/projects/${project.id.toString()}`} 
          className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-md transition-colors mt-6 flex items-center justify-center"
        >
          View Project
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

const Home = () => {
  const { isConnected } = useAccount();
  const { data: projectsData, isLoading, isError } = useAllProjects();
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load projects from blockchain. Please try again later.', {
        icon: '❌',
        duration: 4000,
      });
    }
  }, [isError]);

  useEffect(() => {
    // Check if projectsData exists and is an array
    if (projectsData && Array.isArray(projectsData) && projectsData.length > 0) {
      // Select up to 3 active projects with the highest available shares ratio
      const activeFeatured = projectsData
        .filter((project: Project) => project.isActive)
        .sort((a: Project, b: Project) => {
          const ratioA = Number(a.availableShares) / Number(a.totalShares);
          const ratioB = Number(b.availableShares) / Number(b.totalShares);
          return ratioB - ratioA; // Sort by highest availability first
        })
        .slice(0, 3);
      
      setFeaturedProjects(activeFeatured);
      
      toast.success(`Loaded ${projectsData.length} projects from blockchain`, {
        icon: '✅',
        duration: 3000,
      });
    }
  }, [projectsData]);

  const handleExploreClick = () => {
    toast.success('Exploring available projects', {
      icon: '🔍',
      duration: 2000,
    });
  };

  const handleConnectWallet = () => {
    toast.loading('Opening wallet connection dialog...', {
      duration: 2000,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-secondary-600 py-20">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Invest in Land, <span className="text-primary-200">Fractionally</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              The future of real estate investment is here. Own a piece of premium land projects through tokenized shares.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/projects" className="btn btn-secondary flex items-center justify-center gap-2" onClick={handleExploreClick}>
                <Search className="w-5 h-5" />
                Explore Projects
              </Link>
              {!isConnected && (
                <button onClick={handleConnectWallet} className="btn bg-white text-primary-600 hover:bg-gray-100 flex items-center justify-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose LandForm?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides a secure and transparent way to invest in premium land projects globally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Blockchain</h3>
              <p className="text-gray-600">
                All investments are secured through smart contracts on the blockchain, ensuring transparency and immutability.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4">
                <Banknote className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fractional Ownership</h3>
              <p className="text-gray-600">
                Invest in as many shares as you want, starting with minimal capital. Lower entry barriers to premium real estate.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Profit Distribution</h3>
              <p className="text-gray-600">
                Receive your share of profits automatically when projects mature. Smart contracts handle all distributions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              LandForm makes real estate investment simple, transparent, and accessible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Projects</h3>
              <p className="text-gray-600">Explore our curated selection of premium land investment opportunities.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-gray-600">Connect your crypto wallet to enable secure blockchain transactions.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Purchase Shares</h3>
              <p className="text-gray-600">Choose how many shares you want to buy in your selected project.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Receive Profits</h3>
              <p className="text-gray-600">Get your share of project profits automatically through smart contracts.</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/projects" className="btn btn-primary flex items-center justify-center gap-2 mx-auto" onClick={handleExploreClick}>
              <FileCheck className="w-5 h-5" />
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Projects</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover some of our most popular land investment opportunities.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Loading projects from blockchain...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-10 bg-red-50 rounded-lg p-6">
              <Info className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Unable to load projects from the blockchain.</p>
              <p className="text-gray-600 mt-2">Please check your connection and try again later.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : featuredProjects.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg p-6">
              <Info className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">No active projects available at the moment.</p>
              <Link 
                to="/projects" 
                className="text-primary-600 hover:text-primary-700 font-medium mt-4 inline-flex items-center gap-1"
                onClick={handleExploreClick}
              >
                View All Projects
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProjects.map(project => (
                  <ProjectCard 
                    key={project.id.toString()} 
                    project={project}
                    onClick={() => toast.success(`Viewing ${project.title} details`, { duration: 2000 })}
                  />
                ))}
              </div>

              <div className="mt-12 text-center">
                <Link 
                  to="/projects" 
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 mx-auto"
                  onClick={handleExploreClick}
                >
                  View All Projects
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
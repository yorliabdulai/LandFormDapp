import React, { useEffect, useState, useRef } from 'react';
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
  FileCheck,
  Hexagon,
  Database
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

// Define Hexagon interface for blockchain animation
interface AnimatedHexagon {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
  rotationSpeed: number;
  rotation: number;
  connected: number[];
}

// Define DataPacket interface for animations
interface DataPacket {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  speed: number;
}

// BlockchainHexagon Animation Component
const BlockchainAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Define hexagon properties
    const hexSize = dimensions.width < 768 ? 20 : 30;
    const hexagons: AnimatedHexagon[] = [];
    const numHexagons = dimensions.width < 768 ? 30 : 50;
    
    // Create hexagons with random positions
    for (let i = 0; i < numHexagons; i++) {
      hexagons.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: hexSize * (0.5 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: 0.1 + Math.random() * 0.2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        rotation: Math.random() * Math.PI * 2,
        connected: []
      });
    }
    
    // Connect nearby hexagons
    for (let i = 0; i < hexagons.length; i++) {
      for (let j = i + 1; j < hexagons.length; j++) {
        const dx = hexagons[i].x - hexagons[j].x;
        const dy = hexagons[i].y - hexagons[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < dimensions.width / 5) {
          hexagons[i].connected.push(j);
        }
      }
    }
    
    const drawHexagon = (x: number, y: number, size: number, rotation = 0, opacity = 0.2) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = rotation + i * Math.PI / 3;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    
    const dataPackets: DataPacket[] = [];
    
    const animateDataPacket = (x1: number, y1: number, x2: number, y2: number) => {
      dataPackets.push({
        x1, y1, x2, y2,
        progress: 0,
        speed: 0.01 + Math.random() * 0.02
      });
    };
    
    const drawDataPackets = () => {
      for (let i = 0; i < dataPackets.length; i++) {
        const packet = dataPackets[i];
        
        const x = packet.x1 + (packet.x2 - packet.x1) * packet.progress;
        const y = packet.y1 + (packet.y2 - packet.y1) * packet.progress;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.fill();
        
        packet.progress += packet.speed;
        
        if (packet.progress >= 1) {
          dataPackets.splice(i, 1);
          i--;
        }
      }
    };
    
    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw connections first
      for (let i = 0; i < hexagons.length; i++) {
        const hex = hexagons[i];
        for (const connectedIdx of hex.connected) {
          const connectedHex = hexagons[connectedIdx];
          
          // Calculate distance for opacity
          const dx = hex.x - connectedHex.x;
          const dy = hex.y - connectedHex.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = dimensions.width / 5;
          const opacity = 0.1 * (1 - distance / maxDistance);
          
          ctx.beginPath();
          ctx.moveTo(hex.x, hex.y);
          ctx.lineTo(connectedHex.x, connectedHex.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Occasionally animate a "data packet" along the connection
          if (Math.random() < 0.001) {
            animateDataPacket(hex.x, hex.y, connectedHex.x, connectedHex.y);
          }
        }
      }
      
      // Draw hexagons
      for (const hex of hexagons) {
        drawHexagon(hex.x, hex.y, hex.size, hex.rotation, hex.opacity);
        
        // Update position
        hex.x += hex.vx;
        hex.y += hex.vy;
        hex.rotation += hex.rotationSpeed;
        
        // Bounce off edges
        if (hex.x < 0 || hex.x > dimensions.width) hex.vx *= -1;
        if (hex.y < 0 || hex.y > dimensions.height) hex.vy *= -1;
      }
      
      // Draw data packets
      drawDataPackets();
      
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [dimensions]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.3 }}
    />
  );
};

// Blockchain Data Flow Animation Component
const BlockchainDataFlow = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const blocks: HTMLDivElement[] = [];
    const numBlocks = 5;
    
    for (let i = 0; i < numBlocks; i++) {
      const block = document.createElement('div');
      block.className = 'absolute w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center opacity-0';
      
      const hexagon = document.createElement('div');
      hexagon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><polygon points="21 16 21 8 12 4 3 8 3 16 12 20 21 16"></polygon></svg>`;
      block.appendChild(hexagon);
      
      container.appendChild(block);
      blocks.push(block);
      
      // Position off-screen initially
      block.style.left = '-100px';
      block.style.top = `${50 + i * 40}px`;
    }
    
    // Animate blocks
    const animateBlocks = () => {
      const containerWidth = container.offsetWidth;
      
      blocks.forEach((block, index) => {
        // Stagger the timing
        setTimeout(() => {
          // Reset position
          block.style.transition = 'none';
          block.style.left = '-100px';
          block.style.opacity = '0';
          
          // Force reflow
          block.offsetHeight;
          
          // Animate
          block.style.transition = 'all 8s linear';
          block.style.left = `${containerWidth + 100}px`;
          block.style.opacity = '0.8';
        }, index * 2000);
      });
    };
    
    // Start animation
    animateBlocks();
    
    // Repeat animation
    const interval = setInterval(animateBlocks, numBlocks * 2000 + 8000);
    
    return () => {
      clearInterval(interval);
      blocks.forEach(block => block?.remove());
    };
  }, []);
  
  return <div ref={containerRef} className="absolute inset-0 overflow-hidden z-0 pointer-events-none"></div>;
};

// Chain Connection Animation for How It Works section
const ChainConnectionAnimation = () => {
  const svgRef = useRef<SVGPathElement>(null);
  
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    // TypeScript requires a number here, not a SVGLength object
    const length = svg.getTotalLength ? svg.getTotalLength() : 0;
    
    if (svg.style) {
      svg.style.strokeDasharray = length.toString();
      svg.style.strokeDashoffset = length.toString();
      
      const animatePath = () => {
        if (svg.style) {
          svg.style.transition = 'stroke-dashoffset 2s ease-in-out';
          svg.style.strokeDashoffset = '0';
          
          setTimeout(() => {
            if (svg.style) {
              svg.style.transition = 'stroke-dashoffset 0.5s ease-in-out';
              svg.style.strokeDashoffset = length.toString();
              
              setTimeout(animatePath, 500);
            }
          }, 3000);
        }
      };
      
      animatePath();
    }
  }, []);
  
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-0">
      <svg width="100%" height="100%" className="absolute">
        <path
          ref={svgRef}
          d="M100,50 L200,50 M300,50 L400,50 M500,50 L600,50"
          stroke="#3B82F6"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </div>
  );
};

// Data Block Animation Component
const DataBlockAnimation = () => {
  return (
    <div className="relative">
      <div className="data-block absolute -top-12 -right-12 w-24 h-24 opacity-50 animate-float">
        <Hexagon className="w-full h-full text-primary-300" />
      </div>
      <div className="data-block absolute top-20 -left-16 w-16 h-16 opacity-30 animate-float-delayed">
        <Hexagon className="w-full h-full text-secondary-300" />
      </div>
      <div className="data-block absolute -bottom-10 right-20 w-20 h-20 opacity-40 animate-float-slow">
        <Database className="w-full h-full text-primary-400" />
      </div>
    </div>
  );
};

// Helper function to format IPFS URLs with proper logging
const formatIPFSUrl = (url: string): string => {
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

// Define props interface for ProjectCard
interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

// ProjectCard Component
const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string>("/api/placeholder/400/250");
  const [imageError, setImageError] = useState<boolean>(false);
  const [showBlockchain, setShowBlockchain] = useState<boolean>(false);
  
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
    
    // Show blockchain animation with delay
    setTimeout(() => setShowBlockchain(true), Math.random() * 1000);
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
                if (imageIdentifier) {
                  const fallbackUrl = `https://ipfs.io/ipfs/${imageIdentifier.replace('ipfs://', '').replace(/^.*ipfs\//, '')}`;
                  setImageUrl(fallbackUrl);
                  setImageError(false);
                }
              }
            }}
          />
        )}
        {getStatusTag(project.availableShares, project.totalShares)}
        
        {/* Mini blockchain animation overlay */}
        {showBlockchain && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <path 
                d="M20,50 L50,30 L80,50 L80,80 L50,100 L20,80 Z" 
                fill="none" 
                stroke="white" 
                strokeWidth="1"
                className="animate-pulse" 
              />
              <path 
                d="M80,50 L110,30 L140,50 L140,80 L110,100 L80,80 Z" 
                fill="none" 
                stroke="white" 
                strokeWidth="1"
                className="animate-pulse-delayed" 
              />
              <line 
                x1="80" y1="50" x2="80" y2="80" 
                stroke="white" 
                strokeWidth="1" 
                className="animate-dash" 
              />
              <circle cx="65" cy="65" r="3" fill="white" className="animate-ping" />
            </svg>
          </div>
        )}
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

// Define props for FloatingBlockchainElement
interface FloatingBlockchainElementProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'light';
  className?: string;
}

// Floating Blockchain Element Component
const FloatingBlockchainElement: React.FC<FloatingBlockchainElementProps> = ({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}) => {
  const sizeClasses: Record<string, string> = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };
  
  const colorClasses: Record<string, string> = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    light: 'text-gray-100'
  };
  
  return (
    <div className={`absolute ${sizeClasses[size]} ${colorClasses[color]} opacity-20 animate-float ${className}`}>
      <Hexagon strokeWidth={1} className="w-full h-full" />
    </div>
  );
};

// DataTransfer Animation
const DataTransferAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const createDataPacket = () => {
      const packet = document.createElement('div');
      packet.className = 'absolute w-3 h-3 bg-primary-500 rounded-full opacity-80';
      
      // Random starting position on the left
      const startY = Math.random() * container.offsetHeight;
      packet.style.left = '0px';
      packet.style.top = `${startY}px`;
      
      container.appendChild(packet);
      
      // Animate to random end position on the right
      const endY = Math.random() * container.offsetHeight;
      setTimeout(() => {
        packet.style.transition = 'all 3s ease-in-out';
        packet.style.left = `${container.offsetWidth}px`;
        packet.style.top = `${endY}px`;
        packet.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => packet?.remove(), 3000);
      }, 10);
    };
    
    // Create a packet every 300-800ms
    const interval = setInterval(() => {
      if (Math.random() > 0.5) createDataPacket();
    }, 300 + Math.random() * 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return <div ref={containerRef} className="absolute inset-0 overflow-hidden z-0 pointer-events-none"></div>;
};

const Home: React.FC = () => {
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
  
  // Add this CSS to your global styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      
      @keyframes floatDelayed {
        0% { transform: translateY(-10px); }
        50% { transform: translateY(0px); }
        100% { transform: translateY(-10px); }
      }
      
      @keyframes floatSlow {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(5deg); }
        100% { transform: translateY(0px) rotate(0deg); }
      }
      
      @keyframes dash {
        to {
          stroke-dashoffset: 0;
        }
      }
      
      @keyframes pulse {
        0% { opacity: 0.3; }
        50% { opacity: 0.8; }
        100% { opacity: 0.3; }
      }
      
      @keyframes pulseDelayed {
        0% { opacity: 0.8; }
        50% { opacity: 0.3; }
        100% { opacity: 0.8; }
      }
      
      .animate-float {
        animation: float 4s ease-in-out infinite;
      }
      
      .animate-float-delayed {
        animation: floatDelayed 4s ease-in-out infinite;
      }
      
      .animate-float-slow {
        animation: floatSlow 6s ease-in-out infinite;
      }
      
      .animate-dash {
        stroke-dasharray: 40;
        stroke-dashoffset: 40;
        animation: dash 3s linear infinite;
      }
      
      .animate-pulse {
        animation: pulse 4s ease-in-out infinite;
      }
      
      .animate-pulse-delayed {
        animation: pulseDelayed 4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-secondary-600 py-20">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        {/* Background blockchain animation */}
        <BlockchainAnimation />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Floating blockchain elements */}
            <FloatingBlockchainElement size="lg" color="light" className="-top-16 -left-10" />
            <FloatingBlockchainElement size="md" color="light" className="top-20 -right-10" />
            <FloatingBlockchainElement size="sm" color="light" className="-bottom-12 left-20" />
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 relative">
              Invest in Land, <span className="text-primary-200">Fractionally</span>
              
              {/* Animated highlight effect for "Fractionally" */}
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 600 10">
                <path d="M0,5 Q150,9 300,5 T600,5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                  <animate 
                    attributeName="d" 
                    from="M0,5 Q150,9 300,5 T600,5" 
                    to="M0,5 Q150,1 300,5 T600,5"
                    dur="4s" 
                    repeatCount="indefinite" 
                  />
                </path>
              </svg>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              The future of real estate investment is here. Own a piece of premium land projects through tokenized shares.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/projects" className="btn btn-secondary flex items-center justify-center gap-2 group" onClick={handleExploreClick}>
                <Search className="w-5 h-5" />
                Explore Projects
                <span className="absolute inset-0 w-full h-full rounded overflow-hidden">
                  <span className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-80 transform scale-0 group-hover:scale-100 transition-all duration-300"></span>
                  <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-80 transform scale-0 group-hover:scale-100 transition-all duration-300 delay-100"></span>
                  <span className="absolute bottom-0 left-0 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-80 transform scale-0 group-hover:scale-100 transition-all duration-300 delay-200"></span>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-80 transform scale-0 group-hover:scale-100 transition-all duration-300 delay-300"></span>
                </span>
              </Link>
              {!isConnected && (
                <button onClick={handleConnectWallet} className="btn bg-white text-primary-600 hover:bg-gray-100 flex items-center justify-center gap-2 relative overflow-hidden group">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                  
                  {/* Wallet animation */}
                  <span className="absolute inset-0 w-full h-full">
                    <span className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 bg-primary-600 opacity-20 rounded-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Data transfer animation */}
        <DataTransferAnimation />
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Floating blockchain elements */}
          <FloatingBlockchainElement size="lg" className="top-10 -right-10 opacity-10" />
          <FloatingBlockchainElement size="sm" className="bottom-20 left-10 opacity-10" />
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose LandForm?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides a secure and transparent way to invest in premium land projects globally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4 z-10 relative">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 relative z-10">Secure Blockchain</h3>
              <p className="text-gray-600 relative z-10">
                All investments are secured through smart contracts on the blockchain, ensuring transparency and immutability.
              </p>
              
              {/* Blockchain animation that appears on hover */}
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="20" y="20" width="60" height="60" rx="5" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-500">
                    <animate attributeName="stroke-dasharray" from="0 236" to="236 0" dur="2s" repeatCount="indefinite" />
                  </rect>
                  <line x1="20" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary-500">
                    <animate attributeName="stroke-dasharray" from="0 60" to="60 0" dur="1.5s" repeatCount="indefinite" />
                  </line>
                  <line x1="20" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="1" className="text-primary-500">
                    <animate attributeName="stroke-dasharray" from="0 60" to="60 0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                  </line>
                  <circle cx="30" cy="30" r="3" fill="currentColor" className="text-primary-500">
                    <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="50" cy="50" r="3" fill="currentColor" className="text-primary-500">
                    <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="70" cy="70" r="3" fill="currentColor" className="text-primary-500">
                    <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4 z-10 relative">
                <Banknote className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 relative z-10">Fractional Ownership</h3>
              <p className="text-gray-600 relative z-10">
                Invest in as many shares as you want, starting with minimal capital. Lower entry barriers to premium real estate.
              </p>
              
              {/* Fractional animation that appears on hover */}
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="10" y="20" width="30" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary-500">
                    <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
                  </rect>
                  <rect x="60" y="20" width="30" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary-500">
                    <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" begin="0.5s" repeatCount="indefinite" />
                  </rect>
                  <rect x="10" y="60" width="30" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary-500">
                    <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" begin="1s" repeatCount="indefinite" />
                  </rect>
                  <rect x="60" y="60" width="30" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary-500">
                    <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" begin="1.5s" repeatCount="indefinite" />
                  </rect>
                  <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-primary-500" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-primary-500" />
                </svg>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4 z-10 relative">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 relative z-10">Profit Distribution</h3>
              <p className="text-gray-600 relative z-10">
                Receive your share of profits automatically when projects mature. Smart contracts handle all distributions.
              </p>
              
              {/* Distribution animation that appears on hover */}
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary-500" />
                  <line x1="30" y1="60" x2="50" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary-500">
                    <animate attributeName="stroke-dasharray" from="0 30" to="30 0" dur="1.5s" repeatCount="indefinite" />
                  </line>
                  <line x1="50" y1="40" x2="70" y2="60" stroke="currentColor" strokeWidth="1" className="text-primary-500">
                    <animate attributeName="stroke-dasharray" from="0 30" to="30 0" dur="1.5s" repeatCount="indefinite" />
                  </line>
                  <circle cx="30" cy="60" r="5" fill="currentColor" className="text-primary-500">
                    <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="70" cy="60" r="5" fill="currentColor" className="text-primary-500">
                    <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="50" cy="70" r="5" fill="currentColor" className="text-primary-500">
                    <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" begin="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Background blockchain animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 opacity-5">
              <svg viewBox="0 0 100 100">
                <defs>
                  <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary-500" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100" height="100" fill="url(#gridPattern)" />
              </svg>
            </div>
          </div>
          
          <div className="text-center mb-12 relative">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              LandForm makes real estate investment simple, transparent, and accessible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Chain connection animation */}
            <div className="absolute top-1/2 left-0 w-full h-1 -mt-0.5 hidden md:block">
              <svg width="100%" height="100%" className="absolute">
                <line 
                  x1="10%" 
                  y1="50%" 
                  x2="90%" 
                  y2="50%" 
                  stroke="#3B82F6" 
                  strokeWidth="2" 
                  strokeDasharray="5,5"
                  strokeLinecap="round"
                >
                  <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
                </line>
                <circle cx="25%" cy="50%" r="4" fill="#3B82F6">
                  <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="50%" cy="50%" r="4" fill="#3B82F6">
                  <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1s" repeatCount="indefinite" />
                </circle>
                <circle cx="75%" cy="50%" r="4" fill="#3B82F6">
                  <animate attributeName="opacity" values="0;1;0" dur="3s" begin="2s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <Search className="h-8 w-8" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full animate-ping"></span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Projects</h3>
              <p className="text-gray-600">Explore our curated selection of premium land investment opportunities.</p>
            </div>

            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <Wallet className="h-8 w-8" />
                <div className="absolute inset-0 rounded-full border-2 border-white opacity-70">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-gray-600">Connect your crypto wallet to enable secure blockchain transactions.</p>
            </div>

            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <DollarSign className="h-8 w-8" />
                <svg className="absolute inset-0" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeDasharray="251" strokeDashoffset="0">
                    <animate attributeName="stroke-dashoffset" from="251" to="0" dur="5s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Purchase Shares</h3>
              <p className="text-gray-600">Choose how many shares you want to buy in your selected project.</p>
            </div>

            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 overflow-hidden">
                <BarChart3 className="h-8 w-8" />
                
                {/* Animated bars within the icon */}
                <div className="absolute bottom-2 left-4 w-2 h-2 bg-white rounded-sm">
                  <animate attributeName="height" values="2;6;2" dur="2s" repeatCount="indefinite" />
                </div>
                <div className="absolute bottom-2 left-7 w-2 h-4 bg-white rounded-sm">
                  <animate attributeName="height" values="4;8;4" dur="2s" repeatCount="indefinite" begin="0.3s" />
                </div>
                <div className="absolute bottom-2 left-10 w-2 h-6 bg-white rounded-sm">
                  <animate attributeName="height" values="6;10;6" dur="2s" repeatCount="indefinite" begin="0.6s" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Receive Profits</h3>
              <p className="text-gray-600">Get your share of project profits automatically through smart contracts.</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/projects" className="btn btn-primary flex items-center justify-center gap-2 mx-auto group relative overflow-hidden" onClick={handleExploreClick}>
              <span className="relative z-10 flex items-center">
                <FileCheck className="w-5 h-5" />
                Get Started Now
              </span>
              
              {/* Button animation */}
              <span className="absolute bottom-0 left-0 w-full h-0 bg-white opacity-20 group-hover:h-full transition-all duration-300"></span>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 bg-white rounded-full opacity-20 group-hover:w-32 group-hover:h-32 transition-all duration-500"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-16 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Floating blockchain elements */}
          <FloatingBlockchainElement size="lg" className="-top-10 right-20" />
          <FloatingBlockchainElement size="sm" className="bottom-20 left-10" />
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Projects</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover some of our most popular land investment opportunities.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <Loader className="h-8 w-8 animate-spin text-primary-600" />
                <div className="absolute inset-0 rounded-full">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="8" />
                  </svg>
                </div>
              </div>
              <span className="ml-2 text-gray-600">Loading projects from blockchain...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-10 bg-red-50 rounded-lg p-6">
              <Info className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Unable to load projects from the blockchain.</p>
              <p className="text-gray-600 mt-2">Please check your connection and try again later.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors relative overflow-hidden group"
              >
                <span className="relative z-10">Retry</span>
                <span className="absolute top-0 left-0 w-full h-0 bg-primary-700 group-hover:h-full transition-all duration-300"></span>
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
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 mx-auto group"
                  onClick={handleExploreClick}
                >
                  <span>View All Projects</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Add custom blockchain footer animation */}
      <div className="relative h-12 bg-white overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-100 via-primary-600 to-secondary-600">
          <div className="absolute top-0 left-0 w-4 h-full bg-white opacity-30 animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-0 left-1/4 w-8 h-full bg-white opacity-30 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
          <div className="absolute top-0 left-2/3 w-6 h-full bg-white opacity-30 animate-pulse" style={{ animationDuration: '4s', animationDelay: '2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
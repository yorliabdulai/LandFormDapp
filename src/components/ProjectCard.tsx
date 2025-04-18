import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  imageId: string;
  title: string;
  location: string;
  pricePerShare: number;
  availableShares: number;
  totalShares: number;
}

// Helper function to format IPFS URLs with proper logging
const formatIPFSUrl = (url: string) => {
  console.log("🔍 Original imageId:", url);
  
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
  
  return formattedUrl;
};

const ProjectCard = ({ project }: { project: Project }) => {
  const [imageUrl, setImageUrl] = useState<string>("/api/placeholder/600/400");
  const [imageError, setImageError] = useState<boolean>(false);
  
  useEffect(() => {
    if (project?.imageId) {
      // Format and set the image URL when component mounts or project changes
      const formattedUrl = formatIPFSUrl(project.imageId);
      setImageUrl(formattedUrl);
      console.log("🖼️ Project card image URL set to:", formattedUrl);
      
      // Pre-load the image to test if it works
      const img = new Image();
      img.onload = () => {
        console.log("✅ Card image pre-loaded successfully:", formattedUrl);
        setImageError(false);
      };
      
      img.onerror = (e) => {
        console.error("❌ Card image pre-load failed:", formattedUrl, e);
        setImageError(true);
        
        // Try an alternative gateway if the first one fails
        const altUrl = `https://ipfs.io/ipfs/${project.imageId.replace('ipfs://', '')}`;
        console.log("🔄 Trying alternative gateway for card:", altUrl);
        setImageUrl(altUrl);
      };
      
      img.src = formattedUrl;
    }
  }, [project]);

  return (
    <Link to={`/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
        <div className="relative w-full h-48">
          {/* Image with error handling */}
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <p className="text-sm text-gray-500">Image unavailable</p>
            </div>
          ) : (
            <img 
              src={imageUrl} 
              alt={project.title} 
              className="w-full h-48 object-cover" 
              onError={(e) => {
                console.error("❌ Card image failed to load in DOM:", imageUrl);
                (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                setImageError(true);
                
                // Try a different gateway as fallback
                if (!imageUrl.includes('ipfs.io')) {
                  const fallbackUrl = `https://ipfs.io/ipfs/${project.imageId.replace('ipfs://', '').replace(/^.*ipfs\//, '')}`;
                  console.log("🔄 Trying fallback gateway:", fallbackUrl);
                  setImageUrl(fallbackUrl);
                  setImageError(false);
                }
              }}
              onLoad={() => {
                console.log("✅ Card image loaded successfully in DOM:", imageUrl);
                setImageError(false);
              }}
            />
          )}
          
          {/* Debug overlay - comment out in production */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 overflow-hidden">
            ID: {project.imageId.substring(0, 15)}...
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-800">{project.title}</h3>
          <p className="text-gray-500">{project.location}</p>
          <div className="mt-2">
            <span className="text-sm text-green-700 font-semibold">
              {project.pricePerShare} APE
            </span>
            <span className="text-sm text-gray-500 ml-2">
              {project.availableShares}/{project.totalShares} shares left
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
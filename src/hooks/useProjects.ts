// hooks/useProjects.ts
import React from 'react';
import {
  useReadContract,
  useWriteContract,
  useSimulateContract,
} from 'wagmi';
import { LandFormABI, CONTRACT_ADDRESS } from '@/constants/contracts';

export interface ProjectData {
  id: number;
  title: string;
  location: string;
  pricePerShare: number;
  totalShares: number;
  availableShares: number;
  imageURL: string;
  description: string;
  isActive: boolean;
  // Extended properties that might not be in the contract but used in UI
  startDate?: string;
  endDate?: string;
  minimumInvestment?: number;
  expectedReturn?: number;
  projectType?: string;
}

// Debug function to check if the ABI contains getAllProjects
function verifyABI() {
  console.log("ABI functions:", LandFormABI
    .filter(item => item.type === "function")
    .map(fn => fn.name));
  
  const hasGetAllProjects = LandFormABI.some(
    item => item.type === "function" && item.name === "getAllProjects"
  );
  
  console.log("Has getAllProjects function:", hasGetAllProjects);
  return hasGetAllProjects;
}

// ✅ Read: Fetch all projects with error handling
export const useAllProjects = () => {
  // Verify the ABI on component mount
  React.useEffect(() => {
    verifyABI();
  }, []);
  
  return useReadContract({
    abi: LandFormABI,
    address: CONTRACT_ADDRESS,
    functionName: 'getAllProjects',
  });
};

// ✅ Read: Get a single project by ID
export const useProject = (id?: number, options: { enabled?: boolean } = {}) => {
  const enabled = typeof id === 'number';
  
  return useReadContract({
    abi: LandFormABI,
    address: CONTRACT_ADDRESS,
    functionName: 'getProject',
    args: enabled ? [BigInt(id)] : undefined,
    query: {
      ...options,
      enabled: enabled && options?.enabled !== false,
    }
  });
};

// Generic project write hook for all contract operations
export const useProjectWrite = () => {
  const { writeContractAsync, isPending, isSuccess, isError, error } = useWriteContract();
  
  return {
    writeContractAsync,
    isPending,
    isSuccess,
    isError,
    error
  };
};

// ✅ Create Simulation: Simulate creating a new project
// In useProjects.ts
export const useCreateProjectSimulate = (projectData: {
  title: string;
  location: string;
  pricePerShare: string | number; // Accept string or number
  totalShares: number | string;   // Accept number or string
  imageURL: string;
  description: string;
}) => {
  // Parse values carefully
  const price = typeof projectData.pricePerShare === 'string' 
    ? parseFloat(projectData.pricePerShare || '0') 
    : projectData.pricePerShare;
  
  const shares = typeof projectData.totalShares === 'string'
    ? parseInt(projectData.totalShares || '0', 10)
    : projectData.totalShares;
  
  // Calculate Wei amount carefully
  const priceInWei = BigInt(Math.floor(price * 10**18));
  
  return useSimulateContract({
    abi: LandFormABI,
    address: CONTRACT_ADDRESS,
    functionName: 'createProject',
    args: [
      projectData.title || '',
      projectData.location || '',
      priceInWei,
      BigInt(shares),
      projectData.imageURL || '',
      projectData.description || '',
    ],
  });
};

// ✅ Update Simulation: Simulate updating project metadata
export const useEditProjectMetadataSimulate = (
  id: number,
  newProjectData: {
    title: string;
    location: string;
    pricePerShare: number;
    imageURL: string;
    description: string;
  }
) => {
  return useSimulateContract({
    abi: LandFormABI,
    address: CONTRACT_ADDRESS,
    functionName: 'updateProjectMetadata',
    args: [
      BigInt(id),
      newProjectData.title,
      newProjectData.location,
      BigInt(Math.floor(newProjectData.pricePerShare * 10**18)), // Convert to Wei
      newProjectData.imageURL || '',
      newProjectData.description || '',
    ],
  });
};

// ✅ Update Simulation: Simulate updating project shares
export const useUpdateProjectSharesSimulate = (id: number, newTotalShares: number, p0: { enabled: boolean; }) => {
  return useSimulateContract({
    abi: LandFormABI,
    address: CONTRACT_ADDRESS,
    functionName: 'updateProjectShares',
    args: [BigInt(id), BigInt(newTotalShares)],
  });
};

// ✅ Update Simulation: Simulate toggling project status
export const useToggleProjectStatusSimulate = (id: number, newStatus: boolean, p0: { enabled: boolean; }) => {
  return useSimulateContract({
    abi: LandFormABI,
    address: CONTRACT_ADDRESS,
    functionName: 'setProjectStatus',
    args: [BigInt(id), newStatus],
  });
};

// ✅ Delete Simulation: Simulate project deletion
export const useDeleteProjectSimulate = (id: number, p0: { enabled: boolean; }) => {
  return useSimulateContract({
    abi: LandFormABI,
    address: CONTRACT_ADDRESS,
    functionName: 'deleteProject',
    args: [BigInt(id)],
  });
};

// ✅ Create: Hook for adding a new project
export const useCreateProject = () => {
  const { writeContract } = useWriteContract();
  
  const createProject = React.useCallback(async (projectData: Omit<ProjectData, 'id' | 'availableShares' | 'isActive'>) => {
    try {
      if (!writeContract) {
        throw new Error("Write contract not available");
      }
      
      const hash = await writeContract({
        abi: LandFormABI,
        address: CONTRACT_ADDRESS,
        functionName: 'createProject',
        args: [
          projectData.title,
          projectData.location,
          BigInt(Math.floor(projectData.pricePerShare * 10**18)), // Convert to Wei
          BigInt(projectData.totalShares),
          projectData.imageURL || '',
          projectData.description || '',
        ],
      });
      
      return { hash, success: true };
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }, [writeContract]);
  
  return { createProject };
};

// ✅ Update: Hook for updating project metadata
export const useEditProjectMetadata = () => {
  const { writeContract } = useWriteContract();
  
  const updateMetadata = React.useCallback(async (
    id: number,
    newProjectData: Omit<ProjectData, 'id' | 'availableShares' | 'isActive' | 'totalShares'>
  ) => {
    try {
      if (!writeContract) {
        throw new Error("Write contract not available");
      }
      
      const hash = await writeContract({
        abi: LandFormABI,
        address: CONTRACT_ADDRESS,
        functionName: 'updateProjectMetadata',
        args: [
          BigInt(id),
          newProjectData.title,
          newProjectData.location,
          BigInt(Math.floor(newProjectData.pricePerShare * 10**18)), // Convert to Wei
          newProjectData.imageURL || '',
          newProjectData.description || '',
        ],
      });
      
      return { hash, success: true };
    } catch (error) {
      console.error("Error updating project metadata:", error);
      throw error;
    }
  }, [writeContract]);
  
  return { updateMetadata };
};

// ✅ Update: Hook for updating project shares
export const useUpdateProjectShares = () => {
  const { writeContract } = useWriteContract();
  
  const updateShares = React.useCallback(async (id: number, newTotalShares: number) => {
    try {
      if (!writeContract) {
        throw new Error("Write contract not available");
      }
      
      const hash = await writeContract({
        abi: LandFormABI,
        address: CONTRACT_ADDRESS,
        functionName: 'updateProjectShares',
        args: [BigInt(id), BigInt(newTotalShares)],
      });
      
      return { hash, success: true };
    } catch (error) {
      console.error("Error updating project shares:", error);
      throw error;
    }
  }, [writeContract]);
  
  return { updateShares };
};

// ✅ Update: Hook for toggling project status
export const useToggleProjectStatus = () => {
  const { writeContract } = useWriteContract();
  
  const toggleStatus = React.useCallback(async (id: number, newStatus: boolean) => {
    try {
      if (!writeContract) {
        throw new Error("Write contract not available");
      }
      
      const hash = await writeContract({
        abi: LandFormABI,
        address: CONTRACT_ADDRESS,
        functionName: 'setProjectStatus',
        args: [BigInt(id), newStatus],
      });
      
      return { hash, success: true };
    } catch (error) {
      console.error("Error toggling project status:", error);
      throw error;
    }
  }, [writeContract]);
  
  return { toggleStatus };
};

// ✅ Delete: Hook for project deletion
export const useDeleteProject = () => {
  const { writeContract } = useWriteContract();
  
  const deleteProject = React.useCallback(async (id: number) => {
    try {
      if (!writeContract) {
        throw new Error("Write contract not available");
      }
      
      const hash = await writeContract({
        abi: LandFormABI,
        address: CONTRACT_ADDRESS,
        functionName: 'deleteProject',
        args: [BigInt(id)],
      });
      
      return { hash, success: true };
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }, [writeContract]);
  
  return { deleteProject };
};

// Combined hook for project updates
export const useUpdateProject = () => {
  const { updateMetadata } = useEditProjectMetadata();
  const { updateShares } = useUpdateProjectShares();
  
  const updateProject = React.useCallback(async (projectData: ProjectData) => {
    try {
      // Update metadata
      const metadataResult = await updateMetadata(
        projectData.id,
        {
          title: projectData.title,
          location: projectData.location,
          pricePerShare: projectData.pricePerShare,
          imageURL: projectData.imageURL,
          description: projectData.description,
        }
      );
      
      // Update shares if needed
      const sharesResult = await updateShares(
        projectData.id,
        projectData.totalShares
      );
      
      return { 
        metadataHash: metadataResult.hash, 
        sharesHash: sharesResult.hash, 
        success: true 
      };
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }, [updateMetadata, updateShares]);
  
  return { updateProject };
};
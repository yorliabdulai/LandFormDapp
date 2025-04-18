import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Trash2, ImagePlus, MapPin, DollarSign, Hash, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { LandFormABI, CONTRACT_ADDRESS } from "@/constants/contracts";
import { 
  useProject, 
  useCreateProjectSimulate, 
  useEditProjectMetadataSimulate,
  useUpdateProjectSharesSimulate,
  useToggleProjectStatusSimulate,
  useProjectWrite,
  useDeleteProjectSimulate,
  ProjectData
} from "@/hooks/useProjects";

// Configure IPFS client
// const uploadToFilebase = async (file: File) => {
//   const formData = new FormData();
//   formData.append("file", file);

//   try {
//     const response = await fetch("https://api.filebase.io/v1/ipfs/add", {
//       method: "POST",
//       headers: {
//         Authorization: "Basic " + btoa(`${import.meta.env.VITE_FILEBASE_API_KEY}:${import.meta.env.VITE_FILEBASE_API_SECRET}`)
//       },
//       body: formData
//     });

//     if (!response.ok) {
//       throw new Error(`Upload failed: ${response.statusText}`);
//     }

//     const data = await response.json();
//     console.log("Upload success", data);
//     return data.cid; // This is your IPFS hash
//   } catch (err) {
//     console.error("Filebase IPFS upload error:", err);
//     throw err;
//   }
// };


interface ProjectFormData {
  title: string;
  description: string;
  location: string;
  pricePerShare: string;
  totalShares: number;
  imageHash: string; // Changed from imageId to match component
  projectType?: string;
  startDate?: string;
  endDate?: string;
  minimumInvestment?: string;
  expectedReturn?: string;
  isActive: boolean;
}

const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const numericId = isEditMode ? parseInt(id!) : undefined;
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // IPFS upload state
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Fetch project data if editing
  const { data: projectData, isLoading: isLoadingProject } = useProject(numericId);
  
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<ProjectFormData>({
    defaultValues: {
      isActive: true // Default to active for new projects
    }
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Wagmi contract write
  const { writeContractAsync, isPending, isSuccess, isError, error } = useProjectWrite();
  
  // Get values from form
  const imageHash = watch('imageHash');
  const title = watch('title') || '';
  const location = watch('location') || '';
  const pricePerShare = watch('pricePerShare') || '0';
  const totalShares = watch('totalShares') || 0;
  const description = watch('description') || '';
  const isActive = watch('isActive');
  
  // Simulate contract interactions
  const createProjectSimulation = useCreateProjectSimulate({
    title,
    location,
    pricePerShare: parseFloat(pricePerShare),
    totalShares,
    imageURL: imageHash,
    description
  });
  
  const updateMetadataSimulation = useEditProjectMetadataSimulate(
    numericId || 0,
    {
      title,
      location,
      pricePerShare: parseFloat(pricePerShare),
      imageURL: imageHash,
      description
    }
  );
  
  const updateSharesSimulation = useUpdateProjectSharesSimulate(
    numericId || 0,
    totalShares,
    { enabled: isEditMode }
  );
  
  const toggleStatusSimulation = useToggleProjectStatusSimulate(
    numericId || 0,
    isActive,
    { enabled: isEditMode }
  );
  
  const deleteProjectSimulation = useDeleteProjectSimulate(
    numericId || 0,
    { enabled: isEditMode }
  );
  
  // Set form values when editing
  useEffect(() => {
    if (isEditMode && projectData) {
      const project = projectData as unknown as ProjectData;
      
      setValue('title', project.title);
      setValue('description', project.description);
      setValue('location', project.location);
      setValue('pricePerShare', project.pricePerShare.toString());
      setValue('totalShares', project.totalShares);
      setValue('imageHash', project.imageURL || ''); // Using imageId from contract
      setValue('isActive', project.isActive);
      
      // Set optional fields if available in the UI
      if ('projectType' in project) setValue('projectType', project.projectType);
      if ('startDate' in project) setValue('startDate', project.startDate);
      if ('endDate' in project) setValue('endDate', project.endDate);
      if ('minimumInvestment' in project) setValue('minimumInvestment', project.minimumInvestment?.toString());
      if ('expectedReturn' in project) setValue('expectedReturn', project.expectedReturn?.toString());
      
      // Set preview image if there's an IPFS hash
      if (project.imageURL) {
        setPreviewImage(`https://api.filebase.io/v1/ipfs/${project.imageURL}`);
      }
    }
  }, [isEditMode, projectData, setValue]);
  
  // Watch for imageHash changes to update preview
  useEffect(() => {
    if (imageHash && imageHash.trim() !== '') {
      setPreviewImage(`https://api.filebase.io/v1/ipfs/${imageHash}`);
    }
  }, [imageHash]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      
      // Create a preview URL
      const filePreviewUrl = URL.createObjectURL(e.target.files[0]);
      setPreviewImage(filePreviewUrl);
    }
  };
  
// Upload file to Filebase IPFS
const uploadToIPFS = useCallback(async () => {
  if (!file) {
    toast.error("Please select a file to upload");
    return null;
  }

  try {
    setIsUploading(true);
    setUploadProgress(0);
    toast.loading("Uploading to Filebase IPFS...", { id: "ipfs-upload" });

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("https://api.filebase.io/v1/ipfs/add", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          btoa(
            `${import.meta.env.VITE_FILEBASE_API_KEY}:${import.meta.env.VITE_FILEBASE_API_SECRET}`
          ),
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errText}`);
    }

    const result = await response.json();

    toast.success("Successfully uploaded to Filebase IPFS", {
      id: "ipfs-upload",
    });
    setIsUploading(false);

    return result.cid; // <-- This is the IPFS hash
  } catch (error) {
    console.error("Filebase IPFS upload error:", error);
    toast.error("Failed to upload to Filebase IPFS", { id: "ipfs-upload" });
    setIsUploading(false);
    return null;
  }
}, [file]);

  
  // Watch transaction status
  useEffect(() => {
    if (!isPending && isSubmitting) {
      toast.dismiss("project-operation");
      
      if (isSuccess) {
        toast.success(isEditMode ? "Project updated successfully!" : "Project created successfully!");
        setTimeout(() => {
          navigate(isEditMode ? `/admin/projects/details/${id}` : `/admin/projects`);
        }, 500);
      }
      
      if (isError && error) {
        // Format error message
        let errorMessage = "Transaction failed";
        if (error.message) {
          if (error.message.includes("user rejected")) {
            errorMessage = "Transaction was rejected by user";
          } else if (error.message.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
          } else if (error.message.includes("execution reverted")) {
            const reasonMatch = error.message.match(/reason="([^"]+)"/);
            if (reasonMatch && reasonMatch[1]) {
              errorMessage = `Transaction reverted: ${reasonMatch[1]}`;
            }
          } else {
            errorMessage = error.message.length > 100 
              ? `${error.message.slice(0, 100)}...` 
              : error.message;
          }
        }
        toast.error(errorMessage);
        setErrorDetails(JSON.stringify(error, null, 2));
      }
      
      setIsSubmitting(false);
    }
    
    // Handle deletion state
    if (!isPending && isDeleting) {
      toast.dismiss("delete-operation");
      
      if (isSuccess) {
        toast.success("Project deleted successfully!");
        setTimeout(() => navigate("/admin/projects"), 500);
      }
      if (isError) {
        toast.error("Failed to delete project");
      }
      setIsDeleting(false);
    }
  }, [isPending, isSuccess, isError, error, isSubmitting, isDeleting, isEditMode, id, navigate]);
  
  // Error timeout handler
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (isSubmitting) {
      timeoutId = setTimeout(() => {
        toast.dismiss("project-operation");
        toast.error("Operation timeout. Please check your wallet for pending transactions.", { id: "project-operation" });
        setIsSubmitting(false);
      }, 30000); // 30 second timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSubmitting]);
  
  // Form submission handler
  const onSubmit = async (data: ProjectFormData) => {
    try {
      setIsSubmitting(true);
      setErrorDetails(null);
  
      // Show loading toast
      toast.loading(
        isEditMode ? "Updating project..." : "Creating new project...",
        { id: "project-operation" }
      );
      
      // Upload file to IPFS if selected
      let ipfsHash = data.imageHash;
      if (file) {
        const uploadedHash = await uploadToIPFS();
        if (uploadedHash) {
          ipfsHash = uploadedHash;
          setValue('imageHash', ipfsHash);
        } else {
          toast.error("Failed to upload image to IPFS", { id: "project-operation" });
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log("Form data:", { ...data, imageHash: ipfsHash });
      
      if (isEditMode) {
        // Update project metadata
        if (updateMetadataSimulation?.data?.request) {
          const originalArgs = updateMetadataSimulation.data.request.args;
          if (!originalArgs) {
            throw new Error("Transaction arguments are undefined");
          }
          
          // Match contract function parameters order:
          // updateProjectMetadata(uint256 projectId, string title, string location, uint256 pricePerShare, string imageId, string description)
          const modifiedRequest = {
            ...updateMetadataSimulation.data.request,
            args: [
              originalArgs[0], // projectId
              data.title,
              data.location,
              BigInt(Math.floor(parseFloat(data.pricePerShare) * 10**18)), // Convert to wei
              ipfsHash, // IPFS hash
              data.description
            ]
          };
          
          await writeContractAsync(modifiedRequest);
        } else {
          throw new Error("Failed to prepare metadata update transaction");
        }
        
        // Update shares if needed
        if (updateSharesSimulation?.data?.request) {
          await writeContractAsync(updateSharesSimulation.data.request);
        }
          
        // Update status if changed
        if (toggleStatusSimulation?.data?.request) {
          await writeContractAsync(toggleStatusSimulation.data.request);
        }
      } else {
        // Create new project
        // Validate inputs
        if (!data.title || !data.location || !data.pricePerShare || !data.totalShares) {
          toast.error("Please fill all required fields", { id: "project-operation" });
          setIsSubmitting(false);
          return;
        }
        
        // Parse price and convert to wei
        const pricePerShare = parseFloat(data.pricePerShare);
        const priceInWei = BigInt(Math.floor(pricePerShare));
        
        // Match contract function parameters:
        // addProject(string title, string location, uint256 pricePerShare, uint256 totalShares, string imageId, string description)
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: LandFormABI,
          functionName: 'addProject', 
          args: [
            data.title,
            data.location,
            priceInWei,
            BigInt(parseInt(data.totalShares.toString())),
            ipfsHash,
            data.description
          ],
          gas: 1000000n // Increased gas limit for safety
        });
      }
    } catch (error) {
      console.error("Error saving project:", error);
      
      let errorMessage = "Transaction failed";
      
      if (error instanceof Error) {
        console.log("Error details:", error.message);
        setErrorDetails(error.message);
        
        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else if (error.message.includes("execution reverted")) {
          const reasonMatch = error.message.match(/reason="([^"]+)"/);
          if (reasonMatch && reasonMatch[1]) {
            errorMessage = `Transaction reverted: ${reasonMatch[1]}`;
          } else {
            errorMessage = "Contract requirements not met, check your inputs";
          }
        } else if (error.message.includes("Not authorized")) {
          errorMessage = "Not authorized: Your wallet is not the contract owner";
        }
      }
      
      toast.error(errorMessage, { id: "project-operation" });
      setIsSubmitting(false);
    }
  };

  // Delete project handler
  const handleDeleteProject = async () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        setIsDeleting(true);
        toast.loading("Deleting project...", { id: "delete-operation" });
        
        if (deleteProjectSimulation?.data?.request) {
          await writeContractAsync(deleteProjectSimulation.data.request);
        } else {
          // Direct deletion if simulation fails
          await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: LandFormABI,
            functionName: 'deleteProject',
            args: [BigInt(numericId || 0)]
          });
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("Failed to delete project.", { id: "delete-operation" });
        setIsDeleting(false);
      }
    }
  };
  
  if (isEditMode && isLoadingProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Button text helpers
  const getSubmitButtonText = () => {
    if (isPending || isSubmitting) {
      return isEditMode ? "Updating..." : "Creating...";
    }
    return isEditMode ? "Update Project" : "Create Project";
  };
  
  const getDeleteButtonText = () => {
    if (isPending || isDeleting) {
      return "Deleting...";
    }
    return "Delete";
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Go back"
            disabled={isSubmitting || isDeleting}
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Edit Project" : "Create New Project"}
          </h1>
        </div>
        
        {isEditMode && (
          <button 
            className={`px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 ${
              (isDeleting || isPending) ? "opacity-70 cursor-not-allowed" : ""
            }`}
            onClick={handleDeleteProject}
            disabled={isDeleting || isPending || isSubmitting}
          >
            {isDeleting || (isDeleting && isPending) ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
            ) : (
              <Trash2 size={16} />
            )}
            <span>{getDeleteButtonText()}</span>
          </button>
        )}
      </div>
      
      {/* Error details for debugging */}
      {errorDetails && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium mb-2">Error Details:</h3>
          <pre className="text-xs overflow-auto max-h-40 p-2 bg-red-100 rounded text-red-900">
            {errorDetails}
          </pre>
          <button 
            className="mt-2 text-xs text-red-700 underline"
            onClick={() => setErrorDetails(null)}
          >
            Hide Details
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title *
                </label>
                <input
                  id="title"
                  type="text"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter project title"
                  {...register('title', { required: 'Project title is required' })}
                  disabled={isSubmitting || isDeleting}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Provide a detailed description of the project"
                  {...register('description', { required: 'Project description is required' })}
                  disabled={isSubmitting || isDeleting}
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <MapPin size={16} />
                  </div>
                  <input
                    id="location"
                    type="text"
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Project location"
                    {...register('location', { required: 'Location is required' })}
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
                {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}
              </div>
              
              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select
                  id="projectType"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  {...register('projectType')}
                  disabled={isSubmitting || isDeleting}
                >
                  <option value="">Select a project type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="mixed">Mixed Use</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    {...register('startDate')}
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    {...register('endDate')}
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
              </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Image
                </label>
                
                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center bg-gray-50">
                  {previewImage ? (
                    <div className="w-full">
                      <img 
                        src={previewImage} 
                        alt="Project preview" 
                        className="w-full h-40 object-cover rounded-md mb-3"
                        onError={() => {
                          setPreviewImage(null);
                          toast.error("Failed to load image preview");
                        }}
                      />
                      
                      {/* Progress bar for IPFS upload */}
                      {isUploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setPreviewImage(null);
                            setValue('imageHash', '');
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                          disabled={isUploading || isSubmitting || isDeleting}
                        >
                          Remove Image
                        </button>
                        
                        {/* Show IPFS hash if available */}
                        {imageHash && (
                          <span className="text-xs text-gray-500">
                            IPFS: {imageHash.slice(0, 6)}...{imageHash.slice(-4)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <ImagePlus size={40} className="mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Select an image to upload
                      </p>
                    </div>
                  )}
                  
                  {/* File input and manual IPFS hash input */}
                  <div className="w-full mt-3 space-y-3">
                    <div className="flex items-center justify-center">
                      <label className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer">
                        <Upload size={16} className="mr-2" />
                        Choose Image
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.gif,.webp"
                          className="sr-only"
                          onChange={handleFileChange}
                          disabled={isUploading || isSubmitting || isDeleting}
                        />
                      </label>
                    </div>
                    
                    <div>
                      <label htmlFor="imageHash" className="block text-sm font-medium text-gray-700 mb-1">
                        IPFS Hash (CID)
                      </label>
                      <input
                        id="imageHash"
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="QmExample..."
                        {...register('imageHash')}
                        disabled={isSubmitting || isDeleting}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter IPFS hash directly or upload an image above
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pricePerShare" className="block text-sm font-medium text-gray-700 mb-1">
                    Price Per Share (APE) *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <DollarSign size={16} />
                    </div>
                    <input
                      id="pricePerShare"
                      type="text"
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${errors.pricePerShare ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="0.00"
                      {...register('pricePerShare', { required: 'Price per share is required' })}
                      disabled={isSubmitting || isDeleting}
                    />
                  </div>
                  {errors.pricePerShare && <p className="mt-1 text-xs text-red-500">{errors.pricePerShare.message}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Set in APE tokens, will be converted to Wei
                  </p>
                </div>
                
                <div>
                  <label htmlFor="totalShares" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Shares *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Hash size={16} />
                    </div>
                    <input
                      id="totalShares"
                      type="number"
                      min="1"
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${errors.totalShares ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="100"
                      {...register('totalShares', { 
                        required: 'Total shares is required',
                        min: { value: 1, message: 'Must be at least 1 share' },
                        valueAsNumber: true
                      })}
                      disabled={isSubmitting || isDeleting}
                    />
                  </div>
                  {errors.totalShares && <p className="mt-1 text-xs text-red-500">{errors.totalShares.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minimumInvestment" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Investment (APE)
                  </label>
                  <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <DollarSign size={16} />
                    </div>
                    <input
                      id="minimumInvestment"
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                      {...register('minimumInvestment')}
                      disabled={isSubmitting || isDeleting}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="expectedReturn" className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Return (%)
                  </label>
                  <input
                    id="expectedReturn"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="e.g. 8.5"
                    {...register('expectedReturn')}
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    {...register('isActive')}
                    disabled={isSubmitting || isDeleting}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Project is active and open for investment
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Submit button */}
          <div className="pt-5 border-t border-gray-200">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center gap-2 ${
                  (isSubmitting || isPending) ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting || isPending || isDeleting}
              >
                {(isSubmitting || isPending) && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <Save size={16} />
                <span>{getSubmitButtonText()}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-6 text-xs text-gray-500">
        <p>* Required fields</p>
        <p className="mt-1">Note: Transaction fees will apply when creating or editing projects on the blockchain.</p>
      </div>
    </div>
  );
};

export default ProjectForm;
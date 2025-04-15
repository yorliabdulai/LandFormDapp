import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {useEstimateGas} from "wagmi";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Trash2, ImagePlus, MapPin, DollarSign, Hash, Power } from "lucide-react";
import toast from "react-hot-toast";
import { LandFormABI,CONTRACT_ADDRESS } from "@/constants/contracts";
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
import { encodeFunctionData, parseGwei } from "viem";


interface ProjectFormData {
  title: string;
  description: string;
  location: string;
  pricePerShare: string;
  totalShares: number;
  imageURL: string;
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const numericId = isEditMode ? parseInt(id!) : undefined;
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch project data if editing
  const { data: projectData, isLoading: isLoadingProject } = useProject(
    numericId
  );
  
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<ProjectFormData>();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Wagmi write contract
  const { writeContractAsync, isPending, isSuccess, isError, error } = useProjectWrite();
  
  // Simulate contract interactions for different operations
  const createProjectSimulation = useCreateProjectSimulate({
    title: watch('title') || '',
    location: watch('location') || '',
    pricePerShare: parseFloat(watch('pricePerShare') || '0'),
    totalShares: watch('totalShares') || 0,
    imageURL: watch('imageURL') || '',
    description: watch('description') || ''
  });
  
  const updateMetadataSimulation = useEditProjectMetadataSimulate(
    numericId || 0,
    {
      title: watch('title') || '',
      location: watch('location') || '',
      pricePerShare: parseFloat(watch('pricePerShare') || '0'),
      imageURL: watch('imageURL') || '',
      description: watch('description') || ''
    }
  );
  
  const updateSharesSimulation = useUpdateProjectSharesSimulate(
    numericId || 0,
    watch('totalShares') || 0,
    { enabled: isEditMode }
  );
  
  const toggleStatusSimulation = useToggleProjectStatusSimulate(
    numericId || 0,
    watch('isActive'),
    { enabled: isEditMode }
  );
  
  const deleteProjectSimulation = useDeleteProjectSimulate(
    numericId || 0,
    { enabled: isEditMode }
  );
  
  // Set form values when editing an existing project
  useEffect(() => {
    if (isEditMode && projectData) {
      const project = projectData as unknown as ProjectData;
      
      setValue('title', project.title);
      setValue('description', project.description);
      setValue('location', project.location);
      setValue('pricePerShare', project.pricePerShare.toString());
      setValue('totalShares', project.totalShares);
      setValue('imageURL', project.imageURL || '');
      setValue('isActive', project.isActive);
      
      // Set optional fields if available in the UI but not in contract
      if ('projectType' in project) setValue('projectType', project.projectType);
      if ('startDate' in project) setValue('startDate', project.startDate);
      if ('endDate' in project) setValue('endDate', project.endDate);
      if ('minimumInvestment' in project) setValue('minimumInvestment', project.minimumInvestment?.toString());
      if ('expectedReturn' in project) setValue('expectedReturn', project.expectedReturn?.toString());
      
      // Set preview image
      if (project.imageURL) {
        setPreviewImage(project.imageURL);
      }
    }
    if (!isPending && isSubmitting) {
        // Always dismiss the loading toast
        toast.dismiss("project-operation");
        
        if (isSuccess) {
          toast.success(isEditMode ? "Project updated successfully!" : "Project created successfully!");
          // Navigate after success
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
            } else {
              // Truncate long error messages
              errorMessage = error.message.length > 100 
                ? `${error.message.slice(0, 100)}...` 
                : error.message;
            }
          }
          toast.error(errorMessage);
        }
        
        // Reset submission state
        setIsSubmitting(false);
      }
      
      // Same for deletion state
      if (!isPending && isDeleting) {
        // Always dismiss the loading toast
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
  }, [isEditMode, projectData,isPending, isSuccess, isError, error, isSubmitting, isDeleting, id, navigate, setValue]);
  // In the onSubmit function, add a timeout as a fallback
setTimeout(() => {
    if (isSubmitting) {
      console.warn("Operation taking too long, showing feedback to user");
      toast.dismiss("project-operation");
      toast.error("Operation timeout. Please check your wallet for pending transactions.", { id: "project-operation" });
      setIsSubmitting(false);
    }
  }, 30000); // 30 second timeout
  // Watch the imageURL for changes to update preview
  const imageURL = watch('imageURL');
  useEffect(() => {
    if (imageURL) {
      setPreviewImage(imageURL);
    }
  }, [imageURL]);
  const { data: gasEstimate } = useEstimateGas({
    to: import.meta.env.VITE_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: LandFormABI,
      functionName: 'addProject',
      args: [
        watch('title') || '',
        watch('location') || '',
        parseFloat(watch('pricePerShare') || '0'),
        watch('totalShares') || 0,
        watch('imageURL') || '',
        watch('description') || ''
      ],
    }),
  });
  
  // Log the estimate
  console.log('Estimated gas:', gasEstimate); 
  // Watch transaction status and update UI accordingly
  useEffect(() => {
    if (!isPending && isSubmitting) {
      if (isSuccess) {
        toast.success(isEditMode ? "Project updated successfully!" : "Project created successfully!");
        // Navigate after success
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
          } else {
            // Truncate long error messages
            errorMessage = error.message.length > 100 
              ? `${error.message.slice(0, 100)}...` 
              : error.message;
          }
        }
        toast.error(errorMessage);
      }
      
      // Reset submission state
      setIsSubmitting(false);
    }
    
    // Same for deletion state
    if (!isPending && isDeleting) {
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
  
  const onSubmit = async (data: ProjectFormData) => {
    try {
        setIsSubmitting(true);
    
        // Show loading toast
        toast.loading(
          isEditMode ? "Updating project..." : "Creating new project...",
          { id: "project-operation" }
        );
          // Add log statements to check if the form values are correct
console.log("Form data submitted:", data);
// Add log statement to check simulation data
console.log("Create project simulation:", createProjectSimulation);
        if (isEditMode) {
          // Update project metadata
          if (updateMetadataSimulation?.data?.request) {
            await writeContractAsync(updateMetadataSimulation.data.request);
          } else {
            console.error("Failed to prepare metadata update transaction");
            toast.error("Failed to prepare transaction data", { id: "project-operation" });
            setIsSubmitting(false);
            return;
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
         console.log("Creating project with data:", data);
      
      // Parse the price to a number first
      const pricePerShare = parseFloat(data.pricePerShare);
      
      // Convert to wei (multiply by 10^18)
      const priceInWei = BigInt(Math.floor(pricePerShare * 10**18));
      
      // Log the actual values being sent to the contract
      console.log("Sending to contract:", {
        title: data.title,
        location: data.location,
        priceInWei: priceInWei.toString(),
        totalShares: parseInt(data.totalShares.toString()),
        imageURL: data.imageURL,
        description: data.description
      });
      
      // Send the transaction directly without relying on simulation
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: LandFormABI,
        functionName: 'createProject',
        args: [
          data.title,
          data.location,
          priceInWei,
          BigInt(parseInt(data.totalShares.toString())),
          data.imageURL || '',
          data.description
        ],
        gas: 300000n, // Set a reasonable gas limit
        gasPrice: parseGwei('5') // Set a reasonable gas price in gwei
      });
      
      // Success! Navigate to projects page
      navigate('/admin/projects');
      }
  } catch (error) {
    console.error("Error saving project:", error);
    
    // Show error toast and reset state
    toast.error(`Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`, { id: "project-operation" });
    setIsSubmitting(false);
  }
};

  const handleDeleteProject = async () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        // Immediately set deleting state
        setIsDeleting(true);
        
        // Show loading toast
        toast.loading("Deleting project...", { id: "delete-operation" });
        
        if (deleteProjectSimulation?.data?.request) {
          await writeContractAsync(deleteProjectSimulation.data.request);
        } else {
          toast.error("Failed to prepare delete transaction.", { id: "delete-operation" });
          setIsDeleting(false);
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
  
  // Determine button text based on various states
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
          <h1 className="text-2xl font-heading font-bold text-gray-800">
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
                <label htmlFor="imageURL" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Image URL
                </label>
                <input
                  id="imageURL"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="https://example.com/image.jpg"
                  {...register('imageURL')}
                  disabled={isSubmitting || isDeleting}
                />
                
                <div className="mt-3 border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center bg-gray-50">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Project preview" 
                      className="w-full h-32 object-cover rounded-md"
                      onError={() => {
                        setPreviewImage(null);
                        toast.error("Failed to load image preview. Please check the URL.");
                      }}
                    />
                  ) : (
                    <div className="text-center py-6">
                      <ImagePlus size={40} className="mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No image provided</p>
                    </div>
                  )}
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
                      {...register('pricePerShare', { 
                        required: 'Price is required',
                        pattern: { 
                          value: /^\d+(\.\d{1,18})?$/, 
                          message: 'Enter a valid price'
                        }
                      })}
                      disabled={isSubmitting || isDeleting}
                    />
                  </div>
                  {errors.pricePerShare && <p className="mt-1 text-xs text-red-500">{errors.pricePerShare.message}</p>}
                </div>
                
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
                      {...register('minimumInvestment', { 
                        pattern: { 
                          value: /^\d+(\.\d{1,18})?$/, 
                          message: 'Enter a valid amount'
                        }
                      })}
                      disabled={isSubmitting || isDeleting}
                    />
                  </div>
                  {errors.minimumInvestment && <p className="mt-1 text-xs text-red-500">{errors.minimumInvestment.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${errors.totalShares ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="100"
                      {...register('totalShares', { 
                        required: 'Total shares is required',
                        min: { value: 1, message: 'Must be at least 1' },
                        valueAsNumber: true
                      })}
                      disabled={isSubmitting || isDeleting}
                    />
                  </div>
                  {errors.totalShares && <p className="mt-1 text-xs text-red-500">{errors.totalShares.message}</p>}
                </div>
                
                <div>
                  <label htmlFor="expectedReturn" className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Return (% annually)
                  </label>
                  <input
                    id="expectedReturn"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="12.5"
                    {...register('expectedReturn', { 
                      pattern: { 
                        value: /^\d+(\.\d{1,2})?$/, 
                        message: 'Enter a valid percentage'
                      }
                    })}
                    disabled={isSubmitting || isDeleting}
                  />
                  {errors.expectedReturn && <p className="mt-1 text-xs text-red-500">{errors.expectedReturn.message}</p>}
                </div>
              </div>
              
              {isEditMode && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      {...register('isActive')}
                      disabled={isSubmitting || isDeleting}
                    />
                    <div className="flex items-center">
                      <Power size={16} className="mr-2 text-primary-600" />
                      <span className="text-sm font-medium">Project Active</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">
                    Active projects are visible to investors and available for investment.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting || isDeleting || isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2 ${
                  (isSubmitting || isPending) ? "opacity-90 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting || isDeleting || isPending}
              >
                {(isSubmitting || isPending) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save size={16} />
                )}
                <span>{getSubmitButtonText()}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Visual feedback during form submission */}
      {(isSubmitting || isDeleting) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900">
              {isSubmitting 
                ? (isEditMode ? "Updating project..." : "Creating project...") 
                : "Deleting project..."}
            </h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Please wait while we process your transaction. This may take a moment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectForm;
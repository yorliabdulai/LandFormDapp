import React from "react";
import { useAllProjects } from "@/hooks/useProjects";
import { Link } from "react-router-dom";
import { ChevronRight, PenSquare, Plus } from "lucide-react";

const ManageProjects: React.FC = () => {
  const { data: projectsData, isLoading, error } = useAllProjects();

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-destructive/10 border border-destructive rounded-md">
      <p className="text-destructive font-medium">Error loading projects: {error.message}</p>
    </div>
  );

  interface Project {
    id: string;
    title: string;
    location: string;
    pricePerShare: number | bigint;
    availableShares: number | bigint;
    totalShares: number | bigint;
  }
  
  // Ensure projectsData is not undefined before casting
  const projects: Project[] = projectsData ? (projectsData as Project[]) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-800">
          Manage Projects
        </h1>
        <Link
          to="/admin/projects/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          <span>Add New Project</span>
        </Link>
      </div>
      
      <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-foreground">ID</th>
                <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-foreground">Title</th>
                <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-foreground">Location</th>
                <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-foreground">Price/Share</th>
                <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-foreground">Available/Total</th>
                <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No projects found. Create your first project to get started.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground">{project.id}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{project.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{project.location}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {typeof project.pricePerShare === 'bigint' 
                        ? Number(project.pricePerShare) 
                        : project.pricePerShare}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary-500 h-2.5 rounded-full" 
                            style={{ 
                              width: `${(Number(project.availableShares) / Number(project.totalShares)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {project.availableShares.toString()} / {project.totalShares.toString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/projects/edit/${project.id}`}
                          className="p-2 bg-secondary-100 text-secondary-700 rounded-md hover:bg-secondary-200 transition-colors flex items-center gap-1"
                        >
                          <PenSquare size={16} />
                          <span className="text-xs font-medium">Edit</span>
                        </Link>
                        <Link
                          to={`/admin/projects/details/${project.id}`}
                          className="p-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors flex items-center gap-1"
                        >
                          <ChevronRight size={16} />
                          <span className="text-xs font-medium">View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageProjects;
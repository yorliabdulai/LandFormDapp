import React, { useState, useEffect } from "react";
import { useAllProjects } from "@/hooks/useProjects";
import { useOwner } from "@/hooks/useOwnership";
import { useWatchContractEvent, usePublicClient, useAccount } from "wagmi";
import { LandFormABI, CONTRACT_ADDRESS } from "@/constants/contracts";
import { Toaster, toast } from "react-hot-toast";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { checkRpcHealth } from '../../../../utils/connectionMonitor';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Briefcase,
  Users,
  LineChart as LineChartIcon,
  AlertCircle,
  CheckCircle,
  WifiOff,
} from "lucide-react";

export interface ProjectData {
  id: number;
  title: string;
  location: string;
  pricePerShare: number;
  totalShares: number;
  availableShares: number;
  imageURL: string;
  description: string;
}

type EventItem =
  | {
      type: "ProjectAdded";
      projectId: string;
      title: string;
      timestamp: string;
    }
  | {
      type: "OwnershipTransferred";
      from: string;
      to: string;
      timestamp: string;
    };

const AdminDashboard: React.FC = () => {
  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
  } = useAllProjects();
  const {
    data: owner,
    isLoading: ownerLoading,
    isError: ownerError,
  } = useOwner();
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [events, setEvents] = useState<EventItem[]>([]);

  // Watch live ProjectAdded events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: LandFormABI,
    eventName: "ProjectAdded",
    onLogs: (logs) => {
      const newEvents = logs.map((log: any) => ({
        type: "ProjectAdded" as const,
        projectId: log.args?.id?.toString(), // adjust if necessary
        title: log.args?.title,
        timestamp: new Date().toLocaleString(),
      }));
      if (newEvents.length > 0) {
        toast.success(`New project created: ${newEvents[0].title}`);
      }
      setEvents((prev) => [...newEvents, ...prev]);
    },
  });

  // Watch live OwnershipTransferred events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: LandFormABI,
    eventName: "OwnershipTransferred",
    onLogs: (logs) => {
      const newEvents = logs.map((log: any) => ({
        type: "OwnershipTransferred" as const,
        from: log.args?.previousOwner,
        to: log.args?.newOwner,
        timestamp: new Date().toLocaleString(),
      }));
      if (newEvents.length > 0) {
        toast(`Ownership transferred to ${newEvents[0].to.substring(0, 6)}...${newEvents[0].to.slice(-4)}`, { icon: 'ℹ️' });
      }
      setEvents((prev) => [...newEvents, ...prev]);
    },
  });
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (projectsError || ownerError) {
        setShowError(true);
      }
    }, 2000); // Wait 2 seconds before showing error
  
    return () => clearTimeout(timeout);
  }, [projectsError, ownerError]);
  const [connectionStatus, setConnectionStatus] = useState<{
    isHealthy: boolean;
    checking: boolean;
    workingRpc?: string;
  }>({
    isHealthy: true,
    checking: false,
  });
  
  // Check connection health when errors occur
  useEffect(() => {
    if (projectsError || ownerError) {
      setConnectionStatus(prev => ({ ...prev, checking: true }));
      checkRpcHealth().then(result => {
        setConnectionStatus({
          isHealthy: result.isHealthy,
          checking: false,
          workingRpc: result.workingRpc,
        });
      });
    }
  }, [projectsError, ownerError]);
  // Add this to your Page.tsx
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Add this to your error UI
if (!isOnline) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border border-red-100">
        <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold text-gray-800 text-center mb-2">
          You're Offline
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Please check your internet connection and try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
  console.log("Public client:", publicClient);
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Is connected:", isConnected);
  // Display ConnectButton if wallet is not connected
  if (!isConnected) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600 text-lg mb-4">
          🔒 Please connect your wallet to access the admin dashboard
        </p>
        <ConnectButton />
        <Toaster position="top-right" />
      </div>
    );
  }

  if (projectsError || ownerError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border border-red-100">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-gray-800 text-center mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {connectionStatus.checking 
              ? 'Checking network connection...' 
              : connectionStatus.isHealthy
                ? 'There was a problem connecting to the blockchain. Please try again.'
                : 'Unable to connect to the blockchain network. All RPC endpoints are unreachable.'}
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Retry Connection
            </button>
            {connectionStatus.workingRpc && (
              <div className="text-xs text-gray-500 text-center mt-2">
                Connected via: {connectionStatus.workingRpc}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

if (projectsError || ownerError) {
  // Show more specific error message
  const errorMessage = 'Unable to load data from the blockchain';
  const isNetworkError = errorMessage.includes('network') || 
                         errorMessage.includes('internet') || 
                         errorMessage.includes('disconnected');
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border border-red-100">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold text-gray-800 text-center mb-2">
          {isNetworkError ? 'Network Connection Error' : 'Error Loading Data'}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {isNetworkError 
            ? 'Unable to connect to the blockchain network. Please check your internet connection and try again.'
            : 'There was a problem connecting to the blockchain. Please check your connection and try again.'}
        </p>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Retry Connection
          </button>
          {isNetworkError && (
            <button 
              onClick={() => {
                // Here you could implement logic to try a different RPC provider
                toast("Attempting to use alternate network...");
                // Logic to switch providers would go here
                setTimeout(() => window.location.reload(), 1000);
              }}
              className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Alternate Network
            </button>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

  const projects = (projectsData ?? []) as ProjectData[];

  // Data for charts
  const shareDistributionData = [
    { 
      name: 'Available Shares', 
      value: projects.reduce((acc, project) => acc + project.availableShares, 0) 
    },
    { 
      name: 'Sold Shares', 
      value: projects.reduce((acc, project) => acc + (project.totalShares - project.availableShares), 0) 
    }
  ];

  const projectSharesData = projects.map(project => ({
    name: project.title.length > 15 ? project.title.substring(0, 12) + '...' : project.title,
    available: project.availableShares,
    sold: project.totalShares - project.availableShares
  }));

  // Count events by type
  const eventTypeCount = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const eventTypesData = Object.entries(eventTypeCount).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // Colors for charts
  const COLORS = ['#16a34a', '#0284c7', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-800">LandForm Admin</h1>
            <p className="text-gray-500">Blockchain Project Management Dashboard</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Connected
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Projects */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-full">
                <Briefcase className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-primary-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Total Shares */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Shares</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {projects.reduce((acc, project) => acc + project.totalShares, 0)}
                </p>
              </div>
              <div className="p-3 bg-secondary-50 rounded-full">
                <Users className="h-6 w-6 text-secondary-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-100 rounded-full">
                <div 
                  className="h-2 bg-secondary-500 rounded-full" 
                  style={{ 
                    width: `${Math.min(
                      100,
                      (projects.reduce((acc, project) => acc + project.availableShares, 0) /
                        Math.max(1, projects.reduce((acc, project) => acc + project.totalShares, 0))) * 100
                    )}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Available: {projects.reduce((acc, project) => acc + project.availableShares, 0)}</span>
                <span>Sold: {projects.reduce((acc, project) => acc + (project.totalShares - project.availableShares), 0)}</span>
              </div>
            </div>
          </div>

          {/* Events Tracked */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Events Tracked</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{events.length}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <LineChartIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 flex justify-between">
              <span>Created: {events.filter(e => e.type === 'ProjectAdded').length || 0}</span>
              <span>Transfers: {events.filter(e => e.type === 'OwnershipTransferred').length || 0}</span>
            </div>
          </div>

          {/* Contract Owner */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-500">Contract Owner</p>
              <div className="mt-1 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <p className="font-medium text-gray-900 truncate" title={owner as string}>
                  {owner ? `${(owner as string).substring(0, 10)}...${(owner as string).slice(-8)}` : "Unknown"}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(owner as string);
                    toast.success("Address copied to clipboard");
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Copy Full Address
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Share Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-lg font-heading font-semibold text-gray-800 mb-4">Share Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shareDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                    }
                  >
                    {shareDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} shares`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Shares Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-lg font-heading font-semibold text-gray-800 mb-4">Project Shares</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectSharesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="available" stackId="a" fill="#16a34a" name="Available" />
                  <Bar dataKey="sold" stackId="a" fill="#0284c7" name="Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Type Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-lg font-heading font-semibold text-gray-800 mb-4">Event Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventTypesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                    }
                  >
                    {eventTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} events`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Price Comparison Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-lg font-heading font-semibold text-gray-800 mb-4">Price per Share</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projects.map((p) => ({
                    name: p.title.length > 15 ? p.title.substring(0, 12) + "..." : p.title,
                    price: p.pricePerShare,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} ETH`, "Price"]} />
                  <Bar dataKey="price" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-heading font-semibold text-gray-800">Recent Activity</h2>
            <span className="bg-secondary-100 text-secondary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {events.length} Events
            </span>
          </div>
          {events.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No events recorded yet</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.slice(0, 10).map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.type === "ProjectAdded" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Created
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Users className="w-3 h-3 mr-1" />
                            Transfer
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {event.type === "ProjectAdded" && (
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">Project: {event.title}</span>
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">ID: {event.projectId}</span>
                          </div>
                        )}
                        {event.type === "OwnershipTransferred" && (
                          <div>
                            <div className="flex items-center text-xs">
                              <span className="font-medium text-gray-700">From:</span>
                              <span className="ml-1 font-mono bg-gray-100 px-1 py-0.5 rounded">
                                {event.from.substring(0, 6)}...{event.from.slice(-4)}
                              </span>
                            </div>
                            <div className="flex items-center text-xs mt-1">
                              <span className="font-medium text-gray-700">To:</span>
                              <span className="ml-1 font-mono bg-green-100 px-1 py-0.5 rounded">
                                {event.to.substring(0, 6)}...{event.to.slice(-4)}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length > 10 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
                  <button
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    onClick={() => toast("Full event history feature coming soon!", { icon: "ℹ️" })}
                  >
                    View all {events.length} events
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-heading font-semibold text-gray-800">Project Portfolio</h2>
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {projects.length} Projects
            </span>
          </div>
          
          {projects.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No projects found</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Share</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                            {project.imageURL ? (
                              <img 
                                src={project.imageURL} 
                                alt={project.title} 
                                className="h-10 w-10 object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/api/placeholder/40/40";
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">{project.title.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{project.title}</div>
                            <div className="text-xs text-gray-500">ID: {project.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.pricePerShare} ETH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Available: {project.availableShares}</span>
                            <span>Total: {project.totalShares}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-500 h-2 rounded-full" 
                              style={{ width: `${(project.availableShares / project.totalShares) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.availableShares > 0 ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.location.href = `/admin/projects/edit/${project.id}`}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this project?")) {
                                toast.success("Project deleted (action pending implementation)");
                              }
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

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
  ChevronRight,
  Eye,
  Pencil,
  Menu,
  X
} from "lucide-react";

export interface ProjectData {
  id: number | bigint;
  title: string;
  location: string;
  pricePerShare: number | bigint;
  totalShares: number | bigint;
  availableShares: number | bigint;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-lg shadow-lg border border-red-100">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-gray-800 text-center mb-2">
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

  const projects = (projectsData ?? []) as ProjectData[];

  // Data for charts - Convert BigInt values to Numbers
  const shareDistributionData = [
    { 
      name: 'Available Shares', 
      value: projects.reduce((acc, project) => acc + Number(project.availableShares), 0) 
    },
    { 
      name: 'Sold Shares', 
      value: projects.reduce((acc, project) => acc + (Number(project.totalShares) - Number(project.availableShares)), 0) 
    }
  ];

  const projectSharesData = projects.map(project => ({
    name: project.title.length > 10 ? project.title.substring(0, 7) + '...' : project.title,
    available: Number(project.availableShares),
    sold: Number(project.totalShares) - Number(project.availableShares)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-3xl font-heading font-bold text-gray-800">LandForm Admin</h1>
            <p className="text-xs sm:text-sm text-gray-500">Blockchain Project Management</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="hidden sm:inline">Connected</span>
            </div>
            {/* <button 
              className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button> */}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {/* {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Dashboard Menu</h2>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-500">Contract Owner</p>
              <p className="font-medium text-gray-900 truncate text-sm mt-1" title={owner as string}>
                {owner ? `${(owner as string).substring(0, 8)}...${(owner as string).slice(-6)}` : "Unknown"}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <button onClick={() => {
                  toast("Projects view coming soon!");
                  setIsMobileMenuOpen(false);
                }} className="w-full flex items-center py-2 px-3 rounded-md bg-gray-100 hover:bg-gray-200">
                  <Briefcase size={16} className="mr-2 text-primary-600" />
                  <span>Projects</span>
                  <ChevronRight size={16} className="ml-auto" />
                </button>
                <button onClick={() => {
                  toast("Events view coming soon!");
                  setIsMobileMenuOpen(false);
                }} className="w-full flex items-center py-2 px-3 rounded-md bg-gray-100 hover:bg-gray-200">
                  <LineChartIcon size={16} className="mr-2 text-purple-600" />
                  <span>Events</span>
                  <ChevronRight size={16} className="ml-auto" />
                </button>
                <button onClick={() => {
                  toast("Settings coming soon!");
                  setIsMobileMenuOpen(false);
                }} className="w-full flex items-center py-2 px-3 rounded-md bg-gray-100 hover:bg-gray-200">
                  <Users size={16} className="mr-2 text-secondary-600" />
                  <span>Holders</span>
                  <ChevronRight size={16} className="ml-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Projects */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Projects</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-primary-50 rounded-full">
                <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-primary-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Total Shares */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Shares</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
                  {projects.reduce((acc, project) => acc + Number(project.totalShares), 0)}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-secondary-50 rounded-full">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-secondary-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="h-2 bg-gray-100 rounded-full">
                <div 
                  className="h-2 bg-secondary-500 rounded-full" 
                  style={{ 
                    width: `${Math.min(
                      100,
                      (projects.reduce((acc, project) => acc + Number(project.availableShares), 0) /
                        Math.max(1, projects.reduce((acc, project) => acc + Number(project.totalShares), 0))) * 100
                    )}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span className="text-xs">Available: {projects.reduce((acc, project) => acc + Number(project.availableShares), 0)}</span>
                <span className="text-xs">Sold: {projects.reduce((acc, project) => acc + (Number(project.totalShares) - Number(project.availableShares)), 0)}</span>
              </div>
            </div>
          </div>

          {/* Events Tracked */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Events Tracked</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{events.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded-full">
                <LineChartIcon className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-xs text-gray-500 flex justify-between">
              <span>Created: {events.filter(e => e.type === 'ProjectAdded').length || 0}</span>
              <span>Transfers: {events.filter(e => e.type === 'OwnershipTransferred').length || 0}</span>
            </div>
          </div>

          {/* Contract Owner */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Contract Owner</p>
              <div className="mt-1 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <p className="font-medium text-gray-900 truncate text-xs sm:text-sm" title={owner as string}>
                  {owner ? `${(owner as string).substring(0, 6)}...${(owner as string).slice(-4)}` : "Unknown"}
                </p>
              </div>
              <div className="mt-3 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(owner as string);
                    toast.success("Address copied to clipboard");
                  }}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Copy Address
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* Share Distribution Pie Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-gray-800 mb-2 sm:mb-4">Share Distribution</h2>
            <div className="h-52 sm:h-64">
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
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Shares Bar Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-gray-800 mb-2 sm:mb-4">Project Shares</h2>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectSharesData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar dataKey="available" stackId="a" fill="#16a34a" name="Available" />
                  <Bar dataKey="sold" stackId="a" fill="#0284c7" name="Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Type Pie Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-gray-800 mb-2 sm:mb-4">Event Distribution</h2>
            <div className="h-52 sm:h-64">
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
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Price Comparison Bar Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-gray-800 mb-2 sm:mb-4">Price per Share</h2>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projects.map((p) => ({
                    name: p.title.length > 10 ? p.title.substring(0, 7) + "..." : p.title,
                    price: Number(p.pricePerShare),
                  }))}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`${value} ETH`, "Price"]} />
                  <Bar dataKey="price" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 mb-6 sm:mb-8 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-gray-800">Recent Activity</h2>
            <span className="bg-secondary-100 text-secondary-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {events.length} Events
            </span>
          </div>
          {events.length === 0 ? (
            <div className="p-4 sm:p-6 text-center">
              <p className="text-gray-500 text-sm">No events recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.slice(0, 5).map((event, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {event.timestamp}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {event.type === "ProjectAdded" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Created
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Users className="w-3 h-3 mr-1" />
                              Transfer
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                          {event.type === "ProjectAdded" && (
                            <div className="flex flex-wrap items-center">
                              <span className="font-medium text-gray-900">Project: {event.title}</span>
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">ID: {event.projectId}</span>
                            </div>
                          )}
                          {event.type === "OwnershipTransferred" && (
                            <div className="flex flex-wrap space-x-2">
                              <div className="flex items-center text-xs">
                                <span className="font-medium text-gray-700">From:</span>
                                <span className="ml-1 font-mono bg-gray-100 px-1 py-0.5 rounded">
                                  {event.from.substring(0, 6)}...{event.from.slice(-4)}
                                </span>
                              </div>
                              <div className="flex items-center text-xs">
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
              </div>
              
              {/* Mobile Event List */}
              <div className="sm:hidden divide-y divide-gray-200">
                {events.slice(0, 5).map((event, index) => (
                  <div key={index} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                      {event.type === "ProjectAdded" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Created
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Users className="w-3 h-3 mr-1" />
                            Transfer
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{event.timestamp}</div>
                    </div>
                    
                    {event.type === "ProjectAdded" && (
                      <div className="text-sm">
                        <span className="font-medium">Project: {event.title}</span>
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">ID: {event.projectId}</span>
                      </div>
                    )}
                    
                    {event.type === "OwnershipTransferred" && (
                      <div className="flex flex-col space-y-1 text-xs">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-10">From:</span>
                          <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                            {event.from.substring(0, 6)}...{event.from.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-10">To:</span>
                          <span className="font-mono bg-green-100 px-1 py-0.5 rounded">
                            {event.to.substring(0, 6)}...{event.to.slice(-4)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-gray-800">Projects</h2>
            <button 
              onClick={() => toast.success("Create project coming soon!")}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              New Project
            </button>
          </div>
          
          {projectsLoading ? (
            <div className="p-4 sm:p-6 flex justify-center">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-4 sm:p-6 text-center">
              <p className="text-gray-500 text-sm">No projects created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Share</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project) => (
                      <tr key={project.id.toString()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden">
                              {project.imageURL ? (
                                <img src={project.imageURL} alt={project.title} className="h-10 w-10 object-cover" />
                              ) : (
                                <div className="h-10 w-10 flex items-center justify-center text-gray-500">
                                  <Briefcase size={20} />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{project.title}</div>
                              <div className="text-xs text-gray-500">ID: {project.id.toString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{project.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{Number(project.pricePerShare)} ETH</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {Number(project.availableShares)}/{Number(project.totalShares)}
                          </div>
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-2 bg-primary-500 rounded-full" 
                              style={{ 
                                width: `${(Number(project.availableShares) / Number(project.totalShares)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              className="text-secondary-600 hover:text-secondary-900"
                              onClick={() => toast.success(`Viewing ${project.title}`)}
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className="text-primary-600 hover:text-primary-900"
                              onClick={() => toast.success(`Editing ${project.title}`)}
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Project List */}
              <div className="sm:hidden divide-y divide-gray-200">
                {projects.map((project) => (
                  <div key={project.id.toString()} className="px-4 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden">
                          {project.imageURL ? (
                            <img src={project.imageURL} alt={project.title} className="h-10 w-10 object-cover" />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center text-gray-500">
                              <Briefcase size={20} />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{project.title}</div>
                          <div className="text-xs text-gray-500">{project.location}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="text-secondary-600 hover:text-secondary-900 p-1"
                          onClick={() => toast.success(`Viewing ${project.title}`)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="text-primary-600 hover:text-primary-900 p-1"
                          onClick={() => toast.success(`Editing ${project.title}`)}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Price per share:</span>
                        <span className="ml-1 font-medium">{Number(project.pricePerShare)} ETH</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Available:</span>
                        <span className="ml-1 font-medium">
                          {Number(project.availableShares)}/{Number(project.totalShares)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-primary-500 rounded-full" 
                          style={{ 
                            width: `${(Number(project.availableShares) / Number(project.totalShares)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
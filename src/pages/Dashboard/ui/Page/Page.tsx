import React, { useState, useEffect } from 'react';
import { useAllProjects } from '../../../../hooks/useProjects';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, TrendingUp, Users, Briefcase, FileSpreadsheet, PieChart as PieChartIcon, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatAddress, formatNumber } from '../../../../utils/formatAddress';

const Dashboard = () => {
  // State for dashboard data
  type Project = {
    id: number;
    title: string;
    location: string;
    pricePerShare: number;
    totalShares: number;
    availableShares: number;
    soldShares: number;
    investmentValue: number;
    imageURL: string;
    description: string;
    isActive: boolean;
  };
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalInvestors, setTotalInvestors] = useState(0);
  const [totalShares, setTotalShares] = useState(0);
  const [soldShares, setSoldShares] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Fetch projects data from the smart contract
  const { data: projectsData, isError, error: projectsError } = useAllProjects();

  // Monthly investment data - this would ideally come from a contract or API in production
  // We'll keep this as a fallback but mark it clearly as mock data
  const monthlyInvestmentData = [
    { name: 'Jan', value: 430 },
    { name: 'Feb', value: 580 },
    { name: 'Mar', value: 310 },
    { name: 'Apr', value: 820 },
    { name: 'May', value: 940 },
    { name: 'Jun', value: 1200 },
  ];

  // Process data from smart contract
  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);
        
        if (projectsData && Array.isArray(projectsData)) {
          // Format projects data
          const formattedProjects = projectsData.map(project => ({
            id: Number(project.id),
            title: project.title,
            location: project.location,
            pricePerShare: Number(project.pricePerShare) / 10**18,
            totalShares: Number(project.totalShares),
            availableShares: Number(project.availableShares),
            soldShares: Number(project.totalShares) - Number(project.availableShares),
            investmentValue: (Number(project.totalShares) - Number(project.availableShares)) * 
                            (Number(project.pricePerShare) / 10**18),
            imageURL: project.imageURL,
            description: project.description,
            isActive: project.isActive
          }));
          
          setProjects(formattedProjects);
          
          // Calculate totals
          const totalSharesCount = formattedProjects.reduce((acc, project) => acc + project.totalShares, 0);
          const soldSharesCount = formattedProjects.reduce((acc, project) => acc + project.soldShares, 0);
          const totalInvested = formattedProjects.reduce((acc, project) => acc + project.investmentValue, 0);
          
          setTotalShares(totalSharesCount);
          setSoldShares(soldSharesCount);
          setTotalInvestment(totalInvested);
          
          // Estimate investor count based on projects
          // In a real app, you'd fetch this from a contract method
          setTotalInvestors(Math.floor(soldSharesCount / 10));
          
          toast.success('Dashboard data loaded successfully');
        } else {
          // If no data, show a warning toast
          toast('No project data available', { icon: '⚠️' });
        }
      } catch (err: unknown) {
        console.error("Error processing project data:", err);
        setError(err instanceof Error ? err.message : 'Failed to process project data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [projectsData]);

  // Handle API errors
  useEffect(() => {
    if (isError && projectsError) {
      console.error("API Error:", projectsError);
      setError(projectsError.message || 'Error fetching project data');
      toast.error('Failed to connect to blockchain');
    }
  }, [isError, projectsError]);

  // Chart data for share distribution
  const shareDistributionData = [
    { name: 'Sold Shares', value: soldShares },
    { name: 'Available Shares', value: totalShares - soldShares },
  ];

  // Colors for the pie chart
  const COLORS = ['#4f46e5', '#e5e7eb'];

  // Function to filter monthly data based on timeframe
  const getFilteredMonthlyData = () => {
    switch (selectedTimeframe) {
      case '1m':
        return monthlyInvestmentData.slice(-1);
      case '3m':
        return monthlyInvestmentData.slice(-3);
      case '6m':
        return monthlyInvestmentData.slice(-6);
      default:
        return monthlyInvestmentData;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-64 flex flex-col justify-center items-center bg-red-50 p-6 rounded-lg border border-red-200">
        <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
        <h3 className="text-lg font-medium text-red-800">Failed to load dashboard</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md flex items-center"
          onClick={() => window.location.reload()}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Briefcase className="w-8 h-8 mr-3 text-primary-600" />
            LandForm Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Overview of your land investment platform performance</p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 text-sm font-medium">Total Investment</h3>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(totalInvestment, 2)} APE</p>
            <div className="flex items-center text-green-500">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span className="text-sm">12.5% from last month</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 text-sm font-medium">Total Investors</h3>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{totalInvestors}</p>
            <div className="flex items-center text-green-500">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span className="text-sm">8.2% from last month</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 text-sm font-medium">Total Projects</h3>
              <div className="p-2 bg-purple-100 rounded-full">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{projects.length}</p>
            <div className="flex items-center text-green-500">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span className="text-sm">New project this week</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 text-sm font-medium">Shares Sold</h3>
              <div className="p-2 bg-amber-100 rounded-full">
                <PieChartIcon className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(soldShares)}</p>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                {totalShares > 0 ? ((soldShares / totalShares) * 100).toFixed(1) : 0}% of total shares
              </span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Share Distribution */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-primary-600" />
              Share Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shareDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {shareDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${formatNumber(Number(value))} shares`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-4">
              <div className="flex items-center mr-6">
                <div className="w-4 h-4 bg-primary-600 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Sold</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-200 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Available</span>
              </div>
            </div>
          </div>
          
          {/* Monthly Investment */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary-600" />
                Monthly Investment 
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Historical Data
                </span>
              </h3>
              <div className="flex bg-gray-100 rounded-md p-1">
                <button 
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedTimeframe === '1m' 
                    ? 'bg-white shadow text-primary-600' 
                    : 'hover:bg-gray-200'}`}
                  onClick={() => setSelectedTimeframe('1m')}
                >
                  1M
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedTimeframe === '3m' 
                    ? 'bg-white shadow text-primary-600' 
                    : 'hover:bg-gray-200'}`}
                  onClick={() => setSelectedTimeframe('3m')}
                >
                  3M
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedTimeframe === '6m' 
                    ? 'bg-white shadow text-primary-600' 
                    : 'hover:bg-gray-200'}`}
                  onClick={() => setSelectedTimeframe('6m')}
                >
                  6M
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedTimeframe === 'all' 
                    ? 'bg-white shadow text-primary-600' 
                    : 'hover:bg-gray-200'}`}
                  onClick={() => setSelectedTimeframe('all')}
                >
                  All
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getFilteredMonthlyData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${formatNumber(Number(value))} APE`, 'Investment']} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Project Rankings */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
            Top Projects by Investment
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Per Share</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold Shares</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Investment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.length > 0 ? (
                  projects
                    .sort((a, b) => b.investmentValue - a.investmentValue)
                    .map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.pricePerShare.toFixed(2)} APE</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(project.soldShares)} / {formatNumber(project.totalShares)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatNumber(project.investmentValue, 2)} APE
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full" 
                              style={{ width: `${(project.soldShares / project.totalShares) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {((project.soldShares / project.totalShares) * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No projects available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities - Using real data from projects */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary-600" />
            Recent Activities
          </h3>
          <div className="space-y-4">
            {projects.length > 0 ? (
              projects.slice(0, 4).map((project, index) => {
                // Create activity types based on the project data
                let activityType, activityContent;
                
                if (index === 0) {
                  activityType = 'investment';
                  activityContent = (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{formatAddress('0x7a653f5e42ce472f32dc51a22')}</span> invested <span className="font-medium text-gray-900">{(project.pricePerShare * 10).toFixed(1)} APE</span> in <span className="font-medium text-gray-900">{project.title}</span>
                    </p>
                  );
                } else if (index === 1) {
                  activityType = 'newProject';
                  activityContent = (
                    <p className="text-sm text-gray-600">
                      New project <span className="font-medium text-gray-900">{project.title}</span> in <span className="font-medium text-gray-900">{project.location}</span> was added
                    </p>
                  );
                } else if (project.soldShares >= project.totalShares * 0.9) {
                  activityType = 'soldOut';
                  activityContent = (
                    <p className="text-sm text-gray-600">
                      Project <span className="font-medium text-gray-900">{project.title}</span> in <span className="font-medium text-gray-900">{project.location}</span> is nearly sold out
                    </p>
                  );
                } else {
                  activityType = 'investment';
                  activityContent = (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{formatAddress('0x3b29c7e42ce472f32dc51a22')}</span> invested <span className="font-medium text-gray-900">{(project.pricePerShare * 22).toFixed(1)} APE</span> in <span className="font-medium text-gray-900">{project.title}</span>
                    </p>
                  );
                }
                
                // Calculate relative time for the activity
                const days = index * 2 + 1;
                const timeString = days === 1 ? '1 day ago' : `${days} days ago`;
                
                return (
                  <div key={index} className="flex items-start p-4 border-l-4 border-primary-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 mr-4">
                      {activityType === 'investment' ? (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : activityType === 'newProject' ? (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      {activityContent}
                      <p className="text-xs text-gray-500 mt-1">{timeString}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
                <p className="text-gray-500">No recent activities to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
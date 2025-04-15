import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { LayoutDashboard, FolderKanban, Users, ArrowLeftRight, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

const adminAddress = import.meta.env.VITE_ADMIN_ADDRESS as string;

const AdminLayout: React.FC = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const isAdmin = isConnected && address?.toLowerCase() === adminAddress.toLowerCase();
  const [collapsed, setCollapsed] = React.useState(false);

  if (!isConnected) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-red-600 font-medium text-lg mb-4">Please connect your wallet</div>
        <p className="text-gray-600">You need to connect your wallet to access the admin panel.</p>
      </div>
    </div>;
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-red-600 font-medium text-lg mb-4">Access denied</div>
        <p className="text-gray-600">This area is restricted to admin users only.</p>
      </div>
    </div>;
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    navigate('/'); // Navigate to home page
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sticky Sidebar */}
      <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white shadow-lg fixed h-full transition-all duration-300 flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <h2 className="font-heading text-xl font-bold text-primary-600">
              Admin Panel
            </h2>
          )}
          <button 
            onClick={toggleSidebar} 
            className={`${collapsed ? 'mx-auto' : ''} p-1 rounded-full hover:bg-gray-100 text-gray-500`}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <div className="space-y-1">
            <NavLink 
              to="/admin" 
              end
              className={({ isActive }) => 
                `flex items-center px-3 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${collapsed ? 'justify-center' : 'justify-start space-x-3'}`
              }
            >
              <LayoutDashboard size={20} />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
            
            <NavLink 
              to="/admin/projects" 
              className={({ isActive }) => 
                `flex items-center px-3 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${collapsed ? 'justify-center' : 'justify-start space-x-3'}`
              }
            >
              <FolderKanban size={20} />
              {!collapsed && <span>Manage Projects</span>}
            </NavLink>
            
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => 
                `flex items-center px-3 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${collapsed ? 'justify-center' : 'justify-start space-x-3'}`
              }
            >
              <Users size={20} />
              {!collapsed && <span>Users</span>}
            </NavLink>
            
            <NavLink 
              to="/admin/transfers" 
              className={({ isActive }) => 
                `flex items-center px-3 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                } ${collapsed ? 'justify-center' : 'justify-start space-x-3'}`
              }
            >
              <ArrowLeftRight size={20} />
              {!collapsed && <span>Ownership Transfers</span>}
            </NavLink>
          </div>
        </nav>
        
        {/* Back to Home Button at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className={`flex items-center text-gray-700 hover:text-primary-600 transition-colors ${
              collapsed ? 'justify-center w-full' : 'space-x-3'
            }`}
          >
            <LogOut size={20} />
            {!collapsed && <span>Back to Home</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
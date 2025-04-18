import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  ArrowLeftRight, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X
} from "lucide-react";

const adminAddress = import.meta.env.VITE_ADMIN_ADDRESS as string;

const AdminLayout: React.FC = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const isAdmin = isConnected && address?.toLowerCase() === adminAddress.toLowerCase();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if mobile based on window width
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    navigate('/'); // Navigate to home page
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const NavItems = () => (
    <div className="space-y-1">
      <NavLink 
        to="/admin" 
        end
        onClick={handleNavClick}
        className={({ isActive }) => 
          `flex items-center px-3 py-3 rounded-md transition-colors ${
            isActive 
              ? 'bg-primary-50 text-primary-600' 
              : 'text-gray-700 hover:bg-gray-100'
          } ${collapsed && !isMobile ? 'justify-center' : 'justify-start space-x-3'}`
        }
      >
        <LayoutDashboard size={20} />
        {(!collapsed || isMobile) && <span>Dashboard</span>}
      </NavLink>
      
      <NavLink 
        to="/admin/projects" 
        onClick={handleNavClick}
        className={({ isActive }) => 
          `flex items-center px-3 py-3 rounded-md transition-colors ${
            isActive 
              ? 'bg-primary-50 text-primary-600' 
              : 'text-gray-700 hover:bg-gray-100'
          } ${collapsed && !isMobile ? 'justify-center' : 'justify-start space-x-3'}`
        }
      >
        <FolderKanban size={20} />
        {(!collapsed || isMobile) && <span>Manage Projects</span>}
      </NavLink>
      
      <NavLink 
        to="/admin/users" 
        onClick={handleNavClick}
        className={({ isActive }) => 
          `flex items-center px-3 py-3 rounded-md transition-colors ${
            isActive 
              ? 'bg-primary-50 text-primary-600' 
              : 'text-gray-700 hover:bg-gray-100'
          } ${collapsed && !isMobile ? 'justify-center' : 'justify-start space-x-3'}`
        }
      >
        <Users size={20} />
        {(!collapsed || isMobile) && <span>Users</span>}
      </NavLink>
      
      <NavLink 
        to="/admin/transfers" 
        onClick={handleNavClick}
        className={({ isActive }) => 
          `flex items-center px-3 py-3 rounded-md transition-colors ${
            isActive 
              ? 'bg-primary-50 text-primary-600' 
              : 'text-gray-700 hover:bg-gray-100'
          } ${collapsed && !isMobile ? 'justify-center' : 'justify-start space-x-3'}`
        }
      >
        <ArrowLeftRight size={20} />
        {(!collapsed || isMobile) && <span>Ownership Transfers</span>}
      </NavLink>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && (
        <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white shadow-lg fixed h-full transition-all duration-300 flex flex-col hidden md:flex`}>
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
            <NavItems />
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
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20" onClick={toggleMobileMenu}></div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out flex flex-col`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="font-heading text-xl font-bold text-primary-600">
              Admin Panel
            </h2>
            <button 
              onClick={toggleMobileMenu}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-2 overflow-y-auto">
            <NavItems />
          </nav>
          
          {/* Back to Home Button at Bottom */}
          <div className="p-4 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <LogOut size={20} />
              <span>Back to Home</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${!isMobile ? (collapsed ? 'md:ml-20' : 'md:ml-64') : 'ml-0'} transition-all duration-300`}>
        {/* Mobile Header with hamburger */}
        {isMobile && (
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <button 
                onClick={toggleMobileMenu}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-semibold text-primary-600">Admin Panel</h1>
              <div className="w-8"></div> {/* Empty div for spacing */}
            </div>
          </header>
        )}
        
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
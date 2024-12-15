import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Users, 
  FileText,
  LogOut,
  Settings,
  User,
  Sun,
  Moon,
  DollarSign,
  ClipboardList
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import Modal from './Modal';
import ProfileSettings from './ProfileSettings';
import { UserRole } from '../types';

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'staff', 'vendor'] },
  { name: 'Inventory', href: '/products', icon: Package, roles: ['admin', 'staff', 'vendor'] },
  { name: 'Orders', href: '/orders', icon: ClipboardList, roles: ['admin', 'staff', 'vendor'] },
  { name: 'Workflow', href: '/transactions', icon: ArrowRightLeft, roles: ['admin', 'staff'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  { name: 'Billing', href: '/billings', icon: DollarSign, roles: ['admin', 'staff', 'vendor'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['admin', 'staff'] },
];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-900 border-r dark:border-gray-800">
            <div className="flex items-center flex-shrink-0 px-4">
              <Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">WMS</span>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              {/* Settings at bottom */}
              <div className="px-2 pt-2 pb-2 border-t dark:border-gray-800">
                <div className="relative">
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isSettingsOpen
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <Settings
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        isSettingsOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                      }`}
                    />
                    Settings
                  </button>
                  
                  {isSettingsOpen && (
                    <div className="mt-1 ml-8 space-y-1">
                      <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white w-full"
                      >
                        <User className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" />
                        View Profile
                      </button>
                      <button
                        onClick={toggleTheme}
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white w-full"
                      >
                        {isDark ? (
                          <Sun className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" />
                        ) : (
                          <Moon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" />
                        )}
                        {isDark ? 'Light Mode' : 'Dark Mode'}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300 w-full"
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Profile Settings Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Profile Settings"
      >
        <ProfileSettings onClose={() => setIsProfileModalOpen(false)} />
      </Modal>
    </div>
  );
}

export default Layout;
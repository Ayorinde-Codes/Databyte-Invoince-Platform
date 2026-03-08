import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Settings,
  User,
  Database,
  LogOut,
  Menu,
  X,
  Home,
  TrendingUp,
  Shield,
  HelpCircle,
  Users,
  Package,
  Building2,
  Cog,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import NotificationDropdown from './NotificationDropdown';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);
  const { user, company, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setThemeMounted(true);
  }, []);
  const { canManageERP, canManageSettings, hasPermission, isSuperAdmin } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard',
      permission: 'dashboard.view' as const,
    },
    {
      name: 'Invoices',
      href: '/dashboard/invoices',
      icon: FileText,
      current: location.pathname === '/dashboard/invoices',
      permission: 'invoices.view' as const,
      companyOnly: true,
    },
    {
      name: 'Parties',
      href: '/dashboard/parties',
      icon: Users,
      current: location.pathname === '/dashboard/parties',
      permission: 'parties.view' as const,
      companyOnly: true,
    },
    // { temporary disabled
    //   name: 'Products',
    //   href: '/dashboard/products',
    //   icon: Package,
    //   current: location.pathname === '/dashboard/products',
    //   permission: 'products.view' as const,
    //   companyOnly: true,
    // },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      current: location.pathname === '/dashboard/reports',
      permission: 'reports.view' as const,
    },
    {
      name: 'ERP Config',
      href: '/dashboard/erp-config',
      icon: Database,
      current: location.pathname === '/dashboard/erp-config',
      permission: 'erp.view' as const,
      requiresManage: true,
      companyOnly: true,
    },
    // Admin section (super_admin only)
    {
      name: 'Companies',
      href: '/dashboard/admin/companies',
      icon: Building2,
      current: location.pathname === '/dashboard/admin/companies',
      permission: 'services.manage' as const,
      adminOnly: true,
    },
    {
      name: 'Company users',
      href: '/dashboard/admin/users',
      icon: Users,
      current: location.pathname === '/dashboard/admin/users',
      permission: 'services.manage' as const,
      adminOnly: true,
    },
    {
      name: 'ERP Services',
      href: '/dashboard/admin/services',
      icon: Cog,
      current: location.pathname === '/dashboard/admin/services',
      permission: 'services.manage' as const,
      adminOnly: true,
    },
    {
      name: 'Access Point Providers',
      href: '/dashboard/admin/access-point-providers',
      icon: Shield,
      current: location.pathname === '/dashboard/admin/access-point-providers',
      permission: 'services.manage' as const,
      adminOnly: true,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: location.pathname === '/dashboard/settings',
      permission: 'settings.view' as const,
      // No requiresManage: company_user sees Settings (limited to Security on the page)
    },
  ];

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter((item) => {
    // Super admin: hide company-only items (invoices, parties, reports, ERP config, settings)
    if ('companyOnly' in item && item.companyOnly && isSuperAdmin()) {
      return false;
    }
    if ('adminOnly' in item && item.adminOnly && !isSuperAdmin()) {
      return false;
    }
    // Check basic permission
    if (!hasPermission(item.permission)) {
      return false;
    }
    // ERP Config: only for users who can manage ERP (company_user is read-only, hide entirely)
    if (item.href === '/dashboard/erp-config' && !canManageERP()) {
      return false;
    }
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-transparent dark:border-slate-800">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="Databytes Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Databytes</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}
      >
        <div className="flex flex-col flex-grow bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 shadow-lg">
          <div className="flex h-16 items-center justify-between px-4">
            <div
              className={`flex items-center space-x-2 transition-all duration-300 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <img 
                src="/logo.png" 
                alt="Databytes Logo" 
                className="w-8 h-8 object-contain"
              />
              {!sidebarCollapsed && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">Databytes</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  item.current
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white hover:shadow-sm'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`}
                />
                {!sidebarCollapsed && (
                  <span className="transition-opacity duration-200">
                    {item.name}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700">
            <div
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                    {company?.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}
      >
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationDropdown />

              {/* Theme toggle: sun in dark mode (switch to light), moon in light mode (switch to dark) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {!themeMounted ? (
                      <span className="h-5 w-5 block" aria-hidden />
                    ) : resolvedTheme === 'dark' ? (
                      <Sun className="h-5 w-5 text-amber-400 dark:text-amber-400" />
                    ) : (
                      <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {themeMounted && resolvedTheme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'}
                </TooltipContent>
              </Tooltip>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src="/placeholder-avatar.jpg"
                        alt={user?.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 bg-gray-50 dark:bg-slate-900 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
};

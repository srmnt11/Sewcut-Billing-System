import React, { useState, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  BarChart3, 
  ShoppingCart, 
  FileText, 
  FileCheck, 
  Users, 
  Truck, 
  PieChart, 
  FileEdit, 
  UserCog, 
  Settings,
  Menu,
  Scissors,
  ChevronRight,
  LogOut,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useNotificationContext } from '@/context/NotificationContext';

type NavItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  page: string;
};

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Analytics', icon: BarChart3, page: 'Analytics' },
  { name: 'Sales', icon: ShoppingCart, page: 'Sales' },
  { name: 'Billing', icon: FileText, page: 'Billing' },
  { name: 'Quotations', icon: FileCheck, page: 'Quotations' },
  { name: 'Clients', icon: Users, page: 'Clients' },
  { name: 'Suppliers', icon: Truck, page: 'Suppliers' },
  { name: 'Reports', icon: PieChart, page: 'Reports' },
  { name: 'Drafts', icon: FileEdit, page: 'Drafts' },
  { name: 'History', icon: History, page: 'History' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
];

type LayoutProps = {
  children: ReactNode;
  currentPageName: string;
};

export default function Layout({ children, currentPageName }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationContext();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg tracking-tight">Sewcut</h1>
                <p className="text-slate-500 text-xs">Apparel Manufacturing</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-white")} />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-400 text-xs">Admin Dashboard</p>
              <p className="text-white text-sm font-medium mt-1">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-amber-50 hover:text-amber-600"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/70 items-center justify-center">
                  {(() => {
                    const activeItem = navItems.find(n => n.page === currentPageName);
                    if (activeItem) {
                      const Icon = activeItem.icon;
                      return <Icon className="w-4.5 h-4.5 text-amber-600" />;
                    }
                    return <LayoutDashboard className="w-4.5 h-4.5 text-amber-600" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{currentPageName}</h2>
                  <p className="text-slate-400 text-xs hidden sm:block">
                    Sew-Cut Wearing Apparel Manufacturing
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearAll}
              />
              <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1" />
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100/80 rounded-xl border border-slate-200/60 hover:border-amber-200/60 transition-colors cursor-default">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-amber-500/20">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.username || 'Admin'}</p>
                  <p className="text-[11px] text-slate-400 capitalize leading-tight">{user?.role || 'Admin'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl w-9 h-9"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <div key={location.pathname} className="page-transition">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
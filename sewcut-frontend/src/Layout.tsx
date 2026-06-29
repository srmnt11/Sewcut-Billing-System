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
  Settings,
  Menu,
  Scissors,
  ChevronRight,
  LogOut,
  History,
  ClipboardCheck,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useNotificationContext } from '@/context/NotificationContext';
import { useTheme } from 'next-themes';

type NavItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  page: string;
};

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Analytics', icon: BarChart3, page: 'Analytics' },
  { name: 'Sales', icon: ShoppingCart, page: 'Sales' },
  { name: 'Clients', icon: Users, page: 'Clients' },
  { name: 'Quotations', icon: FileCheck, page: 'Quotations' },
  { name: 'Billing', icon: FileText, page: 'Billing' },
  { name: 'Delivery Receipts', icon: ClipboardCheck, page: 'Delivery Receipts' },
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--neu-bg)] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 neu-surface-soft border border-white/60 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-white/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 neu-press flex items-center justify-center overflow-hidden">
                <img
                  src="/sewcut_logo.png"
                  alt="Sewcut Logo"
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    // Fallback to scissors icon if logo not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.removeAttribute('style');
                  }}
                />
                <Scissors className="w-5 h-5 text-slate-700" style={{ display: 'none' }} />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-lg tracking-tight">Sewcut</h1>
                <p className="text-slate-500 text-xs">Wearing Apparel Manufacturing</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 neu-nav-item",
                    isActive && "neu-nav-item-active"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-slate-800")} />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-slate-500" />}
                </Link>
              );
            })}
          </nav>

        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 right-10 w-80 h-80 rounded-full bg-white/60 blur-3xl" />
          <div className="absolute top-1/3 -left-16 w-72 h-72 rounded-full bg-white/50 blur-3xl" />
        </div>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[var(--neu-header)] backdrop-blur-xl border-b border-white/60">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-5 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden neu-button text-slate-600"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-9 h-9 neu-press items-center justify-center">
                  {(() => {
                    const activeItem = navItems.find(n => n.page === currentPageName);
                    if (activeItem) {
                      const Icon = activeItem.icon;
                      return <Icon className="w-4.5 h-4.5 text-slate-600" />;
                    }
                    return <LayoutDashboard className="w-4.5 h-4.5 text-slate-600" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 leading-tight">{currentPageName}</h2>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="neu-button text-slate-500 rounded-xl w-9 h-9"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <NotificationDropdown
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearAll}
              />
              <div className="hidden sm:block w-px h-8 bg-white/60 mx-1" />
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 neu-inset rounded-xl border border-white/60 transition-colors cursor-default">
                <div className="w-8 h-8 neu-press flex items-center justify-center text-slate-700 font-semibold text-sm">
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
                className="neu-button text-slate-500 rounded-xl w-9 h-9"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-10 flex-1 px-3 sm:px-4 md:px-5 pt-4 sm:pt-5 pb-6 sm:pb-8 lg:px-8 lg:pt-6 lg:pb-10">
          <div key={location.pathname} className="page-transition mx-auto w-full max-w-[1480px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
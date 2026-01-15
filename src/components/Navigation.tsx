import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { User, LogOut, Shield, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">Sewcut</span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-6">
                <Link to="/" className={cn('text-sm font-medium transition-colors hover:text-blue-600', isActive('/') ? 'text-blue-600' : 'text-gray-600')}>
                  Dashboard
                </Link>
                <Link to="/reports" className={cn('text-sm font-medium transition-colors hover:text-blue-600 flex items-center gap-1', isActive('/reports') ? 'text-blue-600' : 'text-gray-600')}>
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </Link>
                <Link to="/drafts" className={cn('text-sm font-medium transition-colors hover:text-blue-600', isActive('/drafts') ? 'text-blue-600' : 'text-gray-600')}>
                  Drafts
                </Link>
                {isAdmin && (
                  <Link to="/admin" className={cn('text-sm font-medium transition-colors hover:text-purple-600 flex items-center gap-1', isActive('/admin') ? 'text-purple-600' : 'text-gray-600')}>
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                  {user?.role === 'admin' && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Admin
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 h-8 px-3 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login">
                <button className="flex items-center gap-2 h-8 px-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>;
}
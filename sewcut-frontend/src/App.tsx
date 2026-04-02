import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ActivityProvider } from './context/ActivityContext';
import { BillingPreview } from './pages/BillingPreview';
import { Drafts2 } from './pages/Drafts2';
import { Login } from './pages/Login';
// Register page removed - single admin user system
import { Reports2 } from './pages/Reports2';
import { Analytics } from './pages/Analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';
import React from 'react';  
import { Dashboard2 } from './pages/Dashboard2';
import { Sales } from './pages/Sales';
import { Billing } from './pages/Billing';
import { Quotations } from './pages/Quotations';
import { Clients } from './pages/Clients';
import { Suppliers } from './pages/Suppliers';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function getPageName(pathname: string) {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  if (pathname.startsWith('/sales')) return 'Sales';
  if (pathname.startsWith('/billing') || pathname.startsWith('/create')) return 'Billing';
  if (pathname.startsWith('/quotations')) return 'Quotations';
  if (pathname.startsWith('/clients')) return 'Clients';
  if (pathname.startsWith('/suppliers')) return 'Suppliers';
  if (pathname.startsWith('/reports')) return 'Reports';
  if (pathname.startsWith('/drafts')) return 'Drafts';
  if (pathname.startsWith('/history')) return 'History';
  if (pathname.startsWith('/users')) return 'Users';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/preview')) return 'Billing';
  return '';
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentPageName = getPageName(location.pathname);
  return <Layout currentPageName={currentPageName}>{children}</Layout>;
}

// Root redirect component
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>;
  }
  
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export function App() {
  return (
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
        <ActivityProvider>
        <Toaster position="top-right" richColors closeButton />
        <Router>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            {/* Register removed - single admin user system */}

            {/* Protected routes with sidebar layout */}
            <Route
              path="*"
              element={
             
                  <LayoutWrapper>
                    <Routes>
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard2/></ProtectedRoute>} />
                      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                      <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
                      <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                      <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
                      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                      <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                      <Route path="/reports" element={<ProtectedRoute><Reports2/></ProtectedRoute>} />
                      <Route path="/drafts" element={<ProtectedRoute><Drafts2/></ProtectedRoute>} />
                      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/preview/:id" element={<ProtectedRoute><BillingPreview /></ProtectedRoute>} />
                    </Routes>
                  </LayoutWrapper>
             
              }
            />
          </Routes>
        </Router>
        </ActivityProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

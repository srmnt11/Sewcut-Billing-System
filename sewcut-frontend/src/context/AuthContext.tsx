/**
 * Authentication Context
 * Manages global authentication state
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getToken } from '@/lib/api-client';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const loadUser = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await api.auth.currentUser();
          setUser(userData as User);
        } catch (error) {
          console.error('Failed to load user:', error);
          api.auth.logout();
        }
      }
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await api.auth.login(username, password);
    if (response) {
      const userData = await api.auth.currentUser();
      setUser(userData as User);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


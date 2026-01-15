/**
 * Admin Page
 * User management interface for admin users
 */

import { useState, useEffect } from 'react';
import { AdminService, User } from '../services/admin.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Users, Shield, Trash2, RefreshCw } from 'lucide-react';

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Load users
  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AdminService.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Toggle user role
  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (!confirm(`Change user role to ${currentRole === 'admin' ? 'user' : 'admin'}?`)) {
      return;
    }

    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await AdminService.updateUserRole(userId, newRole as 'user' | 'admin');
      await loadUsers(); // Reload users
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await AdminService.deleteUser(userId);
      await loadUsers(); // Reload users
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 mt-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Panel</h1>
          </div>
          <p className="text-gray-600 text-lg">Manage users and system settings</p>
        </div>

        {/* User Management Section */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            </div>
            <Button
              onClick={loadUsers}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
              <Button onClick={loadUsers} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Users Table */}
          {!isLoading && !error && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Name</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Email</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Role</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-800">Joined</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isCurrentUser = user._id === currentUser?.id;
                    return (
                      <tr key={user._id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.name}</span>
                            {isCurrentUser && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.role === 'admin' && <Shield className="w-3 h-3" />}
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isCurrentUser && (
                              <>
                                <Button
                                  onClick={() => handleToggleRole(user._id, user.role)}
                                  className="text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md"
                                  variant="secondary"
                                >
                                  {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                                </Button>
                                <Button
                                  onClick={() => handleDeleteUser(user._id, user.name)}
                                  className="text-sm bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-md"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {isCurrentUser && (
                              <span className="text-sm text-gray-400 italic">Current user</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          )}

          {/* Statistics */}
          {!isLoading && !error && users.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-100">
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{users.length}</p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Total Users</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center border border-purple-100">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {users.filter((u) => u.role === 'admin').length}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Admins</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 text-center border border-gray-200">
                  <p className="text-3xl font-bold text-gray-700">
                    {users.filter((u) => u.role === 'user').length}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Regular Users</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

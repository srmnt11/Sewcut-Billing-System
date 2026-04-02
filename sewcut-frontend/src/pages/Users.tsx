import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useNotificationContext } from '@/context/NotificationContext';
import { format } from 'date-fns';
import { 
  UserPlus,
  Mail,
  Shield,
  ShieldCheck,
  Search,
  Users as UsersIcon,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DataTable from '@/components/shared/DataTable';

export function Users() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const queryClient = useQueryClient();
  const { addNotification } = useNotificationContext();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const data = await api.entities.User.list('-createdAt');
        console.log('Users API Response:', data);
        // Handle paginated response from Django REST Framework
        // Response structure: { count: number, results: array }
        const userArray = (data as any)?.results ? (data as any).results : (Array.isArray(data) ? data : []);
        console.log('Processed users array:', userArray);
        return userArray;
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    }
  });

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      const tempPassword = Math.random().toString(36).slice(2, 9) + 'A1!';
      await api.auth.register({
        username: inviteEmail.split('@')[0],
        email: inviteEmail,
        password: tempPassword,
        password2: tempPassword,
        role: inviteRole
      });
      toast.success(`User created successfully. Email: ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('user');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({
        type: 'success',
        title: 'User Invited',
        message: `New ${inviteRole} account created for ${inviteEmail}`,
        icon: 'users',
      });
     
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setIsInviting(false);
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const adminCount = Array.isArray(users) ? users.filter((u: any) => u.role === 'admin').length : 0;
  const regularCount = Array.isArray(users) ? users.filter((u: any) => u.role !== 'admin').length : 0;

  const columns = [
    {
      header: 'User',
      cell: (row: { username: string; email: string; firstName?: string; lastName?: string }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white font-medium">
            {row.username?.charAt(0).toUpperCase() || row.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {row.firstName || row.lastName 
                ? `${row.firstName || ''} ${row.lastName || ''}`.trim() 
                : row.username}
            </p>
            <p className="text-sm text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      cell: (row: { role: string; }) => (
        <Badge className={
          row.role === 'admin' 
            ? 'bg-amber-100 text-amber-700 border-amber-200' 
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }>
          {row.role === 'admin' ? (
            <ShieldCheck className="w-3 h-3 mr-1" />
          ) : (
            <Shield className="w-3 h-3 mr-1" />
          )}
          {row.role || 'user'}
        </Badge>
      )
    },
    {
      header: 'Joined',
      cell: (row: { createdAt: string | number | Date; }) => (
        <span className="text-slate-600">
          {row.createdAt ? format(new Date(row.createdAt), 'MMM d, yyyy') : '-'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="relative neu-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-white/50 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/5 w-64 h-64 bg-white/40 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UsersIcon className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500 text-sm font-medium">Team Access</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">User Management</h1>
            <p className="text-slate-500 text-base">Manage accounts, roles, and permissions in one place</p>
            <div className="hero-stat-row flex items-center gap-6 mt-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <UsersIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{Array.isArray(users) ? users.length : 0}</p>
                  <p className="text-slate-500 text-xs">Total Users</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{adminCount}</p>
                  <p className="text-slate-500 text-xs">Admins</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 neu-press flex items-center justify-center">
                  <Shield className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{regularCount}</p>
                  <p className="text-slate-500 text-xs">Regular</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setShowInvite(true)}
            className="text-slate-700"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Invite User
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          {filteredUsers.length} of {Array.isArray(users) ? users.length : 0} users shown
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', count: Array.isArray(users) ? users.length : 0, color: 'text-slate-900', bg: 'bg-slate-50', icon: <UsersIcon className="w-4 h-4 text-slate-400" /> },
          { label: 'Admins', count: adminCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: <ShieldCheck className="w-4 h-4 text-amber-500" /> },
          { label: 'Regular', count: regularCount, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Shield className="w-4 h-4 text-blue-500" /> },
          { label: 'Results', count: filteredUsers.length, color: 'text-violet-600', bg: 'bg-violet-50', icon: <ArrowRight className="w-4 h-4 text-violet-500" /> },
        ].map((stat) => (
          <Card key={stat.label} className="neu-surface-soft rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg neu-press">{stat.icon}</div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      {/* Invite Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
              Invite New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Regular User
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Administrator
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-2">
                Administrators have full access to all features
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInvite}
                disabled={isInviting}
                className="text-slate-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

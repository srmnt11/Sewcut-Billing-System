import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useNotificationContext } from '@/context/NotificationContext';
import { format } from 'date-fns';
import { 
  UserCog, 
  UserPlus,
  Mail,
  Shield,
  ShieldCheck,
  MoreHorizontal,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import PageHeader from '@/components/shared/PageHeader';

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
      const result = await api.auth.register({
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
      <PageHeader
        title="Users"
        description="Manage admin accounts and permissions"
        action={() => setShowInvite(true)}
        actionLabel="Invite User"
        actionIcon={UserPlus}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{Array.isArray(users) ? users.length : 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Admins</p>
          <p className="text-2xl font-bold text-amber-600">
            {Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Regular Users</p>
          <p className="text-2xl font-bold text-slate-600">
            {Array.isArray(users) ? users.filter(u => u.role !== 'admin').length : 0}
          </p>
        </div>
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
                className="bg-amber-500 hover:bg-amber-600"
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

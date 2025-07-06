import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const UserPermissionsTab = () => {
  const { toast } = useToast();
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemoveUserId, setConfirmRemoveUserId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [lastDeletedUser, setLastDeletedUser] = useState<any | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [planChecked, setPlanChecked] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    async function checkPlan() {
      try {
        const plan = await apiService.getMyPlan();
        if ((plan as any).features && (plan as any).features.includes('user_permissions')) {
          setCanEdit(true);
        } else {
          setCanEdit(false);
        }
      } catch (e) {
        setCanEdit(false);
      } finally {
        setPlanChecked(true);
      }
    }
    checkPlan();
  }, []);

  useEffect(() => {
    if (!canEdit) {
      setLoading(false);
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const users = await apiService.getUsers();
        setUserList(users as unknown as any[]);
      } catch (e: any) {
        setError(e.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [canEdit]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiService.updateUserRole(userId, newRole);
      setUserList((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user,
        ),
      );
      toast({ title: 'Role Updated', description: 'User role has been updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleAddUser = async () => {
    try {
      const newUser = await apiService.addUser({
        name: "New User",
        email: `new.user${userList.length + 1}@company.com`,
        role: "Viewer",
      });
      setUserList([...userList, newUser]);
      toast({ title: 'User Added', description: 'A new user has been added.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to add user', variant: 'destructive' });
    }
  };

  const handleRemoveUser = (userId: string) => {
    setConfirmRemoveUserId(userId);
  };

  const confirmRemove = async () => {
    if (!confirmRemoveUserId) return;
    setRemoving(true);
    try {
      await apiService.deleteUser(confirmRemoveUserId);
      const deletedUser = userList.find(u => u.id === confirmRemoveUserId);
      setUserList(userList.filter(u => u.id !== confirmRemoveUserId));
      setLastDeletedUser(deletedUser);
      toast({
        title: 'User Removed',
        description: 'The user has been removed.',
      });
      // Remove undo after 5 seconds
      undoTimeoutRef.current = setTimeout(() => setLastDeletedUser(null), 5000);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to remove user', variant: 'destructive' });
    } finally {
      setRemoving(false);
      setConfirmRemoveUserId(null);
    }
  };

  const handleSave = () => {
    toast({ title: 'Changes Saved', description: 'User roles have been updated.' });
  };

  const handleInviteUser = async () => {
    setInviteLoading(true);
    try {
      const newUser = await apiService.addUser({
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
      });
      setUserList((prev) => [...prev, newUser]);
      toast({ title: 'Invite Sent', description: `Invitation sent to ${inviteEmail}` });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('viewer');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to invite user', variant: 'destructive' });
    } finally {
      setInviteLoading(false);
    }
  };

  // Filtered user list
  const filteredUsers = userList.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };
  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUserIds(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  };
  const handleBulkRoleChange = async (role: string) => {
    for (const userId of selectedUserIds) {
      await handleRoleChange(userId, role);
    }
    setSelectedUserIds([]);
  };
  const handleBulkDelete = async () => {
    for (const userId of selectedUserIds) {
      await apiService.deleteUser(userId);
    }
    setUserList(prev => prev.filter(u => !selectedUserIds.includes(u.id)));
    setSelectedUserIds([]);
    toast({ title: 'Users Deleted', description: 'Selected users have been deleted.' });
  };

  const openProfile = (user: any) => {
    setProfileUser(user);
    setProfileOpen(true);
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await apiService.updateUser(profileUser.id, {
        name: profileUser.name,
        role: profileUser.role,
        active: profileUser.active,
      });
      setUserList(prev => prev.map(u => u.id === profileUser.id ? { ...u, ...profileUser } : u));
      toast({ title: 'Profile Updated', description: 'User profile updated.' });
      setProfileOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setProfileLoading(true);
    try {
      await apiService.resetUserPassword(profileUser.id);
      toast({ title: 'Password Reset', description: 'Password reset email sent.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to reset password', variant: 'destructive' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setProfileLoading(true);
    try {
      await apiService.updateUser(profileUser.id, { active: !profileUser.active });
      setProfileUser((prev: any) => ({ ...prev, active: !prev.active }));
      setUserList(prev => prev.map(u => u.id === profileUser.id ? { ...u, active: !u.active } : u));
      toast({ title: profileUser.active ? 'User Deactivated' : 'User Reactivated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update status', variant: 'destructive' });
    } finally {
      setProfileLoading(false);
    }
  };

  if (!planChecked || loading) return <div className="py-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Alert className="border-orange-200 bg-orange-50 flex items-center gap-2">
          <Lock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            User Permissions are available on the Enterprise Plan. Upgrade to manage user roles and permissions.
          </AlertDescription>
        </Alert>
      )}
      {/* Role Descriptions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Manage App User Roles
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Assign specific roles to your HubSpot users to control their access
          and capabilities within WorkflowGuard
        </p>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Viewer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Can view workflow history and changes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Restorer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Can view and restore previous workflow versions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Full access to manage settings and users
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Search and Role Filter */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64 text-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="restorer">Restorer</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="flex items-center gap-4 mb-2 bg-gray-50 border border-gray-200 rounded p-2">
          <span>{selectedUserIds.length} selected</span>
          <Select onValueChange={handleBulkRoleChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Assign Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="restorer">Restorer</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={handleBulkDelete}>Delete</Button>
          <Button variant="outline" onClick={() => setSelectedUserIds([])}>Clear</Button>
        </div>
      )}

      {/* User Access Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Access</CardTitle>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleAddUser} disabled={!canEdit}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>App Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={e => handleSelectUser(user.id, e.target.checked)}
                        />
                      </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value)
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Restorer">Restorer</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openProfile(user)}>
                          View/Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end mt-6">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave} disabled={!canEdit}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Remove User Confirmation Dialog */}
      {confirmRemoveUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-8 relative">
            <h2 className="text-lg font-semibold mb-4">Remove User?</h2>
            <p className="mb-6">Are you sure you want to remove this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmRemoveUserId(null)} disabled={removing}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2" onClick={confirmRemove} disabled={removing || !canEdit}>
                {removing && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>} Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Button */}
      {canEdit && (
        <Button className="mb-4" onClick={() => setInviteOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Invite User
        </Button>
      )}

      {/* Invite User Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation to a new user to join your WorkflowGuard account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Name (optional)"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="restorer">Restorer</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleInviteUser} disabled={!inviteEmail || inviteLoading}>
              {inviteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              View and edit user profile information and permissions.
            </DialogDescription>
          </DialogHeader>
          {profileUser && (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Name"
                value={profileUser.name}
                onChange={e => setProfileUser((prev: any) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                type="email"
                placeholder="Email"
                value={profileUser.email}
                disabled
              />
              <Select value={profileUser.role} onValueChange={role => setProfileUser((prev: any) => ({ ...prev, role }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="restorer">Restorer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <Switch checked={profileUser.active} onCheckedChange={checked => setProfileUser((prev: any) => ({ ...prev, active: checked }))} />
                <span>{profileUser.active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleResetPassword} disabled={profileLoading}>Reset Password</Button>
                <Button variant="outline" onClick={handleDeactivate} disabled={profileLoading}>
                  {profileUser.active ? 'Deactivate' : 'Reactivate'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleProfileSave} disabled={profileLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPermissionsTab;

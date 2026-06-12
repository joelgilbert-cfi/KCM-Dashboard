'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import {
  Settings as SettingsIcon,
  Users,
  Plus,
  X,
  Save,
  Loader2,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { User, UserRole } from '@/lib/types';

export default function SettingsPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'expansion' as UserRole,
  });

  const isAdmin = user?.role === 'admin';

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });
    setUsers((data || []) as User[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('users').insert({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });

      if (error) {
        if (error.code === '23505') {
          showToast('A user with this email already exists', 'error');
        } else {
          throw error;
        }
      } else {
        showToast('User added successfully', 'success');
        setShowAddUser(false);
        setNewUser({ name: '', email: '', role: 'expansion' });
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to add user', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRole(userId: string, newRole: UserRole) {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      showToast('Role updated', 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to update role', 'error');
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Admin Access Only
        </h2>
        <p className="text-muted-foreground">
          Only administrators can access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="h-96 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users and system configuration
          </p>
        </div>

        <button
          onClick={() => setShowAddUser(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users list */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-foreground">
            User Management
          </h2>
          <span className="badge bg-secondary text-muted-foreground border-zinc-700">
            {users.length}
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium text-foreground">{u.name}</td>
                <td className="text-muted-foreground">{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) =>
                      handleChangeRole(u.id, e.target.value as UserRole)
                    }
                    className="form-input py-1 text-sm w-auto bg-transparent border-zinc-700"
                    disabled={u.id === user?.id}
                  >
                    <option value="expansion">Expansion</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="text-muted-foreground text-sm">
                  {formatDate(u.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Add New User
              </h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="form-label">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="form-input"
                >
                  <option value="expansion">Expansion</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Remember to also create this user&apos;s Supabase Auth account
                separately.
              </p>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'toast',
            toast.type === 'success' ? 'toast-success' : 'toast-error'
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

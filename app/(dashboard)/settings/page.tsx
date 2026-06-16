'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { EmailContact, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Mail,
  Plus,
  Shield,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'expansion' as User['role'],
    password: '',
  });
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
  });
  const [addError, setAddError] = useState('');
  const [contactError, setContactError] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    async function fetchSettingsData() {
      const [{ data: userData }, { data: contactData }] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('email_contacts')
          .select('*')
          .order('name', { ascending: true }),
      ]);
      if (userData) setUsers(userData as User[]);
      if (contactData) setContacts(contactData as EmailContact[]);
      setLoading(false);
    }
    fetchSettingsData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshContacts = async () => {
    const { data } = await supabase
      .from('email_contacts')
      .select('*')
      .order('name', { ascending: true });

    if (data) setContacts(data as EmailContact[]);
  };

  const handleAddUser = async () => {
    setAddError('');
    if (!newUser.name || !newUser.email || !newUser.password) {
      setAddError('Name, email, and password are required');
      return;
    }
    setSaving(true);

    try {
      // Create auth user via admin API
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const data = await res.json();
        setAddError(data.error || 'Failed to create user');
      } else {
        setShowAdd(false);
        setNewUser({ name: '', email: '', role: 'expansion', password: '' });
        // Refresh users list
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data as User[]);
      }
    } catch {
      setAddError('Failed to create user');
    }
    setSaving(false);
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
  };

  const handleAddContact = async () => {
    setContactError('');
    const name = newContact.name.trim();
    const email = newContact.email.trim().toLowerCase();

    if (!name || !email) {
      setContactError('Name and email are required');
      return;
    }

    if (!emailPattern.test(email)) {
      setContactError('Enter a valid email address');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('email_contacts').insert({
      name,
      email,
      created_by: user?.id,
    });

    if (error) {
      setContactError(error.code === '23505' ? 'This email contact already exists' : error.message);
    } else {
      setNewContact({ name: '', email: '' });
      setShowAddContact(false);
      await refreshContacts();
    }
    setSaving(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    setSaving(true);
    const { error } = await supabase.from('email_contacts').delete().eq('id', contactId);

    if (!error) {
      setContacts(contacts.filter((contact) => contact.id !== contactId));
    }
    setSaving(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">Admin</Badge>;
      case 'finance':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Finance</Badge>;
      case 'expansion':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">Expansion</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Shield className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm mt-1">Only admins can access the settings page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users and application settings
          </p>
        </div>
      </div>

      {/* User Management */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>{users.length} users registered</CardDescription>
            </div>
            <Button onClick={() => setShowAdd(true)} size="sm" className="bg-brand hover:bg-brand-dark">
              <Plus className="mr-1 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Role</TableHead>
                  <TableHead className="text-xs font-semibold">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.id !== user?.id ? (
                        <Select
                          value={u.role}
                          onValueChange={(v) => handleRoleChange(u.id, (v ?? 'expansion') as User['role'])}
                        >
                          <SelectTrigger className="h-8 w-36 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="expansion">Expansion</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Current user</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Email Contacts */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Contacts
              </CardTitle>
              <CardDescription>
                {contacts.length} manual contact(s) available in To/CC suggestions
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddContact(true)} size="sm" className="bg-brand hover:bg-brand-dark">
              <Plus className="mr-1 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              No manual contacts added yet. App users are still suggested automatically.
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Email</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{contact.email}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          disabled={saving}
                          className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                          aria-label={`Remove ${contact.email}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Info */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Application</span>
              <p className="font-medium mt-0.5">KCM Dashboard — Curefoods</p>
            </div>
            <div>
              <span className="text-muted-foreground">Version</span>
              <p className="font-medium mt-0.5">1.0.0</p>
            </div>
            <div>
              <span className="text-muted-foreground">Database</span>
              <p className="font-medium mt-0.5">Supabase (PostgreSQL)</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email Service</span>
              <p className="font-medium mt-0.5">Nodemailer + Gmail</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account with Supabase Auth</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="e.g. priya@curefoods.com"
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: (v ?? 'expansion') as User['role'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="expansion">Expansion</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={saving} className="bg-brand hover:bg-brand-dark">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Email Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Contact</DialogTitle>
            <DialogDescription>Add a non-app recipient to To/CC autocomplete suggestions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="e.g. Sonal"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="e.g. sonal.raj@curefoods.in"
              />
            </div>
            {contactError && <p className="text-sm text-destructive">{contactError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>Cancel</Button>
            <Button onClick={handleAddContact} disabled={saving} className="bg-brand hover:bg-brand-dark">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

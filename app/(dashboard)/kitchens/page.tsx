'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { KitchenMaster } from '@/lib/types';
import { formatDateForEmail } from '@/lib/utils';
import { EmailRecipientSelect, type EmailOption } from '@/components/email-recipient-select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  ChefHat,
  ArrowUpDown,
  Mail,
  Send,
  Eye,
} from 'lucide-react';

const FORMATS = ['Cloud', 'Cloud Kitchen', 'Restaurant', 'Kiosk', 'B2B', 'Franchise'];

type SortOption =
  | 'cluster-asc'
  | 'cluster-desc'
  | 'recently-added'
  | 'first-added'
  | 'brand-asc'
  | 'brand-desc'
  | 'kitchen-asc'
  | 'kitchen-desc';

export default function KitchensPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [kitchens, setKitchens] = useState<KitchenMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('cluster-asc');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<KitchenMaster>>({});
  const [saving, setSaving] = useState(false);

  // Adding state
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({
    cluster_marker: '',
    brand: '',
    kitchen_name: '',
    format: '',
  });
  const [addError, setAddError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<KitchenMaster | null>(null);

  // Closure email workflow
  const [selectedKitchenIds, setSelectedKitchenIds] = useState<string[]>([]);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toEmails, setToEmails] = useState<EmailOption[]>([]);
  const [ccEmails, setCcEmails] = useState<EmailOption[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  const isExpansion = user?.role === 'expansion' || user?.role === 'admin';
  const isFinance = user?.role === 'finance' || user?.role === 'admin';

  const fetchKitchens = useCallback(async () => {
    const { data, error } = await supabase
      .from('kitchen_master')
      .select('*')
      .is('removed_at', null)
      .order('cluster_marker', { ascending: true });

    if (!error && data) {
      setKitchens(data as KitchenMaster[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Existing client-side fetch pattern; this refreshes the table after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKitchens();
  }, [fetchKitchens]);

  const compareText = (a: string | null | undefined, b: string | null | undefined) =>
    (a ?? '').localeCompare(b ?? '', undefined, { numeric: true, sensitivity: 'base' });

  const compareDate = (a: string | null | undefined, b: string | null | undefined) =>
    new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();

  // Filter and sort
  const filtered = kitchens
    .filter((k) => {
      const q = search.toLowerCase();
      const matchesSearch =
        k.cluster_marker?.toLowerCase().includes(q) ||
        k.brand?.toLowerCase().includes(q) ||
        k.kitchen_name?.toLowerCase().includes(q);
      const matchesStatus = filterStatus === 'all' || k.status === filterStatus;
      const matchesFormat = filterFormat === 'all' || k.format === filterFormat;
      return matchesSearch && matchesStatus && matchesFormat;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'cluster-desc':
          return compareText(b.cluster_marker, a.cluster_marker) || compareText(a.brand, b.brand);
        case 'recently-added':
          return compareDate(b.added_at, a.added_at);
        case 'first-added':
          return compareDate(a.added_at, b.added_at);
        case 'brand-asc':
          return compareText(a.brand, b.brand) || compareText(a.cluster_marker, b.cluster_marker);
        case 'brand-desc':
          return compareText(b.brand, a.brand) || compareText(a.cluster_marker, b.cluster_marker);
        case 'kitchen-asc':
          return compareText(a.kitchen_name, b.kitchen_name) || compareText(a.cluster_marker, b.cluster_marker);
        case 'kitchen-desc':
          return compareText(b.kitchen_name, a.kitchen_name) || compareText(a.cluster_marker, b.cluster_marker);
        case 'cluster-asc':
        default:
          return compareText(a.cluster_marker, b.cluster_marker) || compareText(a.brand, b.brand);
      }
    });

  const selectedKitchens = kitchens.filter((k) => selectedKitchenIds.includes(k.id));
  const visibleKitchenIds = filtered.map((k) => k.id);
  const allVisibleSelected =
    visibleKitchenIds.length > 0 && visibleKitchenIds.every((id) => selectedKitchenIds.includes(id));
  const canPreviewEmail = selectedKitchenIds.length > 0 && toEmails.length > 0;

  const toggleKitchenSelection = (kitchenId: string) => {
    setSelectedKitchenIds((prev) =>
      prev.includes(kitchenId) ? prev.filter((id) => id !== kitchenId) : [...prev, kitchenId]
    );
  };

  const toggleVisibleSelection = () => {
    setSelectedKitchenIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleKitchenIds.includes(id));
      }

      return Array.from(new Set([...prev, ...visibleKitchenIds]));
    });
  };

  const openEmailDialog = () => {
    setEmailError('');
    setShowPreview(false);
    setShowEmailDialog(true);
  };

  const handleSendClosureEmail = async () => {
    if (!user || !canPreviewEmail) return;

    setSendingEmail(true);
    setEmailError('');

    try {
      const { data: request, error: requestError } = await supabase
        .from('closure_requests')
        .insert({
          requested_by: user.id,
          status: 'Draft',
          to_emails: toEmails.map((email) => email.value),
          cc_emails: ccEmails.map((email) => email.value),
        })
        .select()
        .single();

      if (requestError || !request) throw requestError ?? new Error('Failed to create closure request');

      const clusterMarkers = Array.from(new Set(selectedKitchens.map((k) => k.cluster_marker)));
      const { error: clusterError } = await supabase.from('closure_request_clusters').insert(
        clusterMarkers.map((clusterMarker) => ({
          request_id: request.id,
          cluster_marker: clusterMarker,
        }))
      );

      if (clusterError) throw clusterError;

      const response = await fetch('/api/send-closure-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmails: toEmails.map((email) => email.value),
          ccEmails: ccEmails.map((email) => email.value),
          senderName: user.name,
          brands: selectedKitchens.map((kitchen) => ({
            cluster_marker: kitchen.cluster_marker,
            brand: kitchen.brand,
            kitchen_name: kitchen.kitchen_name || '',
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send email');
      }

      const { error: updateError } = await supabase
        .from('closure_requests')
        .update({
          status: 'Sent',
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      setShowEmailDialog(false);
      setShowPreview(false);
      setSelectedKitchenIds([]);
      setToEmails([]);
      setCcEmails([]);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to send closure email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Start editing
  const startEdit = (kitchen: KitchenMaster) => {
    setEditingId(kitchen.id);
    setEditData({
      cluster_marker: kitchen.cluster_marker,
      brand: kitchen.brand,
      kitchen_name: kitchen.kitchen_name,
      format: kitchen.format,
      status: kitchen.status,
    });
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await supabase
      .from('kitchen_master')
      .update(editData)
      .eq('id', editingId);

    if (!error) {
      await fetchKitchens();
      setEditingId(null);
    }
    setSaving(false);
  };

  // Add row
  const addRow = async () => {
    setAddError('');
    if (!newRow.cluster_marker || !newRow.brand) {
      setAddError('Cluster marker and brand are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('kitchen_master').insert({
      ...newRow,
      added_by: user?.id,
    });

    if (error) {
      if (error.code === '23505') {
        setAddError('This cluster marker + brand combination already exists');
      } else {
        setAddError(error.message);
      }
    } else {
      setNewRow({ cluster_marker: '', brand: '', kitchen_name: '', format: '' });
      setShowAdd(false);
      await fetchKitchens();
    }
    setSaving(false);
  };

  // Soft delete
  const softDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const { error } = await supabase
      .from('kitchen_master')
      .update({ removed_at: new Date().toISOString() })
      .eq('id', deleteTarget.id);

    if (!error) {
      await fetchKitchens();
    }
    setDeleteTarget(null);
    setSaving(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'Under Closure':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'Closed':
        return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Master</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Master list of all kitchens — {kitchens.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFinance && (
            <Button
              onClick={openEmailDialog}
              disabled={selectedKitchenIds.length === 0}
              variant="outline"
              className="border-brand/30 text-brand hover:bg-brand/5"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Selected ({selectedKitchenIds.length})
            </Button>
          )}
          {isExpansion && (
            <Button onClick={() => setShowAdd(true)} className="bg-brand hover:bg-brand-dark">
              <Plus className="mr-2 h-4 w-4" />
              Add Kitchen
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="kitchen-search"
                placeholder="Search by cluster, brand, or kitchen name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy((v ?? 'cluster-asc') as SortOption)}>
              <SelectTrigger className="w-full lg:w-52">
                <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cluster-asc">Cluster: Ascending</SelectItem>
                <SelectItem value="cluster-desc">Cluster: Descending</SelectItem>
                <SelectItem value="recently-added">Recently Added</SelectItem>
                <SelectItem value="first-added">First Added</SelectItem>
                <SelectItem value="brand-asc">Brand: A to Z</SelectItem>
                <SelectItem value="brand-desc">Brand: Z to A</SelectItem>
                <SelectItem value="kitchen-asc">Kitchen: A to Z</SelectItem>
                <SelectItem value="kitchen-desc">Kitchen: Z to A</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Under Closure">Under Closure</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterFormat} onValueChange={(v) => setFilterFormat(v ?? 'all')}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                {FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {search || filterStatus !== 'all' || filterFormat !== 'all'
                  ? 'No kitchens match your filters'
                  : 'No kitchens added yet'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {isFinance && (
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleVisibleSelection}
                          aria-label="Select all visible kitchens"
                          className="h-4 w-4 rounded border-input accent-brand"
                        />
                      </TableHead>
                    )}
                    {isExpansion && <TableHead className="w-10" />}
                    <TableHead className="text-xs font-semibold">Cluster Marker</TableHead>
                    <TableHead className="text-xs font-semibold">Brand</TableHead>
                    <TableHead className="text-xs font-semibold">Kitchen Name</TableHead>
                    <TableHead className="text-xs font-semibold">Format</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    {isExpansion && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((kitchen) => (
                    <TableRow key={kitchen.id} className="group">
                      {isFinance && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedKitchenIds.includes(kitchen.id)}
                            onChange={() => toggleKitchenSelection(kitchen.id)}
                            aria-label={`Select ${kitchen.brand} in cluster ${kitchen.cluster_marker}`}
                            className="h-4 w-4 rounded border-input accent-brand"
                          />
                        </TableCell>
                      )}
                      {isExpansion && (
                        <TableCell>
                          {editingId === kitchen.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="p-1 rounded hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors"
                                aria-label="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                                aria-label="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(kitchen)}
                              className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-foreground"
                              aria-label="Edit row"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="font-semibold text-brand dark:text-brand-200">
                        {editingId === kitchen.id ? (
                          <Input
                            value={editData.cluster_marker ?? ''}
                            onChange={(e) =>
                              setEditData({ ...editData, cluster_marker: e.target.value })
                            }
                            className="h-8 text-sm"
                          />
                        ) : (
                          kitchen.cluster_marker
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === kitchen.id ? (
                          <Input
                            value={editData.brand ?? ''}
                            onChange={(e) =>
                              setEditData({ ...editData, brand: e.target.value })
                            }
                            className="h-8 text-sm"
                          />
                        ) : (
                          kitchen.brand
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === kitchen.id ? (
                          <Input
                            value={editData.kitchen_name ?? ''}
                            onChange={(e) =>
                              setEditData({ ...editData, kitchen_name: e.target.value })
                            }
                            className="h-8 text-sm"
                          />
                        ) : (
                          kitchen.kitchen_name || '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === kitchen.id ? (
                          <Select
                            value={editData.format ?? ''}
                            onValueChange={(v) => setEditData({ ...editData, format: v ?? '' })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FORMATS.map((f) => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          kitchen.format || '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === kitchen.id ? (
                          <Select
                            value={editData.status ?? 'Active'}
                            onValueChange={(v) => setEditData({ ...editData, status: (v ?? 'Active') as KitchenMaster['status'] })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Under Closure">Under Closure</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getStatusColor(kitchen.status)}>{kitchen.status}</Badge>
                        )}
                      </TableCell>
                      {isExpansion && (
                        <TableCell>
                          {editingId !== kitchen.id && (
                            <button
                              onClick={() => setDeleteTarget(kitchen)}
                              className="p-1 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                              aria-label="Delete row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Kitchen Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Kitchen</DialogTitle>
            <DialogDescription>Add a new kitchen to the master list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Cluster Marker *</label>
                <Input
                  value={newRow.cluster_marker}
                  onChange={(e) => setNewRow({ ...newRow, cluster_marker: e.target.value })}
                  placeholder="e.g. 41"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Brand *</label>
                <Input
                  value={newRow.brand}
                  onChange={(e) => setNewRow({ ...newRow, brand: e.target.value })}
                  placeholder="e.g. MLE"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Kitchen Name</label>
              <Input
                value={newRow.kitchen_name}
                onChange={(e) => setNewRow({ ...newRow, kitchen_name: e.target.value })}
                placeholder="e.g. Brookfield"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Format</label>
              <Select
                value={newRow.format}
                onValueChange={(v) => setNewRow({ ...newRow, format: v ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={addRow} disabled={saving} className="bg-brand hover:bg-brand-dark">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Kitchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Closure Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Closure Email
            </DialogTitle>
            <DialogDescription>
              {selectedKitchens.length} selected kitchen(s) will be included in this email.
            </DialogDescription>
          </DialogHeader>

          {!showPreview ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>To *</Label>
                  <EmailRecipientSelect
                    value={toEmails}
                    onChange={setToEmails}
                    placeholder="Type a name or email..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>CC</Label>
                  <EmailRecipientSelect
                    value={ccEmails}
                    onChange={setCcEmails}
                    placeholder="Type a name or email..."
                  />
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Cluster Marker</TableHead>
                      <TableHead className="text-xs font-semibold">Brand</TableHead>
                      <TableHead className="text-xs font-semibold">Kitchen Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedKitchens.map((kitchen) => (
                      <TableRow key={kitchen.id}>
                        <TableCell className="font-medium">{kitchen.cluster_marker}</TableCell>
                        <TableCell>{kitchen.brand}</TableCell>
                        <TableCell>{kitchen.kitchen_name || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                <div>
                  <strong>Subject:</strong> Kitchen Closure Request — {formatDateForEmail()}
                </div>
                <div>
                  <strong>To:</strong> {toEmails.map((email) => email.value).join(', ')}
                </div>
                {ccEmails.length > 0 && (
                  <div>
                    <strong>CC:</strong> {ccEmails.map((email) => email.value).join(', ')}
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <p className="mb-4">Hi Team,</p>
                <p className="mb-4">Please find below the list of kitchens identified for closure:</p>

                <div className="rounded border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Cluster Marker</TableHead>
                        <TableHead className="text-xs font-semibold">Brand</TableHead>
                        <TableHead className="text-xs font-semibold">Kitchen Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedKitchens.map((kitchen) => (
                        <TableRow key={kitchen.id}>
                          <TableCell className="font-medium">{kitchen.cluster_marker}</TableCell>
                          <TableCell>{kitchen.brand}</TableCell>
                          <TableCell>{kitchen.kitchen_name || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <p className="mt-4">
                  Please review and update the status on the dashboard:{' '}
                  <span className="text-brand underline">
                    {process.env.NEXT_PUBLIC_APP_URL || 'https://kcm.curefoods.com'}
                  </span>
                </p>
                <p className="mt-4">
                  Regards,
                  <br />
                  {user?.name || 'Finance Team'}
                </p>
              </div>
            </div>
          )}

          {emailError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {emailError}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => (showPreview ? setShowPreview(false) : setShowEmailDialog(false))}
            >
              {showPreview ? 'Back' : 'Cancel'}
            </Button>
            {!showPreview ? (
              <Button onClick={() => setShowPreview(true)} disabled={!canPreviewEmail} className="bg-brand hover:bg-brand-dark">
                <Eye className="mr-2 h-4 w-4" />
                Preview Email
              </Button>
            ) : (
              <Button onClick={handleSendClosureEmail} disabled={sendingEmail} className="bg-brand hover:bg-brand-dark">
                {sendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Confirm & Send
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Kitchen</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <strong>
                {deleteTarget?.brand} — Cluster {deleteTarget?.cluster_marker}
              </strong>
              ? This is a soft delete and can be reversed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={softDelete} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

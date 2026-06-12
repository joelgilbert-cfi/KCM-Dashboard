'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { KitchenMaster } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

const FORMATS = ['Cloud', 'Cloud Kitchen', 'Restaurant', 'Kiosk', 'B2B', 'Franchise'];

export default function KitchensPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [kitchens, setKitchens] = useState<KitchenMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');

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

  const isExpansion = user?.role === 'expansion' || user?.role === 'admin';

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
    fetchKitchens();
  }, [fetchKitchens]);

  // Filter
  const filtered = kitchens.filter((k) => {
    const q = search.toLowerCase();
    const matchesSearch =
      k.cluster_marker?.toLowerCase().includes(q) ||
      k.brand?.toLowerCase().includes(q) ||
      k.kitchen_name?.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || k.status === filterStatus;
    const matchesFormat = filterFormat === 'all' || k.format === filterFormat;
    return matchesSearch && matchesStatus && matchesFormat;
  });

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
        {isExpansion && (
          <Button onClick={() => setShowAdd(true)} className="bg-brand hover:bg-brand-dark">
            <Plus className="mr-2 h-4 w-4" />
            Add Kitchen
          </Button>
        )}
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
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
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-40">
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

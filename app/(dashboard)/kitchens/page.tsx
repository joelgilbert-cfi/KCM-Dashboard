'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import {
  Building2,
  Plus,
  Search,
  Filter,
  X,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';
import { cn, getStatusColor } from '@/lib/utils';
import type { Cluster, KitchenFormat } from '@/lib/types';

export default function KitchensPage() {
  const { user } = useUser();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRow, setShowAddRow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('marker-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Form state for new row
  const [newRow, setNewRow] = useState({
    cluster_marker: '',
    brand: '',
    kitchen_name: '',
    format: '' as KitchenFormat | '',
  });

  const supabase = createClient();
  const isExpansion = user?.role === 'expansion' || user?.role === 'admin';

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clusters')
        .select('*')
        .is('removed_at', null)
        .order('cluster_marker', { ascending: true });

      console.log('Supabase fetch result:', { dataLength: data?.length, error });

      if (error) throw error;
      setClusters((data || []) as Cluster[]);
    } catch (err: any) {
      console.error('Error fetching kitchen master data:', JSON.stringify(err, null, 2));
      showToast(err.message || 'Failed to load kitchen master data', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleAddRow(e: React.FormEvent) {
    e.preventDefault();
    if (!isExpansion) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('clusters').insert({
        cluster_marker: newRow.cluster_marker,
        brand: newRow.brand || null,
        kitchen_name: newRow.kitchen_name || null,
        format: (newRow.format as KitchenFormat) || null,
        added_by: user?.id,
      });

      if (error) throw error;
      
      showToast('Row added successfully', 'success');
      setShowAddRow(false);
      setNewRow({
        cluster_marker: '',
        brand: '',
        kitchen_name: '',
        format: '',
      });
      fetchClusters();
    } catch (err) {
      console.error('Error adding row:', err);
      showToast('Failed to add row', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSoftDeleteRow(id: string) {
    if (!isExpansion) return;

    try {
      const { error } = await supabase
        .from('clusters')
        .update({ removed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      showToast('Row removed', 'success');
      fetchClusters();
    } catch (err) {
      console.error('Error removing row:', err);
      showToast('Failed to remove row', 'error');
    }
  }

  const filteredClusters = clusters
    .filter((row) => {
      const matchesSearch =
        !searchQuery ||
        row.cluster_marker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.kitchen_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'marker-asc') {
        return a.cluster_marker.localeCompare(b.cluster_marker, undefined, { numeric: true });
      } else if (sortBy === 'marker-desc') {
        return b.cluster_marker.localeCompare(a.cluster_marker, undefined, { numeric: true });
      } else if (sortBy === 'date-desc') {
        return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.added_at).getTime() - new Date(b.added_at).getTime();
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="h-[600px] skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kitchen Master</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Master list of all kitchens and brands
          </p>
        </div>

        {isExpansion && (
          <button
            onClick={() => setShowAddRow(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        )}
      </div>

      {/* Add Row Modal */}
      {showAddRow && (
        <div className="modal-overlay" onClick={() => setShowAddRow(false)}>
          <div
            className="modal-content p-6 max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Add New Kitchen
              </h2>
              <button
                onClick={() => setShowAddRow(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRow} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Cluster Marker <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={newRow.cluster_marker}
                    onChange={(e) =>
                      setNewRow({ ...newRow, cluster_marker: e.target.value })
                    }
                    placeholder="e.g. 41, A135"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Brand</label>
                  <input
                    value={newRow.brand}
                    onChange={(e) =>
                      setNewRow({ ...newRow, brand: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. MLE, KK"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Kitchen Name</label>
                  <input
                    value={newRow.kitchen_name}
                    onChange={(e) =>
                      setNewRow({ ...newRow, kitchen_name: e.target.value })
                    }
                    placeholder="e.g. Hoodi, Whitefield"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Format</label>
                  <select
                    value={newRow.format}
                    onChange={(e) =>
                      setNewRow({
                        ...newRow,
                        format: e.target.value as KitchenFormat | '',
                      })
                    }
                    className="form-input"
                  >
                    <option value="">Select format</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Cloud Kitchen">Cloud Kitchen</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Takeaway">Takeaway</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddRow(false)}
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
                  Add Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-foreground">
              Kitchens List
            </h2>
            <span className="badge bg-secondary text-muted-foreground border-zinc-700">
              {filteredClusters.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="form-input pl-9 py-2 text-sm w-full sm:w-[240px]"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input py-2 text-sm w-auto bg-card/50"
            >
              <option value="marker-asc">Sort: Marker (A-Z)</option>
              <option value="marker-desc">Sort: Marker (Z-A)</option>
              <option value="date-desc">Sort: Recently Added</option>
              <option value="date-asc">Sort: First Added</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'btn btn-secondary btn-sm h-[38px]',
                showFilters &&
                  'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-5 py-3 border-b border-border/50 flex gap-4 bg-card/50">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input py-1.5 text-sm w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Closure">Under Closure</option>
              <option value="Closed">Closed</option>
            </select>

          </div>
        )}

        {/* Flat data table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cluster Marker</th>
                <th>Brand</th>
                <th>Kitchen Name</th>
                <th>Format</th>
                <th>Status</th>
                {isExpansion && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filteredClusters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    No data found
                  </td>
                </tr>
              ) : (
                filteredClusters.map((row) => (
                  <tr key={row.id}>
                    <td className="font-semibold text-foreground">
                      {row.cluster_marker}
                    </td>
                    <td>
                      <span className="font-medium text-indigo-400">
                        {row.brand || '—'}
                      </span>
                    </td>
                    <td>{row.kitchen_name || '—'}</td>
                    <td>{row.format || '—'}</td>
                    <td>
                      <span className={cn('badge', getStatusColor(row.status))}>
                        {row.status}
                      </span>
                    </td>
                    {isExpansion && (
                      <td className="w-10">
                        <button
                          onClick={() => {
                            if (confirm('Remove this row?')) {
                              handleSoftDeleteRow(row.id);
                            }
                          }}
                          className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast notification */}
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

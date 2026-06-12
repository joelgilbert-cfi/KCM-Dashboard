'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  Calendar,
  DollarSign,
  Shield,
  Clock,
  FileText,
  Package,
  Truck,
  ShoppingCart,
  ScrollText,
} from 'lucide-react';
import {
  cn,
  formatDate,
  formatCurrency,
  getStatusColor,
  getProgressColor,
  getConditionColor,
} from '@/lib/utils';
import type {
  Cluster,
  Kitchen,
  ClosureTracker,
  FixedAsset,
  AssetMovement,
  AssetSale,
  AuditLogEntry,
  ClusterStatus,
  ClosureProgress,
  LockInStatus,
} from '@/lib/types';

type TabType = 'overview' | 'assets' | 'movements' | 'sales' | 'audit';

export default function ClusterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const clusterId = params.id as string;

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [tracker, setTracker] = useState<ClosureTracker | null>(null);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [sales, setSales] = useState<AssetSale[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Editable form state for closure tracker
  const [formData, setFormData] = useState<Partial<ClosureTracker>>({});

  const supabase = createClient();
  const isExpansion = user?.role === 'expansion' || user?.role === 'admin';

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch cluster
      const { data: clusterData } = await supabase
        .from('clusters')
        .select('*')
        .eq('id', clusterId)
        .single();
      setCluster(clusterData);

      // Fetch kitchens
      const { data: kitchenData } = await supabase
        .from('kitchens')
        .select('*')
        .eq('cluster_id', clusterId)
        .is('removed_at', null);
      setKitchens(kitchenData || []);

      // Fetch closure tracker
      const { data: trackerData } = await supabase
        .from('closure_tracker')
        .select('*')
        .eq('cluster_id', clusterId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setTracker(trackerData);
      if (trackerData) {
        setFormData(trackerData);
      }

      // Fetch assets for all kitchens in this cluster
      const kitchenIds = (kitchenData || []).map((k: Kitchen) => k.id);
      if (kitchenIds.length > 0) {
        const { data: assetData } = await supabase
          .from('fixed_asset_register')
          .select('*')
          .in('kitchen_id', kitchenIds);
        setAssets(assetData || []);

        const { data: movementData } = await supabase
          .from('asset_movements')
          .select('*, fixed_asset_register(*)')
          .in('kitchen_id', kitchenIds)
          .order('movement_date', { ascending: false });
        setMovements(movementData || []);

        const { data: saleData } = await supabase
          .from('asset_sales')
          .select('*, fixed_asset_register(*)')
          .in('kitchen_id', kitchenIds)
          .order('sale_date', { ascending: false });
        setSales(saleData || []);
      }

      // Fetch audit logs for this cluster
      const { data: auditData } = await supabase
        .from('audit_log')
        .select('*')
        .eq('record_id', clusterId)
        .order('changed_at', { ascending: false })
        .limit(50);
      setAuditLogs(auditData || []);
    } catch (err) {
      console.error('Error fetching cluster data:', err);
    } finally {
      setLoading(false);
    }
  }, [clusterId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSaveTracker(e: React.FormEvent) {
    e.preventDefault();
    if (!isExpansion) return;
    setSaving(true);

    try {
      const payload = {
        cluster_id: clusterId,
        ops_closed: formData.ops_closed || false,
        last_ops_date: formData.last_ops_date || null,
        last_rent_date: formData.last_rent_date || null,
        ll_clearance: formData.ll_clearance ?? null,
        lock_in: (formData.lock_in as LockInStatus) || null,
        lock_in_end_date: formData.lock_in_end_date || null,
        sd: formData.sd ? Number(formData.sd) : null,
        sd_adjustment: formData.sd_adjustment ? Number(formData.sd_adjustment) : null,
        sd_recovery: formData.sd_recovery ? Number(formData.sd_recovery) : null,
        notice_period: formData.notice_period || null,
        dec_net_revenue: formData.dec_net_revenue ? Number(formData.dec_net_revenue) : null,
        dec_ebitda: formData.dec_ebitda ? Number(formData.dec_ebitda) : null,
        rental_hit_lock_in: formData.rental_hit_lock_in ? Number(formData.rental_hit_lock_in) : null,
        capex: formData.capex ? Number(formData.capex) : null,
        framework: formData.framework ? Number(formData.framework) : null,
        closure_phasing: formData.closure_phasing ? Number(formData.closure_phasing) : null,
        hr_remarks: formData.hr_remarks || null,
        remarks: formData.remarks || null,
        on_hold: formData.on_hold || false,
        progress: (formData.progress as ClosureProgress) || null,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (tracker?.id) {
        // Update existing
        const { error } = await supabase
          .from('closure_tracker')
          .update(payload)
          .eq('id', tracker.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('closure_tracker')
          .insert(payload);
        if (error) throw error;
      }

      // Also update cluster status based on progress
      if (formData.progress === 'Completed') {
        await supabase
          .from('clusters')
          .update({ status: 'Closed' as ClusterStatus })
          .eq('id', clusterId);
      } else if (formData.progress) {
        await supabase
          .from('clusters')
          .update({ status: 'Under Closure' as ClusterStatus })
          .eq('id', clusterId);
      }

      showToast('Closure tracker updated successfully', 'success');
      fetchData();
    } catch (err) {
      console.error('Error saving tracker:', err);
      showToast('Failed to update closure tracker', 'error');
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { key: 'overview' as TabType, label: 'Overview', icon: FileText },
    { key: 'assets' as TabType, label: 'Assets', icon: Package },
    { key: 'movements' as TabType, label: 'Movements', icon: Truck },
    { key: 'sales' as TabType, label: 'Sales', icon: ShoppingCart },
    { key: 'audit' as TabType, label: 'Audit Log', icon: ScrollText },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton" />
        <div className="h-48 skeleton rounded-xl" />
        <div className="h-96 skeleton rounded-xl" />
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Cluster not found
        </h2>
        <button onClick={() => router.back()} className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm mb-3 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            Cluster {cluster.cluster_marker}
            <span className={cn('badge text-sm', getStatusColor(cluster.status))}>
              {cluster.status}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cluster.ops_name || cluster.finance_name || 'Unnamed'} •{' '}
            {cluster.city || 'No city'} • {cluster.zone || 'No zone'}
          </p>
        </div>
      </div>

      {/* Cluster info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Rent</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(cluster.rent)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Format</p>
          <p className="text-lg font-semibold text-foreground">
            {cluster.format || '—'}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Brands</p>
          <p className="text-lg font-semibold text-foreground">
            {kitchens.length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Oracle Code</p>
          <p className="text-lg font-semibold text-foreground">
            {cluster.oracle_code || '—'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-list">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'tab-trigger flex items-center gap-2',
                activeTab === tab.key && 'active'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Closure tracker form — 2 columns */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Closure Tracker
              </h3>
              {tracker && (
                <span className="text-xs text-muted-foreground">
                  Last updated {formatDate(tracker.updated_at, 'dd MMM yyyy HH:mm')}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveTracker} className="space-y-5">
              {/* Status row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Progress</label>
                  <select
                    value={formData.progress || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        progress: e.target.value as ClosureProgress || null,
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  >
                    <option value="">Not Started</option>
                    <option value="Initiated">Initiated</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label flex items-center gap-2">
                    Ops Closed
                  </label>
                  <select
                    value={formData.ops_closed ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ops_closed: e.target.value === 'true',
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="form-label flex items-center gap-2">
                    On Hold
                  </label>
                  <select
                    value={formData.on_hold ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        on_hold: e.target.value === 'true',
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Last Ops Date</label>
                  <input
                    type="date"
                    value={formData.last_ops_date || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, last_ops_date: e.target.value })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Last Rent Date</label>
                  <input
                    type="date"
                    value={formData.last_rent_date || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, last_rent_date: e.target.value })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Notice Period</label>
                  <input
                    type="text"
                    value={formData.notice_period || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, notice_period: e.target.value })
                    }
                    disabled={!isExpansion}
                    placeholder="e.g. 60 days"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Landlord + Lock-in */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">LL Clearance</label>
                  <select
                    value={
                      formData.ll_clearance === null || formData.ll_clearance === undefined
                        ? ''
                        : formData.ll_clearance
                        ? 'true'
                        : 'false'
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ll_clearance:
                          e.target.value === '' ? null : e.target.value === 'true',
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  >
                    <option value="">Not set</option>
                    <option value="true">Cleared</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Lock-in</label>
                  <select
                    value={formData.lock_in || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lock_in: (e.target.value as LockInStatus) || null,
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  >
                    <option value="">Not set</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Lock-in End Date</label>
                  <input
                    type="date"
                    value={formData.lock_in_end_date || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lock_in_end_date: e.target.value,
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Financial fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Security Deposit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sd ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, sd: Number(e.target.value) })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">SD Adjustment (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sd_adjustment ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sd_adjustment: Number(e.target.value),
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">SD Recovery (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sd_recovery ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sd_recovery: Number(e.target.value),
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
              </div>

              {/* More financial fields */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Dec Net Revenue</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dec_net_revenue ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dec_net_revenue: Number(e.target.value),
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Dec EBITDA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dec_ebitda ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dec_ebitda: Number(e.target.value),
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Rental Hit Lock-in</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rental_hit_lock_in ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rental_hit_lock_in: Number(e.target.value),
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Capex</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.capex ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capex: Number(e.target.value),
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Framework + Phasing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Framework</label>
                  <input
                    type="number"
                    value={formData.framework ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        framework: Number(e.target.value),
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Closure Phasing</label>
                  <input
                    type="number"
                    value={formData.closure_phasing ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        closure_phasing: Number(e.target.value),
                      })
                    }
                    disabled={!isExpansion}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">HR Remarks</label>
                  <textarea
                    value={formData.hr_remarks || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, hr_remarks: e.target.value })
                    }
                    disabled={!isExpansion}
                    rows={3}
                    className="form-input resize-none"
                  />
                </div>
                <div>
                  <label className="form-label">Remarks</label>
                  <textarea
                    value={formData.remarks || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    disabled={!isExpansion}
                    rows={3}
                    className="form-input resize-none"
                  />
                </div>
              </div>

              {isExpansion && (
                <div className="flex justify-end pt-2">
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
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Brand list — 1 column */}
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Brands ({kitchens.length})
            </h3>
            <div className="space-y-2">
              {kitchens.map((kitchen) => (
                <div
                  key={kitchen.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {kitchen.brand.slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {kitchen.brand}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'badge text-[11px]',
                      getStatusColor(kitchen.status)
                    )}
                  >
                    {kitchen.status}
                  </span>
                </div>
              ))}
              {kitchens.length === 0 && (
                <p className="text-sm text-zinc-600 text-center py-4">
                  No brands in this cluster
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              Fixed Assets ({assets.length})
            </h3>
          </div>
          {assets.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No assets registered</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th>Condition</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="font-medium text-foreground">
                      {asset.asset_name}
                    </td>
                    <td>{asset.category || '—'}</td>
                    <td>{formatCurrency(asset.value)}</td>
                    <td>
                      <span
                        className={cn(
                          'badge',
                          getConditionColor(asset.condition)
                        )}
                      >
                        {asset.condition || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary text-muted-foreground border-zinc-700">
                        {asset.current_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              Asset Movements ({movements.length})
            </h3>
          </div>
          {movements.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No movements recorded</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Moved To</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-foreground">
                      {(m as unknown as { fixed_asset_register: FixedAsset })
                        .fixed_asset_register?.asset_name || '—'}
                    </td>
                    <td>{m.moved_to}</td>
                    <td>{formatDate(m.movement_date)}</td>
                    <td className="text-muted-foreground text-sm">
                      {m.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-400" />
              Asset Sales ({sales.length})
            </h3>
          </div>
          {sales.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No sales recorded</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Buyer</th>
                  <th>Sale Price</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-foreground">
                      {(s as unknown as { fixed_asset_register: FixedAsset })
                        .fixed_asset_register?.asset_name || '—'}
                    </td>
                    <td>{s.buyer || '—'}</td>
                    <td>{formatCurrency(s.sale_price)}</td>
                    <td>{formatDate(s.sale_date)}</td>
                    <td className="text-muted-foreground text-sm">
                      {s.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-indigo-400" />
              Audit Log
            </h3>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <ScrollText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No audit entries</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Action</th>
                  <th>Changed At</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-medium text-foreground">
                      {log.table_name}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'badge',
                          log.action === 'INSERT'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : log.action === 'DELETE'
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>{formatDate(log.changed_at, 'dd MMM yyyy HH:mm')}</td>
                    <td className="text-xs text-muted-foreground max-w-xs truncate">
                      {log.new_data
                        ? JSON.stringify(log.new_data).slice(0, 100) + '...'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

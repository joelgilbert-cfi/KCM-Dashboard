'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import {
  Package,
  Plus,
  Truck,
  ShoppingCart,
  Search,
  Filter,
  X,
  Save,
  Loader2,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  cn,
  formatDate,
  formatCurrency,
  getConditionColor,
  getStatusColor,
} from '@/lib/utils';
import type {
  FixedAsset,
  AssetMovement,
  AssetSale,
  Kitchen,
  Cluster,
  AssetCondition,
  AssetStatus,
} from '@/lib/types';

type TabType = 'far' | 'movements' | 'sales';

interface AssetWithKitchen extends FixedAsset {
  kitchens: Kitchen & { clusters: Cluster };
}

interface MovementWithDetails extends AssetMovement {
  fixed_asset_register: FixedAsset;
  kitchens: Kitchen & { clusters: Cluster };
}

interface SaleWithDetails extends AssetSale {
  fixed_asset_register: FixedAsset;
  kitchens: Kitchen & { clusters: Cluster };
}

export default function AssetsPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabType>('far');
  const [assets, setAssets] = useState<AssetWithKitchen[]>([]);
  const [movements, setMovements] = useState<MovementWithDetails[]>([]);
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [kitchens, setKitchens] = useState<
    (Kitchen & { clusters: Cluster })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Form states
  const [newAsset, setNewAsset] = useState({
    kitchen_id: '',
    asset_name: '',
    category: '',
    purchase_date: '',
    value: '',
    condition: '' as AssetCondition | '',
  });

  const [newMovement, setNewMovement] = useState({
    asset_id: '',
    kitchen_id: '',
    moved_to: '',
    movement_date: '',
    notes: '',
  });

  const [newSale, setNewSale] = useState({
    asset_id: '',
    kitchen_id: '',
    sale_price: '',
    buyer: '',
    sale_date: '',
    notes: '',
  });

  const isFinance = user?.role === 'finance' || user?.role === 'admin';
  const isExpansion = user?.role === 'expansion' || user?.role === 'admin';

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch kitchens with cluster info for dropdowns
      const { data: kitchenData } = await supabase
        .from('kitchens')
        .select('*, clusters(*)')
        .is('removed_at', null)
        .order('brand', { ascending: true });
      setKitchens(
        (kitchenData || []) as (Kitchen & { clusters: Cluster })[]
      );

      // Fetch assets
      const { data: assetData } = await supabase
        .from('fixed_asset_register')
        .select('*, kitchens(*, clusters(*))')
        .order('asset_name', { ascending: true });
      setAssets((assetData || []) as AssetWithKitchen[]);

      // Fetch movements
      const { data: movementData } = await supabase
        .from('asset_movements')
        .select('*, fixed_asset_register(*), kitchens(*, clusters(*))')
        .order('movement_date', { ascending: false });
      setMovements((movementData || []) as MovementWithDetails[]);

      // Fetch sales
      const { data: saleData } = await supabase
        .from('asset_sales')
        .select('*, fixed_asset_register(*), kitchens(*, clusters(*))')
        .order('sale_date', { ascending: false });
      setSales((saleData || []) as SaleWithDetails[]);
    } catch (err) {
      console.error('Error fetching assets data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!isFinance) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('fixed_asset_register').insert({
        kitchen_id: newAsset.kitchen_id,
        asset_name: newAsset.asset_name,
        category: newAsset.category || null,
        purchase_date: newAsset.purchase_date || null,
        value: newAsset.value ? parseFloat(newAsset.value) : null,
        condition: (newAsset.condition as AssetCondition) || null,
      });

      if (error) throw error;
      showToast('Asset added successfully', 'success');
      setShowAddAsset(false);
      setNewAsset({
        kitchen_id: '',
        asset_name: '',
        category: '',
        purchase_date: '',
        value: '',
        condition: '',
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to add asset', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!isExpansion) return;
    setSaving(true);

    try {
      const asset = assets.find((a) => a.id === newMovement.asset_id);
      const { error } = await supabase.from('asset_movements').insert({
        asset_id: newMovement.asset_id,
        kitchen_id: asset?.kitchen_id || newMovement.kitchen_id,
        moved_to: newMovement.moved_to,
        movement_date: newMovement.movement_date,
        notes: newMovement.notes || null,
        logged_by: user?.id,
      });

      if (error) throw error;
      showToast('Movement logged successfully', 'success');
      setShowAddMovement(false);
      setNewMovement({
        asset_id: '',
        kitchen_id: '',
        moved_to: '',
        movement_date: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to log movement', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSale(e: React.FormEvent) {
    e.preventDefault();
    if (!isExpansion) return;
    setSaving(true);

    try {
      const asset = assets.find((a) => a.id === newSale.asset_id);
      const { error } = await supabase.from('asset_sales').insert({
        asset_id: newSale.asset_id,
        kitchen_id: asset?.kitchen_id || newSale.kitchen_id,
        sale_price: newSale.sale_price
          ? parseFloat(newSale.sale_price)
          : null,
        buyer: newSale.buyer || null,
        sale_date: newSale.sale_date,
        notes: newSale.notes || null,
        logged_by: user?.id,
      });

      if (error) throw error;
      showToast('Sale logged successfully', 'success');
      setShowAddSale(false);
      setNewSale({
        asset_id: '',
        kitchen_id: '',
        sale_price: '',
        buyer: '',
        sale_date: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to log sale', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAsset(id: string) {
    if (!isFinance) return;
    try {
      const { error } = await supabase
        .from('fixed_asset_register')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('Asset deleted', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete asset', 'error');
    }
  }

  // Filter assets based on search
  const filteredAssets = assets.filter(
    (a) =>
      !searchQuery ||
      a.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.kitchens?.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.kitchens?.clusters?.cluster_marker
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Available assets for movement/sale (only In Kitchen status)
  const availableAssets = assets.filter(
    (a) => a.current_status === 'In Kitchen'
  );

  const tabs = [
    { key: 'far' as TabType, label: 'Fixed Asset Register', icon: Package },
    { key: 'movements' as TabType, label: 'Movements', icon: Truck },
    { key: 'sales' as TabType, label: 'Sales', icon: ShoppingCart },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="h-96 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fixed Asset Register, movements, and sales
          </p>
        </div>

        {activeTab === 'far' && isFinance && (
          <button
            onClick={() => setShowAddAsset(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        )}
        {activeTab === 'movements' && isExpansion && (
          <button
            onClick={() => setShowAddMovement(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Log Movement
          </button>
        )}
        {activeTab === 'sales' && isExpansion && (
          <button
            onClick={() => setShowAddSale(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Log Sale
          </button>
        )}
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

      {/* FAR Tab */}
      {activeTab === 'far' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-foreground">
                All Assets
              </h2>
              <span className="badge bg-secondary text-muted-foreground border-zinc-700">
                {filteredAssets.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="form-input pl-9 py-2 text-sm w-[200px]"
              />
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No assets found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Cluster / Brand</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th>Condition</th>
                  <th>Status</th>
                  {isFinance && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="font-medium text-foreground">
                      {asset.asset_name}
                    </td>
                    <td>
                      <span className="text-foreground">
                        {asset.kitchens?.clusters?.cluster_marker || '?'}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        / {asset.kitchens?.brand || '?'}
                      </span>
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
                    {isFinance && (
                      <td>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Delete asset "${asset.asset_name}"?`
                              )
                            ) {
                              handleDeleteAsset(asset.id);
                            }
                          }}
                          className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-foreground">
                Asset Movements
              </h2>
              <span className="badge bg-secondary text-muted-foreground border-zinc-700">
                {movements.length}
              </span>
            </div>
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
                  <th>From (Cluster / Brand)</th>
                  <th>Moved To</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-foreground">
                      {m.fixed_asset_register?.asset_name || '—'}
                    </td>
                    <td>
                      {m.kitchens?.clusters?.cluster_marker || '?'} /{' '}
                      {m.kitchens?.brand || '?'}
                    </td>
                    <td>{m.moved_to}</td>
                    <td>{formatDate(m.movement_date)}</td>
                    <td className="text-muted-foreground text-sm max-w-xs truncate">
                      {m.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-foreground">
                Asset Sales
              </h2>
              <span className="badge bg-secondary text-muted-foreground border-zinc-700">
                {sales.length}
              </span>
            </div>
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
                  <th>Cluster / Brand</th>
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
                      {s.fixed_asset_register?.asset_name || '—'}
                    </td>
                    <td>
                      {s.kitchens?.clusters?.cluster_marker || '?'} /{' '}
                      {s.kitchens?.brand || '?'}
                    </td>
                    <td>{s.buyer || '—'}</td>
                    <td>{formatCurrency(s.sale_price)}</td>
                    <td>{formatDate(s.sale_date)}</td>
                    <td className="text-muted-foreground text-sm max-w-xs truncate">
                      {s.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddAsset && (
        <div className="modal-overlay" onClick={() => setShowAddAsset(false)}>
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Add New Asset
              </h2>
              <button
                onClick={() => setShowAddAsset(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="form-label">
                  Kitchen (Brand) <span className="text-red-400">*</span>
                </label>
                <select
                  value={newAsset.kitchen_id}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, kitchen_id: e.target.value })
                  }
                  className="form-input"
                  required
                >
                  <option value="">Select kitchen...</option>
                  {kitchens.map((k) => (
                    <option key={k.id} value={k.id}>
                      Cluster {k.clusters?.cluster_marker} — {k.brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">
                  Asset Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={newAsset.asset_name}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, asset_name: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <input
                    value={newAsset.category}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, category: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Condition</label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        condition: e.target.value as AssetCondition | '',
                      })
                    }
                    className="form-input"
                  >
                    <option value="">Select...</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    value={newAsset.purchase_date}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        purchase_date: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAsset.value}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, value: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAsset(false)}
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
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Movement Modal */}
      {showAddMovement && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddMovement(false)}
        >
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Log Asset Movement
              </h2>
              <button
                onClick={() => setShowAddMovement(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-4">
              <div>
                <label className="form-label">
                  Asset <span className="text-red-400">*</span>
                </label>
                <select
                  value={newMovement.asset_id}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      asset_id: e.target.value,
                    })
                  }
                  className="form-input"
                  required
                >
                  <option value="">Select asset...</option>
                  {availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_name} (
                      {a.kitchens?.clusters?.cluster_marker} /{' '}
                      {a.kitchens?.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">
                  Warehouse Destination <span className="text-red-400">*</span>
                </label>
                <input
                  value={newMovement.moved_to}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      moved_to: e.target.value,
                    })
                  }
                  placeholder="e.g. Whitefield Warehouse"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Movement Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={newMovement.movement_date}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      movement_date: e.target.value,
                    })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={newMovement.notes}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                  className="form-input resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMovement(false)}
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
                    <Truck className="w-4 h-4" />
                  )}
                  Log Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sale Modal */}
      {showAddSale && (
        <div className="modal-overlay" onClick={() => setShowAddSale(false)}>
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Log Asset Sale
              </h2>
              <button
                onClick={() => setShowAddSale(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSale} className="space-y-4">
              <div>
                <label className="form-label">
                  Asset <span className="text-red-400">*</span>
                </label>
                <select
                  value={newSale.asset_id}
                  onChange={(e) =>
                    setNewSale({ ...newSale, asset_id: e.target.value })
                  }
                  className="form-input"
                  required
                >
                  <option value="">Select asset...</option>
                  {availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_name} (
                      {a.kitchens?.clusters?.cluster_marker} /{' '}
                      {a.kitchens?.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Buyer</label>
                  <input
                    value={newSale.buyer}
                    onChange={(e) =>
                      setNewSale({ ...newSale, buyer: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Sale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSale.sale_price}
                    onChange={(e) =>
                      setNewSale({
                        ...newSale,
                        sale_price: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">
                  Sale Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={newSale.sale_date}
                  onChange={(e) =>
                    setNewSale({ ...newSale, sale_date: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={newSale.notes}
                  onChange={(e) =>
                    setNewSale({ ...newSale, notes: e.target.value })
                  }
                  rows={2}
                  className="form-input resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSale(false)}
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
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  Log Sale
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

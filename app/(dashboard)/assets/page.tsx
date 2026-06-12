'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { FixedAssetRegister, AssetMovement, AssetSale, KitchenMaster } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Plus,
  Package,
  Search,
  Truck,
  DollarSign,
  ClipboardList,
} from 'lucide-react';

export default function AssetsPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [farAssets, setFarAssets] = useState<FixedAssetRegister[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [sales, setSales] = useState<AssetSale[]>([]);
  const [kitchens, setKitchens] = useState<KitchenMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add modals
  const [showAddFar, setShowAddFar] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  const [saving, setSaving] = useState(false);

  // New FAR entry
  const [newFar, setNewFar] = useState({
    kitchen_id: '',
    asset_name: '',
    category: '',
    purchase_date: '',
    value: '',
    condition: 'Good' as const,
  });

  // New Movement entry
  const [newMovement, setNewMovement] = useState({
    from_location: '',
    from_oracle_code: '',
    to_location: '',
    to_oracle_code: '',
    item_name: '',
    quantity: '',
    movement_date: '',
    asset_id: '',
    kitchen_id: '',
  });

  // New Sale entry
  const [newSale, setNewSale] = useState({
    item_name: '',
    quantity: '',
    sale_price: '',
    buyer: '',
    sale_date: '',
    notes: '',
    asset_id: '',
    kitchen_id: '',
  });

  const isFinance = user?.role === 'finance' || user?.role === 'admin';
  const isExpansion = user?.role === 'expansion' || user?.role === 'admin';

  useEffect(() => {
    async function fetchAll() {
      const [farRes, movRes, saleRes, kitchenRes] = await Promise.all([
        supabase.from('fixed_asset_register').select('*').order('created_at', { ascending: false }),
        supabase.from('asset_movements').select('*').order('created_at', { ascending: false }),
        supabase.from('asset_sales').select('*').order('created_at', { ascending: false }),
        supabase.from('kitchen_master').select('*').is('removed_at', null).order('cluster_marker'),
      ]);

      if (farRes.data) setFarAssets(farRes.data as FixedAssetRegister[]);
      if (movRes.data) setMovements(movRes.data as AssetMovement[]);
      if (saleRes.data) setSales(saleRes.data as AssetSale[]);
      if (kitchenRes.data) setKitchens(kitchenRes.data as KitchenMaster[]);
      setLoading(false);
    }
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFarAsset = async () => {
    setSaving(true);
    const { error } = await supabase.from('fixed_asset_register').insert({
      kitchen_id: newFar.kitchen_id,
      asset_name: newFar.asset_name,
      category: newFar.category || null,
      purchase_date: newFar.purchase_date || null,
      value: newFar.value ? parseFloat(newFar.value) : null,
      condition: newFar.condition,
    });
    if (!error) {
      setShowAddFar(false);
      setNewFar({ kitchen_id: '', asset_name: '', category: '', purchase_date: '', value: '', condition: 'Good' });
      const { data } = await supabase.from('fixed_asset_register').select('*').order('created_at', { ascending: false });
      if (data) setFarAssets(data as FixedAssetRegister[]);
    }
    setSaving(false);
  };

  const addMovement = async () => {
    setSaving(true);
    const { error } = await supabase.from('asset_movements').insert({
      ...newMovement,
      quantity: newMovement.quantity ? parseFloat(newMovement.quantity) : null,
      asset_id: newMovement.asset_id || null,
      kitchen_id: newMovement.kitchen_id || null,
      logged_by: user?.id,
    });
    if (!error) {
      // Update FAR status if asset_id is provided
      if (newMovement.asset_id) {
        await supabase.from('fixed_asset_register').update({ current_status: 'Moved to Warehouse' }).eq('id', newMovement.asset_id);
      }
      setShowAddMovement(false);
      setNewMovement({ from_location: '', from_oracle_code: '', to_location: '', to_oracle_code: '', item_name: '', quantity: '', movement_date: '', asset_id: '', kitchen_id: '' });
      const { data } = await supabase.from('asset_movements').select('*').order('created_at', { ascending: false });
      if (data) setMovements(data as AssetMovement[]);
    }
    setSaving(false);
  };

  const addSale = async () => {
    setSaving(true);
    const { error } = await supabase.from('asset_sales').insert({
      ...newSale,
      quantity: newSale.quantity ? parseFloat(newSale.quantity) : null,
      sale_price: newSale.sale_price ? parseFloat(newSale.sale_price) : null,
      asset_id: newSale.asset_id || null,
      kitchen_id: newSale.kitchen_id || null,
      logged_by: user?.id,
    });
    if (!error) {
      if (newSale.asset_id) {
        await supabase.from('fixed_asset_register').update({ current_status: 'Sold' }).eq('id', newSale.asset_id);
      }
      setShowAddSale(false);
      setNewSale({ item_name: '', quantity: '', sale_price: '', buyer: '', sale_date: '', notes: '', asset_id: '', kitchen_id: '' });
      const { data } = await supabase.from('asset_sales').select('*').order('created_at', { ascending: false });
      if (data) setSales(data as AssetSale[]);
    }
    setSaving(false);
  };

  const getConditionColor = (condition: string | null) => {
    switch (condition) {
      case 'Good': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
      case 'Fair': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
      case 'Poor': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
      case 'Damaged': return 'bg-red-500/15 text-red-700 dark:text-red-400';
      default: return '';
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage fixed assets, movements, and sales
        </p>
      </div>

      <Tabs defaultValue="far" className="space-y-4">
        <TabsList>
          <TabsTrigger value="far" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            FAR ({farAssets.length})
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <Truck className="h-4 w-4" />
            Movements ({movements.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Sales ({sales.length})
          </TabsTrigger>
        </TabsList>

        {/* FAR Tab */}
        <TabsContent value="far">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">Fixed Asset Register</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assets..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 w-60"
                    />
                  </div>
                  {isFinance && (
                    <Button onClick={() => setShowAddFar(true)} size="sm" className="bg-brand hover:bg-brand-dark">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Asset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {farAssets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No assets in the register yet</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Asset Name</TableHead>
                        <TableHead className="text-xs font-semibold">Category</TableHead>
                        <TableHead className="text-xs font-semibold">Value</TableHead>
                        <TableHead className="text-xs font-semibold">Condition</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Purchase Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farAssets
                        .filter((a) => !search || a.asset_name?.toLowerCase().includes(search.toLowerCase()))
                        .map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.asset_name}</TableCell>
                            <TableCell>{asset.category || '—'}</TableCell>
                            <TableCell className="tabular-nums">{formatCurrency(asset.value)}</TableCell>
                            <TableCell>
                              {asset.condition && (
                                <Badge className={getConditionColor(asset.condition)}>{asset.condition}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{asset.current_status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(asset.purchase_date)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Asset Movements</CardTitle>
                {isExpansion && (
                  <Button onClick={() => setShowAddMovement(true)} size="sm" className="bg-brand hover:bg-brand-dark">
                    <Plus className="mr-1 h-4 w-4" />
                    Log Movement
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No movements logged yet</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Item</TableHead>
                        <TableHead className="text-xs font-semibold">Qty</TableHead>
                        <TableHead className="text-xs font-semibold">From</TableHead>
                        <TableHead className="text-xs font-semibold">Oracle Code</TableHead>
                        <TableHead className="text-xs font-semibold">To</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.item_name || '—'}</TableCell>
                          <TableCell>{m.quantity ?? '—'}</TableCell>
                          <TableCell className="text-sm">{m.from_location || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{m.from_oracle_code || '—'}</TableCell>
                          <TableCell className="text-sm">{m.to_location || '—'}</TableCell>
                          <TableCell className="text-sm">{formatDate(m.movement_date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Asset Sales</CardTitle>
                {isExpansion && (
                  <Button onClick={() => setShowAddSale(true)} size="sm" className="bg-brand hover:bg-brand-dark">
                    <Plus className="mr-1 h-4 w-4" />
                    Log Sale
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No sales logged yet</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Item</TableHead>
                        <TableHead className="text-xs font-semibold">Qty</TableHead>
                        <TableHead className="text-xs font-semibold">Buyer</TableHead>
                        <TableHead className="text-xs font-semibold">Price</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.item_name || '—'}</TableCell>
                          <TableCell>{s.quantity ?? '—'}</TableCell>
                          <TableCell>{s.buyer || '—'}</TableCell>
                          <TableCell className="tabular-nums">{formatCurrency(s.sale_price)}</TableCell>
                          <TableCell className="text-sm">{formatDate(s.sale_date)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{s.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add FAR Dialog */}
      <Dialog open={showAddFar} onOpenChange={setShowAddFar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Asset to FAR</DialogTitle>
            <DialogDescription>Add a new asset to the Fixed Asset Register</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Kitchen *</Label>
              <Select value={newFar.kitchen_id} onValueChange={(v) => setNewFar({ ...newFar, kitchen_id: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Select kitchen" /></SelectTrigger>
                <SelectContent>
                  {kitchens.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.cluster_marker} — {k.brand} ({k.kitchen_name || 'Unnamed'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asset Name *</Label>
              <Input value={newFar.asset_name} onChange={(e) => setNewFar({ ...newFar, asset_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={newFar.category} onChange={(e) => setNewFar({ ...newFar, category: e.target.value })} /></div>
              <div><Label>Value (₹)</Label><Input type="number" value={newFar.value} onChange={(e) => setNewFar({ ...newFar, value: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Purchase Date</Label><Input type="date" value={newFar.purchase_date} onChange={(e) => setNewFar({ ...newFar, purchase_date: e.target.value })} /></div>
              <div>
                <Label>Condition</Label>
                <Select value={newFar.condition} onValueChange={(v) => setNewFar({ ...newFar, condition: (v ?? 'Good') as 'Good' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Good', 'Fair', 'Poor', 'Damaged'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFar(false)}>Cancel</Button>
            <Button onClick={addFarAsset} disabled={saving || !newFar.kitchen_id || !newFar.asset_name} className="bg-brand hover:bg-brand-dark">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={showAddMovement} onOpenChange={setShowAddMovement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Asset Movement</DialogTitle>
            <DialogDescription>Record an asset moved from kitchen to warehouse</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Item Name *</Label><Input value={newMovement.item_name} onChange={(e) => setNewMovement({ ...newMovement, item_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From Location</Label><Input value={newMovement.from_location} onChange={(e) => setNewMovement({ ...newMovement, from_location: e.target.value })} /></div>
              <div><Label>From Oracle Code</Label><Input value={newMovement.from_oracle_code} onChange={(e) => setNewMovement({ ...newMovement, from_oracle_code: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>To Location</Label><Input value={newMovement.to_location} onChange={(e) => setNewMovement({ ...newMovement, to_location: e.target.value })} /></div>
              <div><Label>To Oracle Code</Label><Input value={newMovement.to_oracle_code} onChange={(e) => setNewMovement({ ...newMovement, to_oracle_code: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantity</Label><Input type="number" value={newMovement.quantity} onChange={(e) => setNewMovement({ ...newMovement, quantity: e.target.value })} /></div>
              <div><Label>Movement Date</Label><Input type="date" value={newMovement.movement_date} onChange={(e) => setNewMovement({ ...newMovement, movement_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Link to FAR Asset (optional)</Label>
              <Select value={newMovement.asset_id} onValueChange={(v) => setNewMovement({ ...newMovement, asset_id: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Select asset..." /></SelectTrigger>
                <SelectContent>
                  {farAssets.filter((a) => a.current_status === 'In Kitchen').map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.asset_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMovement(false)}>Cancel</Button>
            <Button onClick={addMovement} disabled={saving || !newMovement.item_name} className="bg-brand hover:bg-brand-dark">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Log Movement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sale Dialog */}
      <Dialog open={showAddSale} onOpenChange={setShowAddSale}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Asset Sale</DialogTitle>
            <DialogDescription>Record an asset sold to the second-hand market</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Item Name *</Label><Input value={newSale.item_name} onChange={(e) => setNewSale({ ...newSale, item_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantity</Label><Input type="number" value={newSale.quantity} onChange={(e) => setNewSale({ ...newSale, quantity: e.target.value })} /></div>
              <div><Label>Sale Price (₹)</Label><Input type="number" value={newSale.sale_price} onChange={(e) => setNewSale({ ...newSale, sale_price: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Buyer</Label><Input value={newSale.buyer} onChange={(e) => setNewSale({ ...newSale, buyer: e.target.value })} /></div>
              <div><Label>Sale Date</Label><Input type="date" value={newSale.sale_date} onChange={(e) => setNewSale({ ...newSale, sale_date: e.target.value })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={newSale.notes} onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })} rows={2} /></div>
            <div>
              <Label>Link to FAR Asset (optional)</Label>
              <Select value={newSale.asset_id} onValueChange={(v) => setNewSale({ ...newSale, asset_id: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Select asset..." /></SelectTrigger>
                <SelectContent>
                  {farAssets.filter((a) => a.current_status === 'In Kitchen').map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.asset_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSale(false)}>Cancel</Button>
            <Button onClick={addSale} disabled={saving || !newSale.item_name} className="bg-brand hover:bg-brand-dark">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Log Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

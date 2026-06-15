'use client';

import { useEffect, useState, use, type Dispatch, type SetStateAction } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { KitchenStatusTracker, KitchenMaster, AssetMovement, AssetSale, AuditLog } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Loader2,
  Save,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

function TrackerField({
  label,
  field,
  type = 'text',
  isExpansion,
  tracker,
  editData,
  setEditData,
}: {
  label: string;
  field: keyof KitchenStatusTracker;
  type?: string;
  isExpansion: boolean;
  tracker: KitchenStatusTracker;
  editData: Partial<KitchenStatusTracker>;
  setEditData: Dispatch<SetStateAction<Partial<KitchenStatusTracker>>>;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {isExpansion ? (
        <Input
          type={type}
          value={(editData[field] as string) ?? ''}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value || null })}
          className="h-9 text-sm"
        />
      ) : (
        <p className="text-sm font-medium py-1.5">
          {type === 'date'
            ? formatDate(tracker[field] as string)
            : (tracker[field] as string) ?? '—'}
        </p>
      )}
    </div>
  );
}

export default function ClusterDetailPage({
  params,
}: {
  params: Promise<{ cluster_marker: string }>;
}) {
  const { cluster_marker } = use(params);
  const decodedMarker = decodeURIComponent(cluster_marker);
  const { user } = useUser();
  const supabase = createClient();

  const [tracker, setTracker] = useState<KitchenStatusTracker | null>(null);
  const [brands, setBrands] = useState<KitchenMaster[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [sales, setSales] = useState<AssetSale[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<KitchenStatusTracker>>({});

  const isExpansion = user?.role === 'expansion' || user?.role === 'admin';

  useEffect(() => {
    async function fetchData() {
      // Fetch closure tracker
      const { data: trackerData } = await supabase
        .from('kitchen_status')
        .select('*')
        .eq('cluster_marker', decodedMarker)
        .single();

      if (trackerData) {
        setTracker(trackerData as KitchenStatusTracker);
        setEditData(trackerData);
      }

      // Fetch brands in this cluster
      const { data: brandsData } = await supabase
        .from('kitchen_master')
        .select('*')
        .eq('cluster_marker', decodedMarker)
        .is('removed_at', null);

      if (brandsData) setBrands(brandsData as KitchenMaster[]);

      // Fetch movements by oracle code
      if (trackerData?.oracle_code) {
        const { data: movData } = await supabase
          .from('asset_movements')
          .select('*')
          .eq('from_oracle_code', trackerData.oracle_code)
          .order('created_at', { ascending: false });
        if (movData) setMovements(movData as AssetMovement[]);
      }

      // Fetch sales
      const brandIds = brandsData?.map((b: KitchenMaster) => b.id) ?? [];
      if (brandIds.length > 0) {
        const { data: salesData } = await supabase
          .from('asset_sales')
          .select('*')
          .in('kitchen_id', brandIds)
          .order('created_at', { ascending: false });
        if (salesData) setSales(salesData as AssetSale[]);
      }

      // Fetch audit logs
      if (trackerData?.id) {
        const { data: logData } = await supabase
          .from('audit_log')
          .select('*')
          .eq('record_id', trackerData.id)
          .order('changed_at', { ascending: false })
          .limit(50);
        if (logData) setAuditLogs(logData as AuditLog[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [decodedMarker]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!tracker) return;
    setSaving(true);
    const { error } = await supabase
      .from('kitchen_status')
      .update({
        ...editData,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tracker.id);

    if (!error) {
      setTracker({ ...tracker, ...editData } as KitchenStatusTracker);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-lg font-semibold">Cluster not found</h2>
        <p className="text-sm mt-1">No closure tracker entry for cluster &ldquo;{decodedMarker}&rdquo;</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const fieldProps = { isExpansion, tracker, editData, setEditData };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Cluster {tracker.cluster_marker}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tracker.kitchen_name || 'Unnamed'} &middot; {tracker.city || 'Unknown City'}
              {tracker.oracle_code && ` &middot; ${tracker.oracle_code}`}
            </p>
          </div>
        </div>
        {isExpansion && (
          <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-dark">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        )}
      </div>

      {/* Brands in this cluster */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Brands in Cluster ({brands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <Badge key={b.id} variant="secondary" className="text-sm px-3 py-1">
                {b.brand}
                {b.kitchen_name && <span className="text-muted-foreground ml-1">({b.kitchen_name})</span>}
              </Badge>
            ))}
            {brands.length === 0 && (
              <p className="text-sm text-muted-foreground">No brands found in kitchen master</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="movements">Movements ({movements.length})</TabsTrigger>
          <TabsTrigger value="sales">Sales ({sales.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Log ({auditLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <TrackerField label="Kitchen Name" field="kitchen_name" {...fieldProps} />
                <TrackerField label="Oracle Code" field="oracle_code" {...fieldProps} />
                <TrackerField label="City" field="city" {...fieldProps} />
                <TrackerField label="Zone" field="zone" {...fieldProps} />
                <TrackerField label="Format Final" field="format_final" {...fieldProps} />
                <TrackerField label="Entity" field="entity" {...fieldProps} />
                <TrackerField label="Status" field="status" {...fieldProps} />
                <TrackerField label="Reason for Change" field="reason_for_change" {...fieldProps} />
                <TrackerField label="Lock-in" field="lock_in" {...fieldProps} />
                <TrackerField label="Lock-in End Date" field="lock_in_end_date" type="date" {...fieldProps} />
                <TrackerField label="Ops Closed" field="ops_closed" {...fieldProps} />
                <TrackerField label="Last Ops Date" field="last_ops_date" type="date" {...fieldProps} />
                <TrackerField label="Last Rent Date" field="last_rent_date" type="date" {...fieldProps} />
                <TrackerField label="LL Clearance" field="ll_clearance" {...fieldProps} />
                <TrackerField label="Shut/Suspend/Continue" field="shut_suspend_continue" {...fieldProps} />
                <TrackerField label="Notice Period" field="notice_period" {...fieldProps} />
                <TrackerField label="HR Remarks" field="hr_remarks" {...fieldProps} />
              </div>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Remarks</Label>
                  {isExpansion ? (
                    <Textarea
                      value={(editData.remarks as string) ?? ''}
                      onChange={(e) => setEditData({ ...editData, remarks: e.target.value || null })}
                      rows={2}
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm">{tracker.remarks || '—'}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Remarks 2</Label>
                  {isExpansion ? (
                    <Textarea
                      value={(editData.remarks_2 as string) ?? ''}
                      onChange={(e) => setEditData({ ...editData, remarks_2: e.target.value || null })}
                      rows={2}
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm">{tracker.remarks_2 || '—'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <TrackerField label="Rent" field="rent" {...fieldProps} />
                <TrackerField label="Dec Net Revenue" field="dec_net_revenue" {...fieldProps} />
                <TrackerField label="Dec EBITDA" field="dec_ebitda" {...fieldProps} />
                <TrackerField label="Security Deposit (SD)" field="sd" {...fieldProps} />
                <TrackerField label="SD Adjustment" field="sd_adjustment" {...fieldProps} />
                <TrackerField label="SD Recovery" field="sd_recovery" {...fieldProps} />
                <TrackerField label="Rental Hit Till Lock-in" field="rental_hit_till_lock_in" {...fieldProps} />
                <TrackerField label="Capex" field="capex" {...fieldProps} />
                <TrackerField label="Framework" field="framework" {...fieldProps} />
                <TrackerField label="Closure Phasing" field="closure_phasing" {...fieldProps} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No asset movements recorded</p>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Item</TableHead>
                        <TableHead className="text-xs font-semibold">Qty</TableHead>
                        <TableHead className="text-xs font-semibold">From</TableHead>
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

        <TabsContent value="sales">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              {sales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No asset sales recorded</p>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.item_name || '—'}</TableCell>
                          <TableCell>{s.quantity ?? '—'}</TableCell>
                          <TableCell>{s.buyer || '—'}</TableCell>
                          <TableCell>{formatCurrency(s.sale_price)}</TableCell>
                          <TableCell>{formatDate(s.sale_date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No changes recorded yet</p>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Action</TableHead>
                        <TableHead className="text-xs font-semibold">Table</TableHead>
                        <TableHead className="text-xs font-semibold">When</TableHead>
                        <TableHead className="text-xs font-semibold">Changes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge
                              className={
                                log.action === 'INSERT'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  : log.action === 'DELETE'
                                  ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                              }
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.table_name}</TableCell>
                          <TableCell className="text-sm">{formatDate(log.changed_at)}</TableCell>
                          <TableCell className="max-w-[300px] text-xs text-muted-foreground truncate">
                            {log.action === 'UPDATE' && log.old_data && log.new_data
                              ? Object.keys(log.new_data)
                                  .filter((k) => JSON.stringify(log.old_data![k]) !== JSON.stringify(log.new_data![k]))
                                  .join(', ') || 'No visible changes'
                              : '—'}
                          </TableCell>
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
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { KitchenStatusTracker } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowUpDown,
  Check,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react';

type TrackerField = keyof KitchenStatusTracker;
type FieldKind = 'text' | 'date' | 'number' | 'integer' | 'textarea';
type SortOption = 'cluster-asc' | 'cluster-desc' | 'updated-desc' | 'kitchen-asc' | 'city-asc' | 'ops-closed';

interface TrackerFieldConfig {
  field: TrackerField;
  label: string;
  kind: FieldKind;
  widthClass: string;
  section: 'identity' | 'location' | 'status' | 'financials' | 'remarks';
}

const TRACKER_FIELDS: TrackerFieldConfig[] = [
  { field: 'kitchen_name', label: 'Kitchen Name', kind: 'text', widthClass: 'min-w-44', section: 'identity' },
  { field: 'oracle_code', label: 'Oracle Code', kind: 'text', widthClass: 'min-w-36', section: 'identity' },
  { field: 'cluster_marker', label: 'Cluster Marker', kind: 'text', widthClass: 'min-w-32', section: 'identity' },
  { field: 'rent', label: 'Rent', kind: 'number', widthClass: 'min-w-32', section: 'financials' },
  { field: 'city', label: 'City', kind: 'text', widthClass: 'min-w-32', section: 'location' },
  { field: 'zone', label: 'Zone', kind: 'text', widthClass: 'min-w-28', section: 'location' },
  { field: 'format_final', label: 'Format Final', kind: 'text', widthClass: 'min-w-36', section: 'location' },
  { field: 'entity', label: 'Entity', kind: 'text', widthClass: 'min-w-44', section: 'location' },
  { field: 'status', label: 'Status', kind: 'text', widthClass: 'min-w-36', section: 'status' },
  { field: 'reason_for_change', label: 'Reason for Change', kind: 'text', widthClass: 'min-w-44', section: 'status' },
  { field: 'lock_in', label: 'Lock-in', kind: 'text', widthClass: 'min-w-28', section: 'status' },
  { field: 'lock_in_end_date', label: 'Lock-in End Date', kind: 'date', widthClass: 'min-w-40', section: 'status' },
  { field: 'ops_closed', label: 'Ops Closed', kind: 'text', widthClass: 'min-w-32', section: 'status' },
  { field: 'last_ops_date', label: 'Last Ops Date', kind: 'date', widthClass: 'min-w-36', section: 'status' },
  { field: 'last_rent_date', label: 'Last Rent Date', kind: 'date', widthClass: 'min-w-36', section: 'status' },
  { field: 'll_clearance', label: 'LL Clearance', kind: 'text', widthClass: 'min-w-36', section: 'status' },
  { field: 'shut_suspend_continue', label: 'Shut/Suspend/Continue', kind: 'text', widthClass: 'min-w-48', section: 'status' },
  { field: 'dec_net_revenue', label: 'Dec Net Revenue', kind: 'number', widthClass: 'min-w-40', section: 'financials' },
  { field: 'dec_ebitda', label: 'Dec EBITDA', kind: 'number', widthClass: 'min-w-36', section: 'financials' },
  { field: 'sd', label: 'SD', kind: 'number', widthClass: 'min-w-32', section: 'financials' },
  { field: 'sd_adjustment', label: 'SD Adjustment', kind: 'number', widthClass: 'min-w-40', section: 'financials' },
  { field: 'sd_recovery', label: 'SD Recovery', kind: 'number', widthClass: 'min-w-36', section: 'financials' },
  { field: 'remarks', label: 'Remarks', kind: 'textarea', widthClass: 'min-w-56', section: 'remarks' },
  { field: 'notice_period', label: 'Notice Period', kind: 'text', widthClass: 'min-w-36', section: 'remarks' },
  { field: 'remarks_2', label: 'Remarks 2', kind: 'textarea', widthClass: 'min-w-44', section: 'remarks' },
  { field: 'rental_hit_till_lock_in', label: 'Rental Hit Till Lock-in', kind: 'number', widthClass: 'min-w-44', section: 'financials' },
  { field: 'capex', label: 'Capex', kind: 'number', widthClass: 'min-w-32', section: 'financials' },
  { field: 'framework', label: 'Framework', kind: 'integer', widthClass: 'min-w-32', section: 'financials' },
  { field: 'closure_phasing', label: 'Closure Phasing', kind: 'integer', widthClass: 'min-w-40', section: 'financials' },
  { field: 'hr_remarks', label: 'HR Remarks', kind: 'textarea', widthClass: 'min-w-56', section: 'remarks' },
];

const ADD_SECTIONS = [
  { key: 'identity', title: 'Identity' },
  { key: 'location', title: 'Location' },
  { key: 'status', title: 'Status' },
  { key: 'financials', title: 'Financials' },
  { key: 'remarks', title: 'Remarks' },
] as const;

const moneyFields = new Set<TrackerField>([
  'rent',
  'dec_net_revenue',
  'dec_ebitda',
  'sd',
  'sd_adjustment',
  'sd_recovery',
  'rental_hit_till_lock_in',
  'capex',
]);

function normalizeDateInput(value: unknown) {
  if (!value || typeof value !== 'string') return '';
  return value.slice(0, 10);
}

function parseFieldValue(value: string, kind: FieldKind) {
  if (value === '') return null;
  if (kind === 'number') return Number(value);
  if (kind === 'integer') return Number.parseInt(value, 10);
  return value;
}

function valueForInput(value: unknown, kind: FieldKind) {
  if (value === null || value === undefined) return '';
  if (kind === 'date') return normalizeDateInput(value);
  return String(value);
}

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? '').localeCompare(b ?? '', undefined, { numeric: true, sensitivity: 'base' });
}

function compareDate(a: string | null | undefined, b: string | null | undefined) {
  return new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();
}

function renderTrackerValue(tracker: KitchenStatusTracker, config: TrackerFieldConfig) {
  const value = tracker[config.field];

  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">-</span>;
  if (config.kind === 'date') return formatDate(value as string);
  if (moneyFields.has(config.field)) return formatCurrency(value as number);

  if (config.field === 'ops_closed') {
    const normalized = String(value).toLowerCase();
    if (normalized === 'yes') {
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Yes</Badge>;
    }
    if (normalized === 'no') {
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">No</Badge>;
    }
  }

  if (config.field === 'shut_suspend_continue') {
    const normalized = String(value).toLowerCase();
    if (normalized.includes('done') || normalized.includes('closed')) {
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">{String(value)}</Badge>;
    }
    if (normalized.includes('hold') || normalized.includes('suspend')) {
      return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">{String(value)}</Badge>;
    }
    if (normalized.includes('pending')) {
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">{String(value)}</Badge>;
    }
  }

  return String(value);
}

function buildEmptyTracker(): Partial<KitchenStatusTracker> {
  return {
    cluster_marker: '',
    kitchen_name: '',
    oracle_code: '',
    rent: null,
    city: '',
    zone: '',
    format_final: '',
    entity: '',
    status: '',
    reason_for_change: '',
    lock_in: '',
    lock_in_end_date: null,
    ops_closed: '',
    last_ops_date: null,
    last_rent_date: null,
    ll_clearance: '',
    shut_suspend_continue: '',
    dec_net_revenue: null,
    dec_ebitda: null,
    sd: null,
    sd_adjustment: null,
    sd_recovery: null,
    remarks: '',
    notice_period: '',
    remarks_2: '',
    rental_hit_till_lock_in: null,
    capex: null,
    framework: null,
    closure_phasing: null,
    hr_remarks: '',
  };
}

export default function KitchenClosureStatusPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();
  const [trackers, setTrackers] = useState<KitchenStatusTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<KitchenStatusTracker>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState<Partial<KitchenStatusTracker>>(buildEmptyTracker);
  const [formError, setFormError] = useState('');

  const canEdit = user?.role === 'expansion' || user?.role === 'admin';

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('kitchen_status')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setTrackers((data ?? []) as KitchenStatusTracker[]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = trackers
    .filter((tracker) => {
      const q = search.toLowerCase();
      return (
        tracker.cluster_marker?.toLowerCase().includes(q) ||
        tracker.kitchen_name?.toLowerCase().includes(q) ||
        tracker.oracle_code?.toLowerCase().includes(q) ||
        tracker.city?.toLowerCase().includes(q) ||
        tracker.zone?.toLowerCase().includes(q) ||
        tracker.entity?.toLowerCase().includes(q) ||
        tracker.status?.toLowerCase().includes(q) ||
        tracker.ops_closed?.toLowerCase().includes(q) ||
        tracker.shut_suspend_continue?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'cluster-asc':
          return compareText(a.cluster_marker, b.cluster_marker);
        case 'cluster-desc':
          return compareText(b.cluster_marker, a.cluster_marker);
        case 'kitchen-asc':
          return compareText(a.kitchen_name, b.kitchen_name);
        case 'city-asc':
          return compareText(a.city, b.city);
        case 'ops-closed':
          return compareText(b.ops_closed, a.ops_closed) || compareText(a.cluster_marker, b.cluster_marker);
        case 'updated-desc':
        default:
          return compareDate(b.updated_at, a.updated_at);
      }
    });

  const startEdit = (tracker: KitchenStatusTracker) => {
    setFormError('');
    setEditingId(tracker.id);
    setEditData({ ...tracker });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setFormError('');
  };

  const updateDraftField = (
    setter: React.Dispatch<React.SetStateAction<Partial<KitchenStatusTracker>>>,
    field: TrackerField,
    value: string,
    kind: FieldKind
  ) => {
    setter((current) => ({
      ...current,
      [field]: parseFieldValue(value, kind),
    }));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editData.cluster_marker) {
      setFormError('Cluster marker is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    const updatePayload = {
      ...editData,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('kitchen_status')
      .update(updatePayload)
      .eq('id', editingId)
      .select()
      .single();

    if (error) {
      setFormError(error.code === '23505' ? 'A row already exists for this cluster marker.' : error.message);
    } else if (data) {
      setTrackers((current) =>
        current.map((tracker) => (tracker.id === editingId ? (data as KitchenStatusTracker) : tracker))
      );
      cancelEdit();
    }

    setSaving(false);
  };

  const addRow = async () => {
    if (!newRow.cluster_marker) {
      setFormError('Cluster marker is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    const { data, error } = await supabase
      .from('kitchen_status')
      .insert({
        ...newRow,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      setFormError(error.code === '23505' ? 'A row already exists for this cluster marker.' : error.message);
    } else if (data) {
      setTrackers((current) => [data as KitchenStatusTracker, ...current]);
      setNewRow(buildEmptyTracker());
      setShowAdd(false);
    }

    setSaving(false);
  };

  const closeAddDialog = (open: boolean) => {
    setShowAdd(open);
    if (!open) {
      setNewRow(buildEmptyTracker());
      setFormError('');
    }
  };

  const renderEditInput = (
    source: Partial<KitchenStatusTracker>,
    setter: React.Dispatch<React.SetStateAction<Partial<KitchenStatusTracker>>>,
    config: TrackerFieldConfig,
    compact = false
  ) => {
    const value = valueForInput(source[config.field], config.kind);
    const className = compact ? 'h-8 min-w-32 text-sm' : 'text-sm';

    if (config.kind === 'textarea') {
      return (
        <Textarea
          value={value}
          onChange={(event) => updateDraftField(setter, config.field, event.target.value, config.kind)}
          rows={compact ? 1 : 2}
          className={compact ? 'min-w-48 text-sm' : 'text-sm'}
        />
      );
    }

    return (
      <Input
        type={config.kind === 'date' ? 'date' : config.kind === 'text' ? 'text' : 'number'}
        step={config.kind === 'integer' ? '1' : 'any'}
        value={value}
        onChange={(event) => updateDraftField(setter, config.field, event.target.value, config.kind)}
        className={className}
      />
    );
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Closure Status</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operational closure tracker list - {trackers.length} cluster(s)
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setFormError('');
              setShowAdd(true);
            }}
            className="bg-brand hover:bg-brand-dark"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
        )}
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Closure Tracker
            </CardTitle>
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="closure-status-search"
                  placeholder="Search clusters, kitchen, city..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy((value ?? 'updated-desc') as SortOption)}>
                <SelectTrigger className="w-full lg:w-56">
                  <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated-desc">Recently Updated</SelectItem>
                  <SelectItem value="cluster-asc">Cluster: Ascending</SelectItem>
                  <SelectItem value="cluster-desc">Cluster: Descending</SelectItem>
                  <SelectItem value="kitchen-asc">Kitchen: A to Z</SelectItem>
                  <SelectItem value="city-asc">City: A to Z</SelectItem>
                  <SelectItem value="ops-closed">Ops Closed First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {formError && (
            <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? 'No closure rows match your search' : 'No closure status rows yet'}</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {canEdit && <TableHead className="sticky left-0 z-20 w-20 bg-card text-xs font-semibold">Edit</TableHead>}
                    {TRACKER_FIELDS.map((config) => (
                      <TableHead key={config.field} className={`${config.widthClass} text-xs font-semibold`}>
                        {config.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tracker) => {
                    const isEditing = editingId === tracker.id;

                    return (
                      <TableRow key={tracker.id} className="group align-top">
                        {canEdit && (
                          <TableCell className="sticky left-0 z-10 bg-card">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={saveEdit}
                                  disabled={saving}
                                  className="p-1 rounded hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors"
                                  aria-label="Save row"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1 rounded hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                                  aria-label="Cancel edit"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(tracker)}
                                className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-foreground"
                                aria-label={`Edit cluster ${tracker.cluster_marker}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </TableCell>
                        )}

                        {TRACKER_FIELDS.map((config) => (
                          <TableCell key={config.field} className={`${config.widthClass} text-sm`}>
                            {isEditing ? renderEditInput(editData, setEditData, config, true) : renderTrackerValue(tracker, config)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={closeAddDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Kitchen Closure Status Row</DialogTitle>
            <DialogDescription>Add one cluster-level closure tracker record.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {ADD_SECTIONS.map((section) => (
              <div key={section.key} className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {TRACKER_FIELDS.filter((config) => config.section === section.key).map((config) => (
                    <div key={config.field} className={config.kind === 'textarea' ? 'space-y-1.5 lg:col-span-3' : 'space-y-1.5'}>
                      <Label className="text-xs text-muted-foreground">
                        {config.label}
                        {config.field === 'cluster_marker' && <span className="text-destructive"> *</span>}
                      </Label>
                      {renderEditInput(newRow, setNewRow, config)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {formError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => closeAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addRow} disabled={saving} className="bg-brand hover:bg-brand-dark">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

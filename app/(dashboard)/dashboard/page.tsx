'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { ClosureTracker } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortKey = 'cluster_marker' | 'kitchen_name' | 'city' | 'ops_closed' | 'updated_at';
type SortDir = 'asc' | 'desc';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [trackers, setTrackers] = useState<ClosureTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const supabase = createClient();

  useEffect(() => {
    async function fetchTrackers() {
      const { data, error } = await supabase
        .from('closure_tracker')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setTrackers(data as ClosureTracker[]);
      }
      setLoading(false);
    }
    fetchTrackers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats
  const totalClusters = trackers.length;
  const opsClosedCount = trackers.filter((t) => t.ops_closed === 'Yes').length;
  const onHoldCount = trackers.filter(
    (t) => t.shut_suspend_continue?.toLowerCase() === 'hold'
  ).length;
  const pendingCount = totalClusters - opsClosedCount - onHoldCount;

  // Filter + sort
  const filtered = trackers
    .filter((t) => {
      const q = search.toLowerCase();
      return (
        t.cluster_marker?.toLowerCase().includes(q) ||
        t.kitchen_name?.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q) ||
        t.oracle_code?.toLowerCase().includes(q) ||
        t.entity?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getStatusBadge = (tracker: ClosureTracker) => {
    if (tracker.ops_closed === 'Yes') {
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Closed</Badge>;
    }
    if (tracker.shut_suspend_continue?.toLowerCase() === 'hold') {
      return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">On Hold</Badge>;
    }
    return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">In Progress</Badge>;
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Clusters',
      value: totalClusters,
      icon: Building2,
      color: 'text-brand',
      bg: 'bg-brand/10',
    },
    {
      title: 'Ops Closed',
      value: opsClosedCount,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'On Hold',
      value: onHoldCount,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Pending',
      value: pendingCount,
      icon: AlertCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of all kitchen closure activities
          {user && <span className="ml-1">— Welcome back, {user.name.split(' ')[0]}</span>}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">Closure Tracker</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dashboard-search"
                placeholder="Search clusters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {search ? 'No clusters match your search' : 'No closure data yet'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {[
                      { key: 'cluster_marker' as SortKey, label: 'Cluster' },
                      { key: 'kitchen_name' as SortKey, label: 'Kitchen' },
                      { key: 'city' as SortKey, label: 'City' },
                    ].map((col) => (
                      <TableHead key={col.key}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 text-xs font-semibold"
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                    ))}
                    <TableHead className="text-xs font-semibold">Entity</TableHead>
                    <TableHead className="text-xs font-semibold">Ops Closed</TableHead>
                    <TableHead className="text-xs font-semibold">Last Ops Date</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Rent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tracker) => (
                    <TableRow
                      key={tracker.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => router.push(`/cluster/${encodeURIComponent(tracker.cluster_marker)}`)}
                    >
                      <TableCell className="font-semibold text-brand dark:text-brand-200">
                        {tracker.cluster_marker}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tracker.kitchen_name || '—'}
                      </TableCell>
                      <TableCell>{tracker.city || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {tracker.entity || '—'}
                      </TableCell>
                      <TableCell>
                        {tracker.ops_closed === 'Yes' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(tracker.last_ops_date)}</TableCell>
                      <TableCell>{getStatusBadge(tracker)}</TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {formatCurrency(tracker.rent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

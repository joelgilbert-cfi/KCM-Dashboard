'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Building2,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';
import { cn, formatDate, getStatusColor, getProgressColor } from '@/lib/utils';
import type { Cluster, ClosureTracker } from '@/lib/types';

interface DashboardStats {
  total_clusters: number;
  under_closure: number;
  completed: number;
  on_hold: number;
  pending: number;
}

interface ClusterRow extends Cluster {
  closure_tracker: ClosureTracker[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_clusters: 0,
    under_closure: 0,
    completed: 0,
    on_hold: 0,
    pending: 0,
  });
  const [clusters, setClusters] = useState<ClusterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch clusters with closure tracker
      const { data: clusterData, error } = await supabase
        .from('clusters')
        .select('*, closure_tracker(*)')
        .is('removed_at', null)
        .order('cluster_marker', { ascending: true });

      if (error) throw error;

      const allClusters = (clusterData || []) as ClusterRow[];

      // Calculate stats
      const underClosure = allClusters.filter(
        (c) => c.status === 'Under Closure'
      );
      const closed = allClusters.filter((c) => c.status === 'Closed');
      const onHold = allClusters.filter((c) =>
        c.closure_tracker?.some((t) => t.on_hold)
      );
      const pending = underClosure.filter(
        (c) =>
          !c.closure_tracker?.length ||
          c.closure_tracker.some((t) => t.progress === 'Initiated')
      );

      setStats({
        total_clusters: allClusters.length,
        under_closure: underClosure.length,
        completed: closed.length,
        on_hold: onHold.length,
        pending: pending.length,
      });

      // Show clusters under closure + closed on dashboard
      setClusters(
        allClusters.filter(
          (c) => c.status === 'Under Closure' || c.status === 'Closed'
        )
      );
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Get unique cities for filter
  const cities = [...new Set(clusters.map((c) => c.city).filter(Boolean))];

  // Filter clusters
  const filteredClusters = clusters.filter((cluster) => {
    const matchesSearch =
      !searchQuery ||
      cluster.cluster_marker
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      cluster.ops_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cluster.finance_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cluster.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || cluster.status === statusFilter;

    const matchesCity =
      cityFilter === 'all' || cluster.city === cityFilter;

    return matchesSearch && matchesStatus && matchesCity;
  });

  const statCards = [
    {
      label: 'Under Closure',
      value: stats.under_closure,
      icon: TrendingDown,
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'On Hold',
      value: stats.on_hold,
      icon: Pause,
      color: 'from-red-500/20 to-rose-500/20',
      iconColor: 'text-red-400',
      borderColor: 'border-red-500/20',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))}
        </div>
        <div className="h-96 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of kitchen closure activity across all clusters
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                'glass-card p-5 stat-card-glow border',
                card.borderColor
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {card.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-2.5 rounded-lg bg-gradient-to-br',
                    card.color
                  )}
                >
                  <Icon className={cn('w-5 h-5', card.iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cluster table */}
      <div className="glass-card overflow-hidden">
        {/* Table header */}
        <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-foreground">
              Closure Pipeline
            </h2>
            <span className="badge bg-secondary text-muted-foreground border-zinc-700">
              {filteredClusters.length} clusters
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clusters..."
                className="form-input pl-9 py-2 text-sm w-full sm:w-[220px]"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'btn btn-secondary btn-sm',
                showFilters && 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform',
                  showFilters && 'rotate-180'
                )}
              />
            </button>
          </div>
        </div>

        {/* Filter row */}
        {showFilters && (
          <div className="px-5 py-3 border-b border-border/50 flex gap-4 bg-card/50">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input py-1.5 text-sm w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="Under Closure">Under Closure</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="form-input py-1.5 text-sm w-auto"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city!}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Table */}
        {filteredClusters.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No clusters found matching your filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cluster</th>
                  <th>City</th>
                  <th>Zone</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Last Ops Date</th>
                  <th>On Hold</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredClusters.map((cluster) => {
                  const tracker = cluster.closure_tracker?.[0];
                  return (
                    <tr
                      key={cluster.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/cluster/${cluster.id}`)}
                    >
                      <td>
                        <div>
                          <p className="font-medium text-foreground">
                            {cluster.cluster_marker}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cluster.ops_name || cluster.finance_name || '—'}
                          </p>
                        </div>
                      </td>
                      <td>{cluster.city || '—'}</td>
                      <td>{cluster.zone || '—'}</td>
                      <td>
                        <span
                          className={cn(
                            'badge',
                            getStatusColor(cluster.status)
                          )}
                        >
                          {cluster.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            'badge',
                            getProgressColor(tracker?.progress || null)
                          )}
                        >
                          {tracker?.progress || 'Not Started'}
                        </span>
                      </td>
                      <td>
                        {formatDate(tracker?.last_ops_date)}
                      </td>
                      <td>
                        {tracker?.on_hold ? (
                          <span className="badge bg-red-500/15 text-red-400 border-red-500/30">
                            On Hold
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td>
                        <ArrowUpRight className="w-4 h-4 text-zinc-600" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ScrollText, Search, Filter, ChevronDown } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { AuditLogEntry, User } from '@/lib/types';

interface AuditLogWithUser extends AuditLogEntry {
  users: User | null;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*, users(*)')
        .order('changed_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error(error);
        return;
      }

      setLogs((data || []) as AuditLogWithUser[]);
      setLoading(false);
    }

    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tables = [...new Set(logs.map((l) => l.table_name))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.new_data)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesTable =
      tableFilter === 'all' || log.table_name === tableFilter;

    const matchesAction =
      actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesTable && matchesAction;
  });

  function getActionBadge(action: string) {
    switch (action) {
      case 'INSERT':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'UPDATE':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'DELETE':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-500/15 text-muted-foreground border-zinc-500/30';
    }
  }

  function renderDiff(
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null
  ) {
    if (!oldData && !newData) return null;

    if (!oldData) {
      // INSERT — show all new values
      return (
        <div className="space-y-1">
          {Object.entries(newData!).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="text-muted-foreground min-w-[140px]">{key}:</span>
              <span className="text-emerald-400">
                {String(value ?? 'null')}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (!newData) {
      // DELETE — show old values
      return (
        <div className="space-y-1">
          {Object.entries(oldData).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="text-muted-foreground min-w-[140px]">{key}:</span>
              <span className="text-red-400 line-through">
                {String(value ?? 'null')}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // UPDATE — show changed fields only
    const changedKeys = Object.keys(newData).filter(
      (key) =>
        JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
    );

    if (changedKeys.length === 0) {
      return (
        <p className="text-xs text-zinc-600">No visible changes</p>
      );
    }

    return (
      <div className="space-y-1.5">
        {changedKeys.map((key) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="text-muted-foreground min-w-[140px]">{key}:</span>
            <span className="text-red-400 line-through mr-2">
              {String(oldData[key] ?? 'null')}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-emerald-400 ml-2">
              {String(newData[key] ?? 'null')}
            </span>
          </div>
        ))}
      </div>
    );
  }

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete trail of all data changes across the system
        </p>
      </div>

      {/* Log table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-foreground">
              All Changes
            </h2>
            <span className="badge bg-secondary text-muted-foreground border-zinc-700">
              {filteredLogs.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="form-input pl-9 py-2 text-sm w-full sm:w-[200px]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'btn btn-secondary btn-sm',
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
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="form-input py-1.5 text-sm w-auto"
            >
              <option value="all">All Tables</option>
              {tables.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="form-input py-1.5 text-sm w-auto"
            >
              <option value="all">All Actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        )}

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No audit log entries</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/30">
            {filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id}>
                  <div
                    className="flex items-center px-5 py-3.5 cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : log.id)
                    }
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 -rotate-90" />
                      )}

                      <span
                        className={cn('badge', getActionBadge(log.action))}
                      >
                        {log.action}
                      </span>

                      <span className="font-medium text-foreground text-sm">
                        {log.table_name}
                      </span>

                      <span className="text-xs text-zinc-600">
                        {log.record_id.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {log.users?.name || 'System'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.changed_at, 'dd MMM yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-card/30 px-5 pb-4">
                      <div className="ml-7 p-4 rounded-lg bg-secondary/30 border border-border/50">
                        {renderDiff(log.old_data, log.new_data)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

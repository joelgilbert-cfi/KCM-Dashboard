'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ScrollText, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRACKED_TABLES = [
  'kitchen_status',
  'fixed_asset_register',
  'asset_movements',
  'asset_sales',
  'closure_requests',
];

export default function AuditLogPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(200);

      if (filterTable !== 'all') {
        query = query.eq('table_name', filterTable);
      }
      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      const { data, error } = await query;
      if (!error && data) {
        setLogs(data as AuditLog[]);
      }
      setLoading(false);
    }
    fetchLogs();
  }, [filterTable, filterAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.table_name?.toLowerCase().includes(q) ||
      log.record_id?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">INSERT</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">UPDATE</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20">DELETE</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  // Get changed fields for UPDATE actions
  const getChangedFields = (log: AuditLog): string[] => {
    if (log.action !== 'UPDATE' || !log.old_data || !log.new_data) return [];
    return Object.keys(log.new_data).filter(
      (k) => JSON.stringify(log.old_data![k]) !== JSON.stringify(log.new_data![k])
    );
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
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete change history across all tracked tables
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="audit-search"
                placeholder="Search by table, record ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTable} onValueChange={(v) => setFilterTable(v ?? 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {TRACKED_TABLES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={(v) => setFilterAction(v ?? 'all')}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No audit log entries found</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Action</TableHead>
                    <TableHead className="text-xs font-semibold">Table</TableHead>
                    <TableHead className="text-xs font-semibold">When</TableHead>
                    <TableHead className="text-xs font-semibold">Changed Fields</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const changed = getChangedFields(log);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {log.table_name.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(log.changed_at)}</TableCell>
                        <TableCell className="max-w-[300px]">
                          {changed.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {changed.slice(0, 4).map((f) => (
                                <Badge key={f} variant="secondary" className="text-xs">
                                  {f}
                                </Badge>
                              ))}
                              {changed.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{changed.length - 4} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Audit Log Detail — {selectedLog?.action} on {selectedLog?.table_name}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Record ID:</span>
                  <p className="font-mono text-xs mt-0.5">{selectedLog.record_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">When:</span>
                  <p className="mt-0.5">{formatDate(selectedLog.changed_at)}</p>
                </div>
              </div>

              {selectedLog.old_data && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Old Data</h4>
                  <pre className="rounded-lg bg-muted/50 p-3 text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">New Data</h4>
                  <pre className="rounded-lg bg-muted/50 p-3 text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

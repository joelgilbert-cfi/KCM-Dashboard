'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { ClosureRequest } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Plus,
  FileText,
  ChevronDown,
  ChevronUp,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

export default function ClosureRequestsPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [requests, setRequests] = useState<ClosureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isFinance = user?.role === 'finance' || user?.role === 'admin';

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('closure_requests')
        .select(`
          *,
          requester:users!requested_by(name, email),
          clusters:closure_request_clusters(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data as unknown as ClosureRequest[]);
      }
      setLoading(false);
    }
    fetchRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Closure Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            History of all closure request emails sent
          </p>
        </div>
        {isFinance && (
          <Link href="/closure-requests/new">
            <Button className="bg-brand hover:bg-brand-dark">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </Link>
        )}
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No closure requests sent yet</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10" />
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Requested By</TableHead>
                    <TableHead className="text-xs font-semibold">Clusters</TableHead>
                    <TableHead className="text-xs font-semibold">To</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <>
                      <TableRow
                        key={req.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                      >
                        <TableCell>
                          {expandedId === req.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(req.created_at)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {(req.requester as unknown as { name: string })?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {req.clusters?.map((c) => (
                              <Badge key={c.id} variant="secondary" className="text-xs">
                                {c.cluster_marker}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {req.to_emails?.join(', ') || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              req.status === 'Sent'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20'
                            }
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {expandedId === req.id && (
                        <TableRow key={`${req.id}-expanded`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-medium">To: </span>
                                <span className="text-muted-foreground">{req.to_emails?.join(', ') || '—'}</span>
                              </div>
                              <div>
                                <span className="font-medium">CC: </span>
                                <span className="text-muted-foreground">{req.cc_emails?.join(', ') || '—'}</span>
                              </div>
                              {req.email_sent_at && (
                                <div>
                                  <span className="font-medium">Sent at: </span>
                                  <span className="text-muted-foreground">{formatDate(req.email_sent_at)}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Clusters: </span>
                                <span className="text-muted-foreground">
                                  {req.clusters?.map((c) => c.cluster_marker).join(', ') || '—'}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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

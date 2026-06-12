'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';
import {
  Mail,
  Plus,
  ChevronDown,
  ChevronRight,
  Send,
  Calendar,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { ClosureRequest, User as UserType, Cluster, Kitchen } from '@/lib/types';

interface ClosureRequestRow extends ClosureRequest {
  users: UserType;
  closure_request_clusters: {
    id: string;
    clusters: Cluster & { kitchens: Kitchen[] };
  }[];
}

export default function ClosureRequestsPage() {
  const { user } = useUser();
  const [requests, setRequests] = useState<ClosureRequestRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const isFinance = user?.role === 'finance' || user?.role === 'admin';

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('closure_requests')
        .select(
          '*, users!closure_requests_requested_by_fkey(*), closure_request_clusters(*, clusters(*, kitchens(*)))'
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching closure requests:', error);
        return;
      }

      setRequests((data || []) as unknown as ClosureRequestRow[]);
      setLoading(false);
    }

    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <h1 className="text-2xl font-bold text-foreground">
            Closure Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            History of all closure notification emails
          </p>
        </div>

        {isFinance && (
          <Link href="/closure-requests/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            New Request
          </Link>
        )}
      </div>

      {/* Requests list */}
      <div className="glass-card overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No closure requests yet</p>
            {isFinance && (
              <Link
                href="/closure-requests/new"
                className="btn btn-primary btn-sm mt-4"
              >
                Create First Request
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {requests.map((request) => {
              const isExpanded = expandedId === request.id;
              const clusterCount =
                request.closure_request_clusters?.length || 0;

              return (
                <div key={request.id}>
                  <div
                    className="flex items-center px-5 py-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : request.id)
                    }
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <Send className="w-4 h-4 text-indigo-400" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          Kitchen Closure Request —{' '}
                          {formatDate(request.email_sent_at || request.created_at)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Sent by {request.users?.name || 'Unknown'} •{' '}
                          {clusterCount} cluster{clusterCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="badge bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                        {request.status}
                      </span>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(
                          request.email_sent_at || request.created_at,
                          'dd MMM yyyy HH:mm'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="bg-card/30 px-5 pb-5">
                      <div className="ml-7 space-y-4">
                        {/* Recipients */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">To: </span>
                            <span className="text-foreground">
                              {request.to_emails?.join(', ') || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CC: </span>
                            <span className="text-foreground">
                              {request.cc_emails?.join(', ') || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Clusters and brands */}
                        {request.closure_request_clusters?.map((crc) => (
                          <div
                            key={crc.id}
                            className="rounded-lg bg-secondary/30 border border-border/50 p-4"
                          >
                            <p className="font-medium text-foreground mb-2">
                              Cluster {crc.clusters.cluster_marker}
                              <span className="text-muted-foreground font-normal ml-2">
                                {crc.clusters.ops_name ||
                                  crc.clusters.finance_name ||
                                  ''}{' '}
                                • {crc.clusters.city || ''}
                              </span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {crc.clusters.kitchens
                                ?.filter((k: Kitchen) => !k.removed_at)
                                .map((k: Kitchen) => (
                                  <span
                                    key={k.id}
                                    className="px-2 py-1 bg-secondary rounded text-xs text-muted-foreground"
                                  >
                                    {k.brand}
                                  </span>
                                ))}
                            </div>
                          </div>
                        ))}
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

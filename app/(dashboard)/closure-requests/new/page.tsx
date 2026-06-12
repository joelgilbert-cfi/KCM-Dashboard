'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Send,
  Eye,
  X,
  Search,
  Check,
  Loader2,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmailTagInput from '@/components/email-tag-input';
import type { Cluster, Kitchen } from '@/lib/types';
import { format } from 'date-fns';

interface ClusterWithKitchens extends Cluster {
  kitchens: Kitchen[];
}

export default function NewClosureRequestPage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [clusters, setClusters] = useState<ClusterWithKitchens[]>([]);
  const [selectedClusterIds, setSelectedClusterIds] = useState<Set<string>>(
    new Set()
  );
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const isFinance = user?.role === 'finance' || user?.role === 'admin';

  useEffect(() => {
    async function fetchClusters() {
      const { data, error } = await supabase
        .from('clusters')
        .select('*, kitchens(*)')
        .eq('status', 'Active')
        .is('removed_at', null)
        .order('cluster_marker', { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      // Filter out soft-deleted kitchens
      const cleaned = (data || []).map((c: ClusterWithKitchens) => ({
        ...c,
        kitchens: c.kitchens.filter((k: Kitchen) => !k.removed_at),
      }));

      setClusters(cleaned);
      setLoading(false);
    }

    fetchClusters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCluster(id: string) {
    const next = new Set(selectedClusterIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedClusterIds(next);
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Generate the email preview table rows
  const selectedClusters = clusters.filter((c) =>
    selectedClusterIds.has(c.id)
  );

  const emailRows = selectedClusters.flatMap((cluster) =>
    cluster.kitchens.map((kitchen) => ({
      cluster_marker: cluster.cluster_marker,
      brand: kitchen.brand,
      kitchen_name: cluster.ops_name || cluster.finance_name || '—',
      city: cluster.city || '—',
    }))
  );

  // Filtered clusters for search
  const filteredClusters = clusters.filter(
    (c) =>
      !searchQuery ||
      c.cluster_marker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ops_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleSendEmail() {
    if (
      !isFinance ||
      selectedClusterIds.size === 0 ||
      toEmails.length === 0
    ) {
      return;
    }

    setSending(true);
    try {
      // 1. Create closure request record
      const { data: request, error: requestError } = await supabase
        .from('closure_requests')
        .insert({
          requested_by: user!.id,
          status: 'Sent',
          to_emails: toEmails,
          cc_emails: ccEmails,
          email_sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 2. Link clusters to this request
      const clusterLinks = Array.from(selectedClusterIds).map(
        (cluster_id) => ({
          request_id: request.id,
          cluster_id,
        })
      );

      const { error: linkError } = await supabase
        .from('closure_request_clusters')
        .insert(clusterLinks);

      if (linkError) throw linkError;

      // 3. Update cluster statuses to "Under Closure"
      const { error: statusError } = await supabase
        .from('clusters')
        .update({ status: 'Under Closure' })
        .in('id', Array.from(selectedClusterIds));

      if (statusError) throw statusError;

      // 4. Create initial closure tracker entries
      const trackerEntries = Array.from(selectedClusterIds).map(
        (cluster_id) => ({
          cluster_id,
          progress: 'Initiated' as const,
          updated_by: user!.id,
        })
      );

      await supabase.from('closure_tracker').insert(trackerEntries);

      // 5. Send email via API route
      const emailResponse = await fetch('/api/send-closure-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmails,
          cc: ccEmails,
          rows: emailRows,
          senderName: user!.name,
          senderEmail: user!.email,
        }),
      });

      if (!emailResponse.ok) {
        console.warn('Email sending failed, but records were saved');
      }

      showToast('Closure request sent successfully!', 'success');
      setShowPreview(false);

      // Redirect to closure requests list
      setTimeout(() => {
        router.push('/closure-requests');
      }, 1500);
    } catch (err) {
      console.error('Error sending closure request:', err);
      showToast('Failed to send closure request', 'error');
    } finally {
      setSending(false);
    }
  }

  if (!isFinance) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Access Restricted
        </h2>
        <p className="text-muted-foreground">
          Only Business Finance team can create closure requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          New Closure Request
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select clusters to close and send the notification email
        </p>
      </div>

      {/* Email recipients */}
      <div className="glass-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-400" />
          Email Recipients
        </h2>

        <div>
          <label className="form-label">
            To <span className="text-red-400">*</span>
          </label>
          <EmailTagInput
            value={toEmails}
            onChange={setToEmails}
            placeholder="Add recipients..."
            id="to-emails"
          />
        </div>

        <div>
          <label className="form-label">CC</label>
          <EmailTagInput
            value={ccEmails}
            onChange={setCcEmails}
            placeholder="Add CC recipients..."
            id="cc-emails"
          />
        </div>
      </div>

      {/* Cluster selection */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-foreground">
              Select Clusters
            </h2>
            {selectedClusterIds.size > 0 && (
              <span className="badge bg-indigo-500/15 text-indigo-400 border-indigo-500/30">
                {selectedClusterIds.size} selected
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="form-input pl-9 py-2 text-sm w-[200px]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="h-48 skeleton rounded-lg" />
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-800/30">
            {filteredClusters.map((cluster) => {
              const isSelected = selectedClusterIds.has(cluster.id);
              return (
                <label
                  key={cluster.id}
                  className={cn(
                    'flex items-center px-5 py-3.5 cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-indigo-500/5'
                      : 'hover:bg-secondary/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center mr-4 transition-all flex-shrink-0',
                      isSelected
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-zinc-600'
                    )}
                    onClick={() => toggleCluster(cluster.id)}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      Cluster {cluster.cluster_marker}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cluster.ops_name || cluster.finance_name || 'Unnamed'}{' '}
                      • {cluster.city || 'No city'} •{' '}
                      {cluster.kitchens.length} brands
                    </p>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0 ml-4">
                    {cluster.kitchens.slice(0, 4).map((k) => (
                      <span
                        key={k.id}
                        className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground"
                      >
                        {k.brand}
                      </span>
                    ))}
                    {cluster.kitchens.length > 4 && (
                      <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground">
                        +{cluster.kitchens.length - 4}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={() => setShowPreview(true)}
          disabled={selectedClusterIds.size === 0 || toEmails.length === 0}
          className="btn btn-primary"
        >
          <Eye className="w-4 h-4" />
          Preview Email
        </button>
      </div>

      {/* Email Preview Modal */}
      {showPreview && (
        <div
          className="modal-overlay"
          onClick={() => !sending && setShowPreview(false)}
        >
          <div
            className="modal-content p-0"
            style={{ maxWidth: '720px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Email Preview
              </h3>
              <button
                onClick={() => !sending && setShowPreview(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email content */}
            <div className="px-6 py-5 space-y-4">
              {/* Meta */}
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16">Subject:</span>
                  <span className="text-foreground">
                    Kitchen Closure Request —{' '}
                    {format(new Date(), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16">To:</span>
                  <span className="text-foreground">
                    {toEmails.join(', ')}
                  </span>
                </div>
                {ccEmails.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16">CC:</span>
                    <span className="text-foreground">
                      {ccEmails.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <hr className="border-border" />

              {/* Body */}
              <div className="text-sm text-foreground space-y-4">
                <p>Hi Team,</p>
                <p>
                  Please find below the list of kitchens identified for
                  closure:
                </p>

                <div className="rounded-lg overflow-hidden border border-zinc-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/80">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                          Cluster Marker
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                          Brand
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                          Kitchen Name
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                          City
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {emailRows.map((row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-secondary/30"
                        >
                          <td className="px-4 py-2 text-foreground font-medium">
                            {row.cluster_marker}
                          </td>
                          <td className="px-4 py-2">{row.brand}</td>
                          <td className="px-4 py-2">
                            {row.kitchen_name}
                          </td>
                          <td className="px-4 py-2">{row.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p>
                  Kindly review and update the status on the dashboard.
                </p>
                <p>
                  Regards,
                  <br />
                  {user?.name}
                  <br />
                  <span className="text-muted-foreground">{user?.email}</span>
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowPreview(false)}
                disabled={sending}
                className="btn btn-secondary"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="btn btn-primary"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm & Send
                  </>
                )}
              </button>
            </div>
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

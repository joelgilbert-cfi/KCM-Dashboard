'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import type { KitchenMaster } from '@/lib/types';
import { formatDateForEmail } from '@/lib/utils';
import { EmailRecipientSelect, type EmailOption } from '@/components/email-recipient-select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Loader2,
  Mail,
  Send,
  X,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

export default function NewClosureRequestPage() {
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();

  const [kitchens, setKitchens] = useState<KitchenMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Selected clusters
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [clusterSearchOpen, setClusterSearchOpen] = useState(false);

  // Email recipients
  const [toEmails, setToEmails] = useState<EmailOption[]>([]);
  const [ccEmails, setCcEmails] = useState<EmailOption[]>([]);

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function fetchKitchens() {
      const { data } = await supabase
        .from('kitchen_master')
        .select('*')
        .is('removed_at', null)
        .order('cluster_marker', { ascending: true });

      if (data) setKitchens(data as KitchenMaster[]);
      setLoading(false);
    }
    fetchKitchens();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get unique cluster markers
  const uniqueClusters = useMemo(() => {
    const clusters = new Map<string, string>();
    kitchens.forEach((k) => {
      if (!clusters.has(k.cluster_marker)) {
        clusters.set(k.cluster_marker, k.kitchen_name || k.cluster_marker);
      }
    });
    return Array.from(clusters.entries())
      .map(([marker, name]) => ({
        marker,
        name,
      }))
      .sort((a, b) =>
        a.marker.localeCompare(b.marker, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [kitchens]);

  // Get brands for selected clusters
  const selectedBrands = useMemo(() => {
    return kitchens.filter((k) => selectedClusters.includes(k.cluster_marker));
  }, [kitchens, selectedClusters]);

  const toggleCluster = (marker: string) => {
    setSelectedClusters((prev) =>
      prev.includes(marker) ? prev.filter((c) => c !== marker) : [...prev, marker]
    );
  };

  const canSend = selectedClusters.length > 0 && toEmails.length > 0;

  const handleSend = async () => {
    if (!canSend || !user) return;
    setSending(true);
    setSendError('');

    try {
      // Create closure request record
      const { data: request, error: reqError } = await supabase
        .from('closure_requests')
        .insert({
          requested_by: user.id,
          status: 'Draft',
          to_emails: toEmails.map((e) => e.value),
          cc_emails: ccEmails.map((e) => e.value),
        })
        .select()
        .single();

      if (reqError || !request) throw reqError ?? new Error('Failed to create closure request');

      // Insert cluster linkages
      const clusterInserts = selectedClusters.map((marker) => ({
        request_id: request.id,
        cluster_marker: marker,
      }));
      const { error: clusterError } = await supabase.from('closure_request_clusters').insert(clusterInserts);

      if (clusterError) throw clusterError;

      // Send email via API route
      const response = await fetch('/api/send-closure-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmails: toEmails.map((e) => e.value),
          ccEmails: ccEmails.map((e) => e.value),
          senderName: user.name,
          brands: selectedBrands.map((b) => ({
            cluster_marker: b.cluster_marker,
            brand: b.brand,
            kitchen_name: b.kitchen_name || '',
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send email');
      }

      const { error: updateError } = await supabase
        .from('closure_requests')
        .update({
          status: 'Sent',
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      router.push('/closure-requests');
    } catch (error) {
      console.error('Error sending closure request:', error);
      setSendError(error instanceof Error ? error.message : 'Failed to send closure email');
    } finally {
      setSending(false);
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/closure-requests">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Closure Request</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select clusters and recipients, then preview and send
          </p>
        </div>
      </div>

      {/* Step 1: Select Clusters */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">1. Select Clusters</CardTitle>
          <CardDescription>Choose which clusters to include in the closure request</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={clusterSearchOpen} onOpenChange={setClusterSearchOpen}>
            <PopoverTrigger
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <span>
                {selectedClusters.length > 0
                  ? `${selectedClusters.length} cluster(s) selected`
                  : 'Select clusters...'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search clusters..." />
                <CommandList>
                  <CommandEmpty>No clusters found.</CommandEmpty>
                  <CommandGroup>
                    {uniqueClusters.map((cluster) => (
                      <CommandItem
                        key={cluster.marker}
                        onSelect={() => toggleCluster(cluster.marker)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedClusters.includes(cluster.marker) ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span className="font-medium">{cluster.marker}</span>
                        <span className="ml-2 text-muted-foreground text-xs">{cluster.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedClusters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedClusters.map((marker) => (
                <Badge key={marker} variant="secondary" className="text-sm gap-1">
                  {marker}
                  <button
                    onClick={() => toggleCluster(marker)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Email Recipients */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">2. Email Recipients</CardTitle>
          <CardDescription>Add To and CC email addresses — type and press Enter</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">To *</Label>
            <EmailRecipientSelect
              value={toEmails}
              onChange={setToEmails}
              placeholder="Type email and press Enter..."
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">CC</Label>
            <EmailRecipientSelect
              value={ccEmails}
              onChange={setCcEmails}
              placeholder="Type email and press Enter..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          disabled={!canSend}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview Email
        </Button>
        <Button
          onClick={() => setShowPreview(true)}
          disabled={!canSend}
          className="bg-brand hover:bg-brand-dark"
        >
          <Send className="mr-2 h-4 w-4" />
          Preview & Send
        </Button>
      </div>

      {/* Email Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preview
            </DialogTitle>
            <DialogDescription>Review the email before sending</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
              <div>
                <strong>Subject:</strong> Kitchen Closure Request — {formatDateForEmail()}
              </div>
              <div>
                <strong>To:</strong> {toEmails.map((e) => e.value).join(', ')}
              </div>
              {ccEmails.length > 0 && (
                <div>
                  <strong>CC:</strong> {ccEmails.map((e) => e.value).join(', ')}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-4">Hi Team,</p>
              <p className="mb-4">Please find below the list of kitchens identified for closure:</p>

              <div className="rounded border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Cluster Marker</TableHead>
                      <TableHead className="text-xs font-semibold">Brand</TableHead>
                      <TableHead className="text-xs font-semibold">Kitchen Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBrands.map((b) => (
                      <TableRow key={`${b.cluster_marker}-${b.brand}`}>
                        <TableCell className="font-medium">{b.cluster_marker}</TableCell>
                        <TableCell>{b.brand}</TableCell>
                        <TableCell>{b.kitchen_name || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="mt-4">
                Please review and update the status on the dashboard:{' '}
                <span className="text-brand underline">{process.env.NEXT_PUBLIC_APP_URL || 'https://kcm.curefoods.com'}</span>
              </p>
              <p className="mt-4">
                Regards,
                <br />
                {user?.name || 'Finance Team'}
              </p>
            </div>
          </div>

          {sendError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {sendError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Go Back
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-brand hover:bg-brand-dark"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirm & Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

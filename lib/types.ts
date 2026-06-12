// ============================================
// Database Types — matches Supabase schema
// ============================================

export type UserRole = 'finance' | 'expansion' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type ClusterStatus = 'Active' | 'Under Closure' | 'Closed';
export type KitchenFormat = 'Cloud' | 'Restaurant' | 'Takeaway';

export interface Cluster {
  id: string;
  cluster_marker: string;
  brand: string | null;
  kitchen_name: string | null;
  format: string | null;
  status: ClusterStatus;
  added_by: string | null;
  added_at: string;
  removed_at: string | null;
}



export type ClosureRequestStatus = 'Draft' | 'Sent';

export interface ClosureRequest {
  id: string;
  requested_by: string;
  status: ClosureRequestStatus;
  to_emails: string[];
  cc_emails: string[];
  email_sent_at: string | null;
  created_at: string;
}

export interface ClosureRequestCluster {
  id: string;
  request_id: string;
  cluster_id: string;
}

export type LockInStatus = 'Yes' | 'No' | 'Closed';
export type ClosureProgress = 'Initiated' | 'In Progress' | 'Completed';

export interface ClosureTracker {
  id: string;
  cluster_marker: string;
  ops_closed: boolean;
  last_ops_date: string | null;
  last_rent_date: string | null;
  ll_clearance: boolean | null;
  lock_in: LockInStatus | null;
  lock_in_end_date: string | null;
  sd: number | null;
  sd_adjustment: number | null;
  sd_recovery: number | null;
  notice_period: string | null;
  dec_net_revenue: number | null;
  dec_ebitda: number | null;
  rental_hit_lock_in: number | null;
  capex: number | null;
  framework: number | null;
  closure_phasing: number | null;
  hr_remarks: string | null;
  remarks: string | null;
  on_hold: boolean;
  progress: ClosureProgress | null;
  updated_by: string | null;
  updated_at: string;
}

export type AssetCondition = 'Good' | 'Fair' | 'Poor' | 'Damaged';
export type AssetStatus = 'In Kitchen' | 'Moved to Warehouse' | 'Sold' | 'Disposed';

export interface FixedAsset {
  id: string;
  cluster_id: string;
  asset_name: string;
  category: string | null;
  purchase_date: string | null;
  value: number | null;
  condition: AssetCondition | null;
  current_status: AssetStatus;
  created_at: string;
}

export interface AssetMovement {
  id: string;
  asset_id: string;
  cluster_id: string;
  moved_to: string;
  movement_date: string;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface AssetSale {
  id: string;
  asset_id: string;
  cluster_id: string;
  sale_price: number | null;
  buyer: string | null;
  sale_date: string;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
}

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  changed_by: string | null;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

// ============================================
// Extended types with joins
// ============================================



export interface ClusterWithTracker extends Cluster {
  closure_tracker: ClosureTracker[];
}

export interface ClosureRequestWithClusters extends ClosureRequest {
  closure_request_clusters: (ClosureRequestCluster & {
    clusters: Cluster;
  })[];
  users: User;
}

export interface FixedAssetWithKitchen extends FixedAsset {
  clusters: Cluster;
}

export interface AssetMovementWithDetails extends AssetMovement {
  fixed_asset_register: FixedAsset;
  clusters: Cluster;
  users: User | null;
}

export interface AssetSaleWithDetails extends AssetSale {
  fixed_asset_register: FixedAsset;
  clusters: Cluster;
  users: User | null;
}

export interface AuditLogWithUser extends AuditLogEntry {
  users: User | null;
}

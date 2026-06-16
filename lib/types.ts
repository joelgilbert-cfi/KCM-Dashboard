// TypeScript types for all 9 database tables
// Matches the SQL schema from the project plan

export type UserRole = 'finance' | 'expansion' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface EmailContact {
  id: string;
  name: string;
  email: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type KitchenStatus = 'Active' | 'Under Closure' | 'Closed';

export interface KitchenMaster {
  id: string;
  cluster_marker: string;
  brand: string;
  kitchen_name: string | null;
  format: string | null;
  status: KitchenStatus;
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
  // Joined fields
  requester?: User;
  clusters?: ClosureRequestCluster[];
}

export interface ClosureRequestCluster {
  id: string;
  request_id: string;
  cluster_marker: string;
}

export interface KitchenStatusTracker {
  id: string;
  // Identity
  cluster_marker: string;
  kitchen_name: string | null;
  oracle_code: string | null;
  // Cluster info
  rent: number | null;
  city: string | null;
  zone: string | null;
  format_final: string | null;
  entity: string | null;
  // Status fields
  status: string | null;
  reason_for_change: string | null;
  lock_in: string | null;
  lock_in_end_date: string | null;
  ops_closed: string | null;
  last_ops_date: string | null;
  last_rent_date: string | null;
  ll_clearance: string | null;
  shut_suspend_continue: string | null;
  // Financial fields
  dec_net_revenue: number | null;
  dec_ebitda: number | null;
  sd: number | null;
  sd_adjustment: number | null;
  sd_recovery: number | null;
  // Remarks and other
  remarks: string | null;
  notice_period: string | null;
  remarks_2: string | null;
  rental_hit_till_lock_in: number | null;
  capex: number | null;
  framework: number | null;
  closure_phasing: number | null;
  hr_remarks: string | null;
  // Metadata
  updated_by: string | null;
  updated_at: string;
}

export type AssetCondition = 'Good' | 'Fair' | 'Poor' | 'Damaged';
export type AssetStatus = 'In Kitchen' | 'Moved to Warehouse' | 'Sold' | 'Disposed';

export interface FixedAssetRegister {
  id: string;
  kitchen_id: string;
  asset_name: string;
  category: string | null;
  purchase_date: string | null;
  value: number | null;
  condition: AssetCondition | null;
  current_status: AssetStatus;
  created_at: string;
  // Joined fields
  kitchen?: KitchenMaster;
}

export interface AssetMovement {
  id: string;
  from_location: string | null;
  from_oracle_code: string | null;
  to_location: string | null;
  to_oracle_code: string | null;
  item_name: string | null;
  quantity: number | null;
  movement_date: string | null;
  asset_id: string | null;
  kitchen_id: string | null;
  logged_by: string | null;
  created_at: string;
  // Joined fields
  asset?: FixedAssetRegister;
  kitchen?: KitchenMaster;
  logger?: User;
}

export interface AssetSale {
  id: string;
  asset_id: string | null;
  kitchen_id: string | null;
  item_name: string | null;
  quantity: number | null;
  sale_price: number | null;
  buyer: string | null;
  sale_date: string | null;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
  // Joined fields
  asset?: FixedAssetRegister;
  kitchen?: KitchenMaster;
  logger?: User;
}

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  changed_by: string | null;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  // Joined fields
  changer?: User;
}

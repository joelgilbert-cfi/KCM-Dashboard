# Data Models

The database is built on PostgreSQL, managed via Supabase. It consists of 9 core tables. All tables enforce Row Level Security (RLS) to restrict data access based on the user's role (`finance`, `expansion`, `admin`).

See `supabase/migrations/` for the exact SQL definitions. See `lib/types.ts` for the TypeScript interfaces mapping to these tables.

## 1. `users`
Stores user profile information and their assigned role.
- **Fields**: `id` (UUID), `name`, `email`, `role` (`finance`, `expansion`, `admin`), `created_at`.

## 2. `kitchen_master`
The definitive list of kitchens.
- **Fields**: `id` (UUID), `cluster_marker`, `brand`, `kitchen_name`, `format`, `status` (`Active`, `Under Closure`, `Closed`), `added_by`, `added_at`, `removed_at`.
- **Relations**: `added_by` -> `users(id)`.

## 3. `kitchen_status`
Tracks the complex operational and financial metrics associated with a kitchen's closure process.
- **Fields**: `id` (UUID), `cluster_marker` (UNIQUE), `kitchen_name`, `oracle_code`, `rent`, `city`, `zone`, `format_final`, `status`, `dec_net_revenue`, `dec_ebitda`, `remarks`, etc.
- **Relations**: `updated_by` -> `users(id)`.

## 4. `closure_requests`
Represents an intention or action to send a closure notification email.
- **Fields**: `id` (UUID), `requested_by`, `status` (`Draft`, `Sent`), `to_emails` (TEXT[]), `cc_emails` (TEXT[]), `email_sent_at`, `created_at`.
- **Relations**: `requested_by` -> `users(id)`.

## 5. `closure_request_clusters`
A mapping table connecting `closure_requests` to specific kitchens (via `cluster_marker`).
- **Fields**: `id` (UUID), `request_id`, `cluster_marker`.
- **Relations**: `request_id` -> `closure_requests(id)`.

## 6. `fixed_asset_register` (FAR)
Logs physical assets belonging to kitchens.
- **Fields**: `id` (UUID), `kitchen_id`, `asset_name`, `category`, `value`, `condition`, `current_status` (`In Kitchen`, `Moved to Warehouse`, `Sold`, `Disposed`), `created_at`.
- **Relations**: `kitchen_id` -> `kitchen_master(id)`.

## 7. `asset_movements`
Tracks the logistics of an asset moving from one location to another.
- **Fields**: `id` (UUID), `from_location`, `to_location`, `item_name`, `quantity`, `asset_id`, `kitchen_id`, `logged_by`, `movement_date`.
- **Relations**: `asset_id` -> `fixed_asset_register(id)`, `kitchen_id` -> `kitchen_master(id)`, `logged_by` -> `users(id)`.

## 8. `asset_sales`
Records the sale of an asset.
- **Fields**: `id` (UUID), `asset_id`, `kitchen_id`, `item_name`, `sale_price`, `buyer`, `sale_date`, `logged_by`.
- **Relations**: `asset_id` -> `fixed_asset_register(id)`, `kitchen_id` -> `kitchen_master(id)`, `logged_by` -> `users(id)`.

## 9. `audit_log`
An automatically populated log of system changes.
- **Fields**: `id` (UUID), `table_name`, `record_id`, `action` (`INSERT`, `UPDATE`, `DELETE`), `changed_by`, `old_data` (JSONB), `new_data` (JSONB), `changed_at`.
- **Mechanism**: Populated via PostgreSQL triggers (e.g., `audit_kitchen_status`).

## 10. `email_contacts`
Manual email contacts list for autocomplete in the Closure Requests flow.
- **Fields**: `id` (UUID), `name`, `email` (UNIQUE), `created_by`, `created_at`, `updated_at`.

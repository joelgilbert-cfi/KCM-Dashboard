# Data Models

The database is built on PostgreSQL via Supabase. For the full raw schema and RLS policies, see `supabase-schema.sql`. For TypeScript types, see `lib/types.ts`.

## Key Entities

### Users
- **Table**: `users`
- **Fields**: `id`, `name`, `email`, `role` (`finance`, `expansion`, `admin`).
- **Purpose**: Tracks system users and their permissions.

### Clusters & Kitchens
- **Table**: `clusters` (groups of kitchens), `kitchens` (individual brands/units).
- **Relationships**: A Cluster has many Kitchens.
- **Fields**: Location info, format (`Cloud`, `Restaurant`), status (`Active`, `Under Closure`, `Closed`).

### Closure Tracker
- **Table**: `closure_tracker`
- **Purpose**: Detailed operational and financial tracker for cluster closures.
- **Fields**: `last_ops_date`, `lock_in`, `sd_recovery`, `progress`, etc.

### Fixed Asset Register (FAR)
- **Tables**: `fixed_asset_register`, `asset_movements`, `asset_sales`.
- **Purpose**: Tracks assets per kitchen, their condition, and lifecycle (movement to warehouse, sales, disposal).
- **Triggers**: Automated triggers (`update_asset_status_on_movement`, `update_asset_status_on_sale`) update the main FAR table status when movements or sales are recorded.

### Closure Requests
- **Tables**: `closure_requests`, `closure_request_clusters`.
- **Purpose**: Manages the formal request workflow to initiate closures, including email recipients and status.

### Audit Log
- **Table**: `audit_log`
- **Purpose**: System-wide logging of all `INSERT`, `UPDATE`, `DELETE` operations.
- **Implementation**: Populated automatically by PostgreSQL triggers on all major tables.

## Row Level Security (RLS)
The database enforces strict RLS:
- **Finance**: Manages FAR, Closure Requests. Views Clusters, Kitchens, Closure Tracker.
- **Expansion**: Manages Clusters, Kitchens, Closure Tracker, Asset Movements/Sales. Views FAR, Closure Requests.
- **Admin**: Full access.
